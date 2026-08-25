import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPaymentOrder, verifyPaymentSignature } from '@/lib/razorpay';

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
    const { action, ledgerId, amount, razorpayPaymentId, razorpayOrderId, razorpaySignature, targetUserId } = body;

    // Action 1: Create Payment Order
    if (action === 'create-order') {
      const order = await createPaymentOrder({
        amount: parseFloat(amount),
        receipt: `rcpt_${ledgerId || Date.now()}`,
        notes: { ledgerId: ledgerId || '' },
      });

      return NextResponse.json({ success: true, order });
    }

    // Action 2: Verify & Settle Ledger
    if (action === 'verify-payment') {
      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
      }

      if (ledgerId) {
        const ledger = await prisma.ledgerEntry.findUnique({
          where: { id: ledgerId },
        });

        if (ledger) {
          // Mark ledger as completed
          await prisma.ledgerEntry.update({
            where: { id: ledgerId },
            data: {
              status: 'COMPLETED',
              razorpayPaymentId,
            },
          });

          // Update GamePlayer paymentStatus to PAID
          if (ledger.gameId) {
            await prisma.gamePlayer.updateMany({
              where: {
                gameId: ledger.gameId,
                userId: ledger.fromUserId,
              },
              data: { paymentStatus: 'PAID' },
            });
          }

          // Create notification for payee
          await prisma.notification.create({
            data: {
              userId: ledger.toUserId,
              title: 'Payment Received',
              message: `Received ₹${ledger.amount} for ${ledger.description}`,
              type: 'PAYMENT_RECEIVED',
            },
          });
        }
      }

      return NextResponse.json({ success: true, message: 'Payment settled successfully!' });
    }

    // Action 3: Send Reminder
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
