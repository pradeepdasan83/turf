import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body || {};

    if (!email || String(email).trim() === '') {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email. Please sign up.' },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(String(password), user.password);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Incorrect password.' }, { status: 401 });
    }

    const { password: _pw, ...userSession } = user;
    return NextResponse.json({
      success: true,
      user: userSession,
      message: 'Signed in successfully!',
    });
  } catch (error) {
    console.error('Auth Login error:', error);
    return NextResponse.json({ success: false, error: 'Sign in failed. Please try again.' }, { status: 500 });
  }
}
