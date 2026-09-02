// Applies enable-rls.sql to the database in DATABASE_URL/DIRECT_URL.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, 'enable-rls.sql'), 'utf8');

const statements = sql
  .split('\n')
  .filter((l) => !l.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

const prisma = new PrismaClient();
try {
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
    console.log('✓', stmt.replace(/\s+/g, ' '));
  }
  // Report RLS status
  const rows = await prisma.$queryRawUnsafe(
    `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  );
  console.log('\nRLS status:', JSON.stringify(rows));
  console.log('Done.');
} catch (e) {
  console.error('RLS apply failed:', e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
