// One-time migration: bcrypt-hash any plaintext passwords still in the DB.
// Idempotent — rows already hashed ($2a/$2b/$2y) are skipped.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const isHashed = (v) => typeof v === 'string' && /^\$2[aby]\$/.test(v);

try {
  const users = await prisma.user.findMany({ select: { id: true, name: true, password: true } });
  let migrated = 0;
  for (const u of users) {
    if (isHashed(u.password)) continue;
    const hash = await bcrypt.hash(String(u.password ?? ''), 10);
    await prisma.user.update({ where: { id: u.id }, data: { password: hash } });
    console.log('✓ hashed password for', u.name);
    migrated++;
  }
  console.log(`Done. Hashed ${migrated} of ${users.length} users.`);
} catch (e) {
  console.error('Password migration failed:', e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
