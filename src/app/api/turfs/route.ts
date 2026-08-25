import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const turfs = await prisma.turf.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, turfs });
  } catch (error) {
    console.error('Turfs list error:', error);
    return NextResponse.json({ success: true, turfs: [] });
  }
}

// Organizer adds their own turf
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, location, sport = 'Football', hourlyRate, contact } = body || {};

    if (!name || !String(name).trim()) {
      return NextResponse.json({ success: false, error: 'Turf name is required' }, { status: 400 });
    }

    const turf = await prisma.turf.create({
      data: {
        name: String(name).trim(),
        location: String(location || '').trim() || 'Location not set',
        sport,
        hourlyRate: parseFloat(hourlyRate) || 0,
        contact: contact ? String(contact).trim() : null,
      },
    });

    return NextResponse.json({ success: true, turf });
  } catch (error) {
    console.error('Create turf error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add turf' }, { status: 500 });
  }
}
