import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface SessionUser {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  avatar: string | null;
}

// Permission definitions per role
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

// Check if user has permission
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = PERMISSIONS[userRole];
  if (rolePermissions.includes('*')) return true;
  
  // Check for wildcard in permission categories (e.g., 'tournament:*' matches 'tournament:create')
  const [category] = permission.split(':');
  if (rolePermissions.includes(`${category}:*`)) return true;
  
  return rolePermissions.includes(permission);
}

// Get session from request
export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  try {
    let token: string | undefined;
    
    if (request) {
      // Get from Authorization header or cookie
      token = request.headers.get('authorization')?.replace('Bearer ', '') ||
              request.cookies.get('session_token')?.value;
    } else {
      // Server-side: get from cookies
      const cookieStore = await cookies();
      token = cookieStore.get('session_token')?.value;
    }
    
    if (!token) return null;
    
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
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

// Create session
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await db.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });
  
  return token;
}

// Destroy session
export async function destroySession(token: string): Promise<void> {
  await db.session.deleteMany({
    where: { token }
  });
}

// Generate secure token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Middleware wrapper for protected routes
export function withAuth(
  handler: (request: NextRequest, user: SessionUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const user = await getSession(request);
    
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(request, user);
  };
}

// Middleware wrapper for role-based access
export function withRole(
  handler: (request: NextRequest, user: SessionUser) => Promise<Response>,
  allowedRoles: UserRole[]
) {
  return async (request: NextRequest) => {
    const user = await getSession(request);
    
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!allowedRoles.includes(user.role)) {
      return Response.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return handler(request, user);
  };
}

// Permission-based middleware
export function withPermission(
  handler: (request: NextRequest, user: SessionUser) => Promise<Response>,
  permission: string
) {
  return async (request: NextRequest) => {
    const user = await getSession(request);
    
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!hasPermission(user.role, permission)) {
      return Response.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return handler(request, user);
  };
}
