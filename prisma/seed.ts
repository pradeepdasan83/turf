import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Production-lean seed: clears everything and seeds only a few turfs so that
// organizers/players can book right away. No demo users, games, or ledgers —
// real accounts are created via phone OTP / email signup.
async function main() {
  console.log('Clearing database…');
  await prisma.otpCode.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.gamePlayer.deleteMany();
  await prisma.game.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.turf.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding turfs…');
  await prisma.turf.createMany({
    data: [
      { name: 'Green Valley Turf', location: '123 Sports Ave, Downtown', sport: 'Football', hourlyRate: 2000 },
      { name: 'Riverside Arena', location: 'Riverside Rd, Marine Drive', sport: 'Football', hourlyRate: 1800 },
      { name: 'City Hoops Court', location: 'MG Road, City Center', sport: 'Basketball', hourlyRate: 1200 },
      { name: 'Downtown Tennis Club', location: '5th Cross, Indiranagar', sport: 'Tennis', hourlyRate: 900 },
    ],
  });

  console.log('Done. Database cleared and turfs seeded.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
