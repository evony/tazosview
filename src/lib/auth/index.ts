// @ts-nocheck
import crypto from 'crypto';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════
// PASSWORD UTILITIES (from auth.ts)
// ═══════════════════════════════════════════════════════════

// Lazy SESSION_SECRET — avoids throwing during build (NODE_ENV=production but no env vars).
// At runtime, if still unset in production, we warn once and use a generated fallback.
// Each server restart generates a new secret, invalidating old tokens — this is intentional
// as a missing SESSION_SECRET in production is a misconfiguration.
let _sessionSecret: string | null = null;
function getSessionSecret(): string {
  if (_sessionSecret) return _sessionSecret;
  if (process.env.SESSION_SECRET) {
    _sessionSecret = process.env.SESSION_SECRET;
    return _sessionSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ SESSION_SECRET not set in production — using generated fallback. Set SESSION_SECRET env var for stable sessions.');
  }
  _sessionSecret = crypto.randomBytes(32).toString('hex');
  return _sessionSecret;
}

function hashPasswordSync(password: string, salt: string): string {
  const key = crypto.scryptSync(password, salt, 64);
  return salt + ':' + key.toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return hashPasswordSync(password, salt);
}

export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2');
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isBcryptHash(storedHash)) {
    try {
      const bcrypt = await import('bcryptjs');
      return bcrypt.compare(password, storedHash);
    } catch {
      return false;
    }
  }
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const key = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), key);
}

// ═══════════════════════════════════════════════════════════
// SESSION TOKEN UTILITIES (from auth.ts)
// ═══════════════════════════════════════════════════════════

export function createSessionToken(adminId: string, role: string): string {
  const payload = `${adminId}:${role}:${Date.now()}`;
  const signature = sign(payload);
  return `${payload}:${signature}`;
}

export function verifySessionToken(token: string): { adminId: string; role: string } | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 4) return null;
    const [adminId, role, timestamp, signature] = parts;
    const payload = `${adminId}:${role}:${timestamp}`;
    const expectedSignature = sign(payload);
    if (signature !== expectedSignature) return null;
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (tokenAge > maxAge) return null;
    return { adminId, role };
  } catch {
    return null;
  }
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(data).digest('hex').slice(0, 32);
}

// ═══════════════════════════════════════════════════════════
// ADMIN DATABASE OPERATIONS (from auth.ts)
// ═══════════════════════════════════════════════════════════

export async function getAdminByUsername(username: string) {
  return db.admin.findUnique({ where: { username } });
}

export async function getAdminById(id: string) {
  return db.admin.findUnique({ where: { id } });
}

export async function createAdmin(username: string, password: string, role: string = 'admin') {
  const passwordHash = await hashPassword(password);
  return db.admin.create({
    data: { username, passwordHash, role },
  });
}

export async function authenticateAdmin(username: string, password: string) {
  const admin = await getAdminByUsername(username);
  if (!admin) return null;
  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) return null;
  return { id: admin.id, username: admin.username, role: admin.role };
}

// ═══════════════════════════════════════════════════════════
// COOKIE SESSION PARSING (from auth.ts)
// ═══════════════════════════════════════════════════════════

const SESSION_COOKIE_NAME = 'idm-admin-session';

export function getSessionFromCookies(cookieHeader: string | null): { username: string; role: string } | null {
  if (!cookieHeader) return null;
  const cookiesMap = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );
  const token = cookiesMap[SESSION_COOKIE_NAME];
  if (!token) return null;
  const decodedToken = decodeURIComponent(token);
  const result = verifySessionToken(decodedToken);
  if (!result) return null;
  return { username: result.adminId, role: result.role };
}

// ═══════════════════════════════════════════════════════════
// SESSION USER TYPE & PERMISSIONS (from index.ts)
// ═══════════════════════════════════════════════════════════

export interface SessionUser {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  avatar: string | null;
}

export const PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'tournament:create', 'tournament:read', 'tournament:update', 'tournament:delete',
    'team:create', 'team:read', 'team:update', 'team:delete',
    'match:create', 'match:read', 'match:update', 'match:delete',
    'user:read', 'user:update',
    'registration:*', 'bot:*', 'settings:*'
  ],
  MODERATOR: [
    'tournament:read', 'tournament:update',
    'team:read', 'team:update',
    'match:read', 'match:update',
    'registration:update'
  ],
  PLAYER: [
    'tournament:read',
    'team:read', 'team:join',
    'match:read',
    'registration:create', 'registration:read'
  ],
  USER: [
    'tournament:read',
    'team:read',
    'match:read'
  ]
};

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = PERMISSIONS[userRole];
  if (rolePermissions.includes('*')) return true;
  const [category] = permission.split(':');
  if (rolePermissions.includes(`${category}:*`)) return true;
  return rolePermissions.includes(permission);
}

// ═══════════════════════════════════════════════════════════
// DATABASE SESSION (from index.ts — user/session based)
// ═══════════════════════════════════════════════════════════

export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  try {
    let token: string | undefined;
    if (request) {
      token = request.headers.get('authorization')?.replace('Bearer ', '') ||
              request.cookies.get('session_token')?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get('session_token')?.value;
    }
    if (!token) return null;
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.session.delete({ where: { id: session.id } });
      }
      return null;
    }
    return {
      id: session.user.id,
      phone: session.user.phone,
      name: session.user.name,
      role: session.user.role,
      avatar: session.user.avatar
    };
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { userId, token, expiresAt }
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } });
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ═══════════════════════════════════════════════════════════
// ROUTE MIDDLEWARE HELPERS (from index.ts)
// ═══════════════════════════════════════════════════════════

export function withAuth(
  handler: (request: NextRequest, user: SessionUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const user = await getSession(request);
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, user);
  };
}

export function withRole(
  handler: (request: NextRequest, user: SessionUser) => Promise<Response>,
  allowedRoles: UserRole[]
) {
  return async (request: NextRequest) => {
    const user = await getSession(request);
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
    return handler(request, user);
  };
}

export function withPermission(
  handler: (request: NextRequest, user: SessionUser) => Promise<Response>,
  permission: string
) {
  return async (request: NextRequest) => {
    const user = await getSession(request);
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(user.role, permission)) {
      return Response.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
    return handler(request, user);
  };
}

// ═══════════════════════════════════════════════════════════
// RE-EXPORTS FROM SUB-MODULES
// ═══════════════════════════════════════════════════════════

export { hasAnyPermission, hasAllPermissions, getPermissions, ROLE_HIERARCHY, hasRoleOrHigher, getLowerRoles } from './permissions';
