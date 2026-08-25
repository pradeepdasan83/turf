import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCostSplit } from '@/lib/split-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        organizer: true,
        turf: true,
        players: {
          include: {
            user: true,
          },
        },
        ledgers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, games });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      organizerId = 'usr-rahul',
      turfId = 'turf-green-arena',
      title,
      sport = 'Football',
      date,
      startTime = '19:00',
      endTime = '20:30',
      totalCost,
      maxPlayers = 10,
      bookingType = 'ONETIME', // ONETIME, MULTIDATE, RECURRING
      dates = [], // array of string dates for MULTIDATE or RECURRING
    } = body;

    const targetDates = bookingType === 'ONETIME' || dates.length === 0 ? [date] : dates;

    // Times overlap when each interval starts before the other ends (HH:MM strings compare lexically)
    const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
      aStart < bEnd && bStart < aEnd;

    // Reject if this turf is already booked for any requested date/time
    const conflicts: string[] = [];
    for (const gameDate of targetDates) {
      const sameDay = await prisma.booking.findMany({
        where: { turfId, date: gameDate },
      });
      const clash = sameDay.some((b) => overlaps(startTime, endTime, b.startTime, b.endTime));
      if (clash) conflicts.push(gameDate);
    }

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          conflict: true,
          error:
            conflicts.length === 1
              ? `This turf is already booked on ${conflicts[0]} for ${startTime}–${endTime}.`
              : `This turf is already booked on: ${conflicts.join(', ')}.`,
        },
        { status: 409 }
      );
    }

    const createdGames = [];

    for (const gameDate of targetDates) {
      // Create Booking record
      const booking = await prisma.booking.create({
        data: {
          organizerId,
          turfId,
          date: gameDate,
          startTime,
          endTime,
          cost: parseFloat(totalCost),
          status: 'CONFIRMED',
          isRecurring: bookingType === 'RECURRING',
        },
      });

      // Create Game record
      const game = await prisma.game.create({
        data: {
          bookingId: booking.id,
          organizerId,
          turfId,
          title: title || `${sport} Match`,
          sport,
          date: gameDate,
          startTime,
          endTime,
          totalCost: parseFloat(totalCost),
          maxPlayers: parseInt(maxPlayers),
          status: 'UPCOMING',
        },
      });

      // Add organizer as first joined player (Paid share = totalCost / 1 for now)
      await prisma.gamePlayer.create({
        data: {
          gameId: game.id,
          userId: organizerId,
          shareAmount: parseFloat(totalCost),
          paymentStatus: 'PAID',
          roleInGame: 'ORGANIZER',
        },
      });

      createdGames.push(game);
    }

    return NextResponse.json({ success: true, games: createdGames });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ success: false, error: 'Failed to create game' }, { status: 500 });
  }
}
