import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Always read fresh from the DB (never statically cached at build time)
export const dynamic = 'force-dynamic';

// Dummy fallback roster (used if the DB is unavailable)
const DUMMY_USERS = [
  { id: 'usr-vijay', name: 'Vijay Verma', email: 'player@turfsplit.com', phone: '9876543212', role: 'PLAYER', upiId: 'vijay@paytm', avatarUrl: null },
  { id: 'usr-amit', name: 'Amit Kumar', email: 'amit@turfsplit.com', phone: '9876543213', role: 'PLAYER', upiId: 'amit@upi', avatarUrl: null },
  { id: 'usr-neha', name: 'Neha Singh', email: 'neha@turfsplit.com', phone: '9876543214', role: 'PLAYER', upiId: 'neha@upi', avatarUrl: null },
  { id: 'usr-rohit', name: 'Rohit Das', email: 'rohit@turfsplit.com', phone: '9876543215', role: 'PLAYER', upiId: 'rohit@upi', avatarUrl: null },
  { id: 'usr-sara', name: 'Sara Ali', email: 'sara@turfsplit.com', phone: '9876543216', role: 'PLAYER', upiId: 'sara@upi', avatarUrl: null },
];

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        upiId: true,
        avatarUrl: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.warn('Users list DB fallback triggered:', error);
    return NextResponse.json({ success: true, users: DUMMY_USERS });
  }
}
