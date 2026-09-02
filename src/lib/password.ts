import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(String(plain), ROUNDS);
}

// True if the stored value is already a bcrypt hash.
export function isHashed(value?: string | null): boolean {
  return typeof value === 'string' && /^\$2[aby]\$/.test(value);
}

// Verify a plaintext password against the stored value.
// Transparently supports legacy plaintext rows (equality) so nobody is locked
// out before the one-time migration runs — but all new writes are hashed.
export async function verifyPassword(plain: string, stored?: string | null): Promise<boolean> {
  if (!stored) return false;
  if (isHashed(stored)) return bcrypt.compare(String(plain), stored);
  return String(plain) === stored;
}
