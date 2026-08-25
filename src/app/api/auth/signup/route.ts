import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, phone, email, role = 'PLAYER', upiId, password = 'password123' } = await request.json();

    if (!name || (!phone && !email)) {
      return NextResponse.json(
        { success: false, error: 'Name and either Phone or Email are required' },
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

    const avatarUrl =
      role === 'ORGANIZER'
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCa5a-dLFVKOFNIXGHSgxfaerm1V3SaynbjhcWPVLt49ROV_fzipU7Uzl1crf8wqs_3Pi9P3y1lbVWAYCK3Q-YKYGDuWDnBHjipH9LSa5HqgfNheVFf6VMK23HLsqo5pU5IlbupKiN2PKW8CIgOpt5sEqu8rWFWJTqfwfxfUeOjBKDKYnc8nNV6dN9PI1EHZmqNICML4cD9LsxnhpOJEW9ALay1Fi8e1DEUJqO0P5lBLwkNWb3ljpE'
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3upCvl1WZnLnxTlX5Xz2w50kC83MDO_edJ2cTOaO5JbCzSD8czMWZEcCBB_6Pt0l-0EBXqg3ACsdK7x-NvAQVVrQY4zxR5rbddyvsrxxBVAcHjH7y6Z9ajsIAYrzK10WQW2nzAF0pWtjG06DH8TJyvHUYFfkrVfzGZG0ypJ9gHOgBG8rFpr8YPShzc8_sXNxqTcO4MPVGg5ersbg3GkgTXqaGUWEy6G0vDPGqTR-iiC9_hqgW3MI';

    const newUser = await prisma.user.create({
      data: {
        name,
        phone: cleanPhone,
        email: email || `${cleanPhone}@turfsplit.local`,
        password,
        role,
        upiId,
        avatarUrl,
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
