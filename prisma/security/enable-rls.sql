-- Lock down the public API (PostgREST) on all app tables.
--
-- Supabase exposes every table in the `public` schema through its REST API using
-- the public anon key. With RLS disabled, anyone with the project URL + anon key
-- can read/write all rows (including the User.password column).
--
-- Enabling RLS with NO policies denies the anon/authenticated roles all access via
-- the API. The app is unaffected: Prisma connects as the `postgres` table-owner
-- role, which bypasses RLS (we do not FORCE it).
--
-- Idempotent — safe to run repeatedly. Re-run after any future `prisma db push`
-- that recreates a table (via: npm run db:secure).

ALTER TABLE "User"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Turf"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Game"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GamePlayer"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LedgerEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Belt-and-suspenders: revoke the API roles' privileges on the public schema so
-- the tables are not reachable through PostgREST at all.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
