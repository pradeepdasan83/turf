import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeIndianPhone } from '@/lib/phone';
import { generateOtp, saveOtp } from '@/lib/otp-store';
import { sendOtpSms } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = body?.phone || '';

    // India-only validation
    const norm = normalizeIndianPhone(phone);
    if (!norm.valid) {
      return NextResponse.json(
        { success: false, error: norm.error || 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Is this an already-registered player? (non-fatal)
    let isExistingUser = false;
    try {
      const user = await prisma.user.findFirst({ where: { phone: norm.local } });
      isExistingUser = !!user;
    } catch (dbErr) {
      console.warn('DB lookup warning during send-otp:', dbErr);
    }

    // Generate, store (keyed on the normalized local number), and send
    const code = generateOtp();
    await saveOtp(norm.local, code);

    const result = await sendOtpSms(norm.local, code);

    if (result.provider === 'dev') {
      // No SMS provider configured — return the code so the flow is testable
      return NextResponse.json({
        success: true,
        devMode: true,
        otp: code,
        isExistingUser,
        message: `Dev mode: no SMS gateway configured. Your code is ${code} (valid 5 min).`,
      });
    }

    if (!result.sent) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send OTP. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      isExistingUser,
      message: `OTP sent to +91 ${norm.local}. It is valid for 5 minutes.`,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
