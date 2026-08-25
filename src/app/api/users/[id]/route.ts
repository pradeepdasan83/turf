import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH: update profile fields and/or change password
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, phone, upiId, avatarUrl, currentPassword, newPassword } = body || {};

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const data: Record<string, any> = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof email === 'string') data.email = email.trim().toLowerCase() || null;
    if (typeof phone === 'string') data.phone = phone.trim() || null;
    if (typeof upiId === 'string') data.upiId = upiId.trim() || null;
    if (typeof avatarUrl === 'string') data.avatarUrl = avatarUrl.trim() || null;

    // Password change flow (requires the current password to match)
    if (newPassword) {
      if (!currentPassword || currentPassword !== user.password) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      if (String(newPassword).length < 4) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 4 characters' },
          { status: 400 }
        );
      }
      data.password = String(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    const { password: _pw, ...cleanUser } = updated;
    return NextResponse.json({
      success: true,
      user: cleanUser,
      message: newPassword ? 'Profile & password updated!' : 'Profile updated!',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
