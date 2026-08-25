import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeIndianPhone } from '@/lib/phone';
import { verifyOtp } from '@/lib/otp-store';

const REASON_MESSAGE: Record<string, string> = {
  not_found: 'No OTP found. Please request a new code.',
  expired: 'This OTP has expired. Please request a new code.',
  too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
  mismatch: 'Incorrect OTP. Please try again.',
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, otp } = body || {};

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    const norm = normalizeIndianPhone(phone);
    if (!norm.valid) {
      return NextResponse.json(
        { success: false, error: norm.error || 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Verify the code against the OTP store (expiry + attempt limits enforced there)
    const result = await verifyOtp(norm.local, String(otp));
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: REASON_MESSAGE[result.reason] || 'Invalid OTP' },
        { status: 400 }
      );
    }

    // OTP valid — find or create the player
    let user = null;
    try {
      user = await prisma.user.findFirst({ where: { phone: norm.local } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: `Player (${norm.local.slice(-4)})`,
            phone: norm.local,
            role: 'PLAYER',
            avatarUrl:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuB3upCvl1WZnLnxTlX5Xz2w50kC83MDO_edJ2cTOaO5JbCzSD8czMWZEcCBB_6Pt0l-0EBXqg3ACsdK7x-NvAQVVrQY4zxR5rbddyvsrxxBVAcHjH7y6Z9ajsIAYrzK10WQW2nzAF0pWtjG06DH8TJyvHUYFfkrVfzGZG0ypJ9gHOgBG8rFpr8YPShzc8_sXNxqTcO4MPVGg5ersbg3GkgTXqaGUWEy6G0vDPGqTR-iiC9_hqgW3MI',
          },
        });
      }
    } catch (dbErr) {
      console.warn('DB user fallback during verify-otp:', dbErr);
      user = {
        id: `usr_temp_${norm.local}`,
        name: `Player (${norm.local.slice(-4)})`,
        phone: norm.local,
        role: 'PLAYER',
      } as any;
    }

    const { password: _pw, ...userSession } = user;

    return NextResponse.json({
      success: true,
      user: userSession,
      message: 'Verified successfully!',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ success: false, error: 'OTP verification failed' }, { status: 500 });
  }
}
