import { NextResponse } from 'next/server';
import { verifySessionToken, getAdminById } from './auth';
import { db } from './db';

/**
 * Verify admin session from request cookies.
 * Works with both NextRequest and standard Request.
 * Returns the admin data if authenticated, or null if not.
 */
export async function verifyAdmin(request: Request) {
  // Extract cookie from request header (works with both Request and NextRequest)
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionCookie = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('idm-admin-session='));

  if (!sessionCookie) return null;

  const token = decodeURIComponent(sessionCookie.split('=').slice(1).join('='));
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  const admin = await getAdminById(session.adminId);
  if (!admin) return null;

  return { id: admin.id, username: admin.username, role: admin.role };
}

/**
 * Helper to require admin auth in API routes.
 * Returns a response with 401 if not authenticated, or the admin data if authenticated.
 */
export async function requireAdmin(request: Request): Promise<{ id: string; username: string; role: string } | NextResponse> {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized - Admin login required' }, { status: 401 });
  }
  return admin;
}

/**
 * Helper to require super_admin role in API routes.
 * Returns 401 if not authenticated, 403 if not super_admin, or the admin data if authorized.
 */
export async function requireSuperAdmin(request: Request): Promise<{ id: string; username: string; role: string } | NextResponse> {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  if (result.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Forbidden - Super admin access required' },
      { status: 403 }
    );
  }
  return result;
}

/**
 * Verify player session from request cookies.
 * Returns the account data if authenticated, or null if not.
 */
export async function verifyPlayer(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionCookie = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('idm-player-session='));

  if (!sessionCookie) return null;

  const token = decodeURIComponent(sessionCookie.split('=').slice(1).join('='));
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session || session.role !== 'player') return null;

  const account = await db.account.findUnique({
    where: { id: session.adminId },
    include: {
      player: {
        select: {
          id: true,
          gamertag: true,
          name: true,
          division: true,
          tier: true,
          avatar: true,
        },
      },
    },
  });

  if (!account) return null;

  return { id: account.id, username: account.username, playerId: account.playerId, player: account.player };
}

/**
 * Helper to require player auth in API routes.
 * Returns a response with 401 if not authenticated, or the account data if authenticated.
 */
export async function requirePlayer(request: Request): Promise<{ id: string; username: string; playerId: string; player: { id: string; gamertag: string; name: string; division: string; tier: string; avatar: string | null } } | NextResponse> {
  const player = await verifyPlayer(request);
  if (!player) {
    return NextResponse.json({ error: 'Unauthorized - Player login required' }, { status: 401 });
  }
  return player;
}
