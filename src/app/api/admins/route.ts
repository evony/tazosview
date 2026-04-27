import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { requireSuperAdmin, requireAdmin } from '@/lib/api-auth';

/**
 * GET /api/admins - List all admins (super_admin only)
 */
export async function GET(request: NextRequest) {
  const result = await requireSuperAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const admins = await db.admin.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('List admins error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil daftar admin' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admins - Create a new admin (super_admin only)
 */
export async function POST(request: NextRequest) {
  const result = await requireSuperAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username minimal 3 karakter' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const validRoles = ['super_admin', 'admin'];
    const adminRole = role || 'admin';
    if (!validRoles.includes(adminRole)) {
      return NextResponse.json(
        { error: 'Role tidak valid. Gunakan: super_admin atau admin' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await db.admin.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const admin = await db.admin.create({
      data: {
        username,
        passwordHash,
        role: adminRole,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin berhasil dibuat',
      admin,
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat admin' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admins - Update admin (super_admin only, or self for limited fields)
 */
export async function PUT(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const { id, username, role } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID admin wajib diisi' },
        { status: 400 }
      );
    }

    // Check if target admin exists
    const targetAdmin = await db.admin.findUnique({ where: { id } });
    if (!targetAdmin) {
      return NextResponse.json(
        { error: 'Admin tidak ditemukan' },
        { status: 404 }
      );
    }

    const isSuperAdmin = result.role === 'super_admin';
    const isSelf = result.id === id;

    // Only super_admin can change roles and update other admins
    if (!isSuperAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk mengubah admin lain' },
        { status: 403 }
      );
    }

    // Non-super_admin cannot change roles
    if (!isSuperAdmin && role && role !== targetAdmin.role) {
      return NextResponse.json(
        { error: 'Hanya super admin yang dapat mengubah role' },
        { status: 403 }
      );
    }

    // Prevent super_admin from demoting themselves
    if (isSelf && isSuperAdmin && role && role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Anda tidak dapat menurunkan role diri sendiri' },
        { status: 400 }
      );
    }

    const updateData: { username?: string; role?: string } = {};
    if (username) updateData.username = username;
    if (role && isSuperAdmin) updateData.role = role;

    // Check for duplicate username if changing
    if (username && username !== targetAdmin.username) {
      const duplicate = await db.admin.findUnique({ where: { username } });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Username sudah digunakan' },
          { status: 409 }
        );
      }
    }

    const updated = await db.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin berhasil diperbarui',
      admin: updated,
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui admin' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admins - Delete admin (super_admin only)
 */
export async function DELETE(request: NextRequest) {
  const result = await requireSuperAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID admin wajib diisi' },
        { status: 400 }
      );
    }

    // Prevent deleting self
    if (result.id === id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun sendiri' },
        { status: 400 }
      );
    }

    const targetAdmin = await db.admin.findUnique({ where: { id } });
    if (!targetAdmin) {
      return NextResponse.json(
        { error: 'Admin tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.admin.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Admin "${targetAdmin.username}" berhasil dihapus`,
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus admin' },
      { status: 500 }
    );
  }
}
