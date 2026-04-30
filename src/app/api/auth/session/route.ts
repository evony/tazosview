import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, getAdminById } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const token = request.cookies.get('idm-admin-session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { headers });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { headers });
    }

    // Verify admin still exists in DB
    const admin = await getAdminById(session.adminId);
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { headers });
    }

    return NextResponse.json({
      authenticated: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    }, { headers });
  } catch {
    return NextResponse.json({ authenticated: false }, { headers });
  }
}
