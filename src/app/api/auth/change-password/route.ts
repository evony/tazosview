import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { requireAdmin } from '@/lib/api-auth';

/**
 * POST /api/auth/change-password - Change own password (any authenticated admin)
 */
export async function POST(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password lama dan baru wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Get current admin with password hash
    const admin = await db.admin.findUnique({ where: { id: result.id } });
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password lama tidak sesuai' },
        { status: 401 }
      );
    }

    // Update password
    const newPasswordHash = await hashPassword(newPassword);
    await db.admin.update({
      where: { id: result.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Gagal mengubah password' },
      { status: 500 }
    );
  }
}
