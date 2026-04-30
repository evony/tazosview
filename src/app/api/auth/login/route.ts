import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createSessionToken, hashPassword, isBcryptHash } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const admin = await authenticateAdmin(username, password);
    if (!admin) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Migrate bcrypt hash to scrypt on successful login
    try {
      const adminRecord = await db.admin.findUnique({ where: { id: admin.id } });
      if (adminRecord && isBcryptHash(adminRecord.passwordHash)) {
        const newHash = await hashPassword(password);
        await db.admin.update({
          where: { id: admin.id },
          data: { passwordHash: newHash },
        });
      }
    } catch (migrateError) {
      console.error('Hash migration error (non-critical):', migrateError);
      // Don't fail the login if migration fails
    }

    const token = createSessionToken(admin.id, admin.role);

    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    }, { headers: { 'Cache-Control': 'no-store' } });

    // Set httpOnly cookie
    response.cookies.set('idm-admin-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
