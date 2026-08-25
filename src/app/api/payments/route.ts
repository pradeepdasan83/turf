import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'usr-rahul';

    // Fetch ledger entries where user is fromUser (You owe) or toUser (Others owe you)
    const ledgers = await prisma.ledgerEntry.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: true,
        toUser: true,
        game: {
          include: {
            turf: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate balances
    let totalOwedToUser = 0; // Others owe you
    let totalUserOwes = 0;   // You owe

    const toReceiveList: any[] = [];
    const toPayList: any[] = [];
    const historyList: any[] = [];

    for (const entry of ledgers) {
      if (entry.status === 'PENDING') {
        if (entry.toUserId === userId && entry.fromUserId !== userId) {
          totalOwedToUser += entry.amount;
          toReceiveList.push(entry);
        } else if (entry.fromUserId === userId && entry.toUserId !== userId) {
          totalUserOwes += entry.amount;
          toPayList.push(entry);
        }
      } else {
        historyList.push(entry);
      }
    }

    return NextResponse.json({
      success: true,
      balance: {
        totalOwedToUser,
        totalUserOwes,
        netBalance: totalOwedToUser - totalUserOwes,
      },
      toReceive: toReceiveList,
      toPay: toPayList,
      history: historyList,
    });
  } catch (error) {
    console.error('Error fetching ledger payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ledgerId, gameId, fromUserId, amount, targetUserId } = body;

    // Mark a debt as settled (after the payer completes a UPI transfer).
    // Accepts a ledgerId, or a gameId + fromUserId to locate the pending entry.
    if (action === 'settle') {
      let ledger = null;
      if (ledgerId) {
        ledger = await prisma.ledgerEntry.findUnique({ where: { id: ledgerId } });
      } else if (gameId && fromUserId) {
        ledger = await prisma.ledgerEntry.findFirst({
          where: { gameId, fromUserId, status: 'PENDING' },
        });
      }

      if (ledger) {
        await prisma.ledgerEntry.update({
          where: { id: ledger.id },
          data: { status: 'COMPLETED' },
        });
        if (ledger.gameId) {
          await prisma.gamePlayer.updateMany({
            where: { gameId: ledger.gameId, userId: ledger.fromUserId },
            data: { paymentStatus: 'PAID' },
          });
        }
        await prisma.notification.create({
          data: {
            userId: ledger.toUserId,
            title: 'Payment Received',
            message: `Received ₹${ledger.amount} for ${ledger.description}`,
            type: 'PAYMENT_RECEIVED',
          },
        });
        return NextResponse.json({ success: true, message: 'Payment marked as settled!' });
      }

      // No ledger row (e.g. direct game-share payment) — just mark the player paid
      if (gameId && fromUserId) {
        await prisma.gamePlayer.updateMany({
          where: { gameId, userId: fromUserId },
          data: { paymentStatus: 'PAID' },
        });
        return NextResponse.json({ success: true, message: 'Payment marked as settled!' });
      }

      return NextResponse.json({ success: false, error: 'Nothing to settle' }, { status: 400 });
    }

    // Send Reminder
    if (action === 'send-reminder') {
      if (targetUserId) {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            title: 'Payment Reminder ⚽',
            message: `Friendly reminder: You have a pending payment of ₹${amount} for your turf match.`,
            type: 'PAYMENT_REMINDER',
          },
        });
      }

      return NextResponse.json({ success: true, message: 'Reminder sent successfully!' });
    }

    return NextResponse.json({ success: false, error: 'Invalid payment action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ success: false, error: 'Payment processing failed' }, { status: 500 });
  }
}
