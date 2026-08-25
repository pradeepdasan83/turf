import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Always read fresh from the DB (never statically cached at build time)
export const dynamic = 'force-dynamic';

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
    console.error('Users list error:', error);
    return NextResponse.json({ success: true, users: [] });
  }
}
