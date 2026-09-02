import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const { name, phone, email, role = 'PLAYER', upiId, password } = await request.json();

    if (!name || (!phone && !email)) {
      return NextResponse.json(
        { success: false, error: 'Name and either Phone or Email are required' },
        { status: 400 }
      );
    }
    if (!password || String(password).length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : null;

    // Check existing phone/email
    if (cleanPhone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: cleanPhone } });
      if (existingPhone) {
        return NextResponse.json({ success: false, error: 'Phone number is already registered. Please log in.' }, { status: 400 });
      }
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json({ success: false, error: 'Email address is already registered. Please log in.' }, { status: 400 });
      }
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone: cleanPhone,
        email: email || `${cleanPhone}@turfsplit.local`,
        password: await hashPassword(password),
        role,
        upiId,
      },
    });

    const { password: _, ...userSession } = newUser;

    return NextResponse.json({
      success: true,
      user: userSession,
      message: 'Account registered successfully!',
    });
  } catch (error) {
    console.error('Sign Up error:', error);
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
  }
}
