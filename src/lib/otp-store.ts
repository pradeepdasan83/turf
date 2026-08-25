// DB-backed OTP store — safe across serverless instances (Vercel).

import { prisma } from '@/lib/prisma';

export const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 6;

export function generateOtp(): string {
  // 6-digit numeric
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function saveOtp(phone: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.otpCode.upsert({
    where: { phone },
    create: { phone, code, expiresAt, attempts: 0 },
    update: { code, expiresAt, attempts: 0 },
  });
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'expired' | 'too_many_attempts' | 'mismatch' };

export async function verifyOtp(phone: string, code: string): Promise<VerifyResult> {
  const rec = await prisma.otpCode.findUnique({ where: { phone } });
  if (!rec) return { ok: false, reason: 'not_found' };

  if (Date.now() > rec.expiresAt.getTime()) {
    await prisma.otpCode.delete({ where: { phone } }).catch(() => {});
    return { ok: false, reason: 'expired' };
  }
  if (rec.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.otpCode.delete({ where: { phone } }).catch(() => {});
    return { ok: false, reason: 'too_many_attempts' };
  }
  if (rec.code !== String(code).trim()) {
    await prisma.otpCode.update({ where: { phone }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: 'mismatch' };
  }

  await prisma.otpCode.delete({ where: { phone } }).catch(() => {}); // one-time use
  return { ok: true };
}
