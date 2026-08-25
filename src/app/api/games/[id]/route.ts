import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCostSplit } from '@/lib/split-engine';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        organizer: true,
        turf: true,
        players: {
          include: {
            user: true,
          },
        },
        ledgers: {
          include: {
            fromUser: true,
            toUser: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Error fetching game details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch game' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, userId = 'usr-rahul', newDate, newStartTime, newEndTime } = body;

    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        players: true,
        organizer: true,
      },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    if (action === 'join') {
      // Check if user already joined
      const existing = game.players.find((p) => p.userId === userId);
      if (existing) {
        return NextResponse.json({ success: false, error: 'User already joined this game' });
      }

      if (game.players.length >= game.maxPlayers) {
        return NextResponse.json({ success: false, error: 'Game is full' }, { status: 400 });
      }

      // Add user to game
      await prisma.gamePlayer.create({
        data: {
          gameId: game.id,
          userId,
          shareAmount: 0,
          paymentStatus: 'PENDING',
          roleInGame: 'PLAYER',
        },
      });

      // Recalculate shares for all players in this game
      const updatedPlayers = await prisma.gamePlayer.findMany({
        where: { gameId: game.id },
      });

      const split = calculateCostSplit(game.totalCost, updatedPlayers.length);

      for (let i = 0; i < updatedPlayers.length; i++) {
        const player = updatedPlayers[i];
        const newShare = split.shares[i] || split.baseShare;

        await prisma.gamePlayer.update({
          where: { id: player.id },
          data: { shareAmount: newShare },
        });

        // Update or create ledger entry if player is not organizer
        if (player.userId !== game.organizerId) {
          const existingLedger = await prisma.ledgerEntry.findFirst({
            where: {
              gameId: game.id,
              fromUserId: player.userId,
              toUserId: game.organizerId,
            },
          });

          if (existingLedger) {
            if (existingLedger.status === 'PENDING') {
              await prisma.ledgerEntry.update({
                where: { id: existingLedger.id },
                data: { amount: newShare },
              });
            }
          } else {
            await prisma.ledgerEntry.create({
              data: {
                gameId: game.id,
                fromUserId: player.userId,
                toUserId: game.organizerId,
                amount: newShare,
                description: `Share for ${game.title}`,
                type: 'PLAYER_SETTLEMENT',
                status: 'PENDING',
              },
            });
          }
        }
      }

      // Create notification
      await prisma.notification.create({
        data: {
          userId: game.organizerId,
          title: 'Player Joined',
          message: `A new player joined ${game.title}. Per player cost recalculated to ₹${split.baseShare}`,
          type: 'GAME',
        },
      });

      return NextResponse.json({ success: true, message: 'Joined game successfully' });
    }

    if (action === 'leave') {
      const playerRecord = game.players.find((p) => p.userId === userId);
      if (!playerRecord) {
        return NextResponse.json({ success: false, error: 'User is not in this game' });
      }

      // Delete player record
      await prisma.gamePlayer.delete({
        where: { id: playerRecord.id },
      });

      // Remove pending ledger entry if any
      await prisma.ledgerEntry.deleteMany({
        where: {
          gameId: game.id,
          fromUserId: userId,
          status: 'PENDING',
        },
      });

      // Recalculate remaining shares
      const remainingPlayers = await prisma.gamePlayer.findMany({
        where: { gameId: game.id },
      });

      if (remainingPlayers.length > 0) {
        const split = calculateCostSplit(game.totalCost, remainingPlayers.length);
        for (let i = 0; i < remainingPlayers.length; i++) {
          const player = remainingPlayers[i];
          const newShare = split.shares[i] || split.baseShare;

          await prisma.gamePlayer.update({
            where: { id: player.id },
            data: { shareAmount: newShare },
          });

          if (player.userId !== game.organizerId) {
            await prisma.ledgerEntry.updateMany({
              where: {
                gameId: game.id,
                fromUserId: player.userId,
                status: 'PENDING',
              },
              data: { amount: newShare },
            });
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Left game successfully' });
    }

    if (action === 'reschedule') {
      const updatedGame = await prisma.game.update({
        where: { id: game.id },
        data: {
          date: newDate || game.date,
          startTime: newStartTime || game.startTime,
          endTime: newEndTime || game.endTime,
        },
      });

      // Notify all players
      for (const p of game.players) {
        await prisma.notification.create({
          data: {
            userId: p.userId,
            title: 'Game Rescheduled',
            message: `${game.title} has been rescheduled to ${newDate || game.date} at ${newStartTime || game.startTime}`,
            type: 'GAME_RESCHEDULED',
          },
        });
      }

      return NextResponse.json({ success: true, game: updatedGame });
    }

    if (action === 'complete') {
      const updatedGame = await prisma.game.update({
        where: { id: game.id },
        data: { status: 'COMPLETED' },
      });

      // Notify players the game is marked complete
      for (const p of game.players) {
        await prisma.notification.create({
          data: {
            userId: p.userId,
            title: 'Game Completed',
            message: `${game.title} has been marked as completed. Settle any pending dues.`,
            type: 'GAME',
          },
        });
      }

      return NextResponse.json({ success: true, game: updatedGame });
    }

    if (action === 'cancel') {
      const updatedGame = await prisma.game.update({
        where: { id: game.id },
        data: { status: 'CANCELLED' },
      });

      // Notify players
      for (const p of game.players) {
        await prisma.notification.create({
          data: {
            userId: p.userId,
            title: 'Game Cancelled',
            message: `${game.title} has been cancelled by the organizer.`,
            type: 'GAME_CANCELLED',
          },
        });
      }

      return NextResponse.json({ success: true, game: updatedGame });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ success: false, error: 'Failed to update game' }, { status: 500 });
  }
}
