import { NextRequest, NextResponse } from 'next/server'
import { User, UserRole } from '@prisma/client'
import { validateSession, getSessionToken } from './session'
import { hasPermission, hasRoleOrHigher } from './permissions'

/**
 * Auth context passed to protected route handlers
 */
export interface AuthContext {
  user: User
  userId: string
  userRole: UserRole
}

/**
 * Options for withAuth middleware
 */
export interface WithAuthOptions {
  /** Required role to access the route */
  requiredRole?: UserRole
  /** Required permissions to access the route */
  requiredPermissions?: string[]
  /** Allow access if user has any of these roles */
  allowedRoles?: UserRole[]
}

/**
 * Extended NextRequest with auth context
 */
export interface AuthenticatedRequest extends NextRequest {
  auth?: AuthContext
}

/**
 * API Route handler type
 */
type RouteHandler = (
  request: AuthenticatedRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse

/**
 * Middleware wrapper to protect routes with authentication
 */
export function withAuth(
  handler: RouteHandler,
  options: WithAuthOptions = {}
): RouteHandler {
  return async (request: AuthenticatedRequest, context) => {
    try {
      // Get token from cookie or Authorization header
      let token = await getSessionToken()
      
      // Also check Authorization header for API clients
      if (!token) {
        const authHeader = request.headers.get('Authorization')
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7)
        }
      }
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }
      
      // Validate session
      const user = await validateSession(token)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired session', code: 'SESSION_EXPIRED' },
          { status: 401 }
        )
      }
      
      // Check role requirements
      if (options.requiredRole) {
        if (!hasRoleOrHigher(user.role, options.requiredRole)) {
          return NextResponse.json(
            { error: 'Insufficient role privileges', code: 'FORBIDDEN' },
            { status: 403 }
          )
        }
      }
      
      // Check allowed roles
      if (options.allowedRoles && options.allowedRoles.length > 0) {
        if (!options.allowedRoles.includes(user.role)) {
          return NextResponse.json(
            { error: 'Role not allowed', code: 'FORBIDDEN' },
            { status: 403 }
          )
        }
      }
      
      // Check permission requirements
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasAllPermissions = options.requiredPermissions.every(
          permission => hasPermission(user.role, permission)
        )
        
        if (!hasAllPermissions) {
          return NextResponse.json(
            { error: 'Insufficient permissions', code: 'FORBIDDEN' },
            { status: 403 }
          )
        }
      }
      
      // Add auth context to request
      request.auth = {
        user,
        userId: user.id,
        userRole: user.role,
      }
      
      // Update last login time
      // This is done in background, we don't await it
      updateLastLogin(user.id).catch(() => {})
      
      return handler(request, context)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware wrapper for role-based access control
 */
export function withRole(
  handler: RouteHandler,
  roles: UserRole[]
): RouteHandler {
  return withAuth(handler, { allowedRoles: roles })
}

/**
 * Middleware for admin-only routes
 */
export function withAdmin(handler: RouteHandler): RouteHandler {
  return withAuth(handler, { allowedRoles: ['SUPER_ADMIN', 'ADMIN'] })
}

/**
 * Middleware for super admin only routes
 */
export function withSuperAdmin(handler: RouteHandler): RouteHandler {
  return withAuth(handler, { allowedRoles: ['SUPER_ADMIN'] })
}

/**
 * Get current session from request (for use in route handlers)
 */
export async function getSession(request: NextRequest): Promise<AuthContext | null> {
  try {
    // Get token from cookie or Authorization header
    let token = request.cookies.get('session_token')?.value
    
    // Also check Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      return null
    }
    
    const user = await validateSession(token)
    
    if (!user) {
      return null
    }
    
    return {
      user,
      userId: user.id,
      userRole: user.role,
    }
  } catch {
    return null
  }
}

/**
 * Get optional session (doesn't throw if not authenticated)
 */
export async function getOptionalSession(request: NextRequest): Promise<AuthContext | null> {
  return getSession(request)
}

/**
 * Update last login time (background task)
 */
async function updateLastLogin(userId: string): Promise<void> {
  const { db } = await import('@/lib/db')
  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })
}

/**
 * Require authentication and return user or throw error
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const session = await getSession(request)
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

/**
 * Check if user can perform action on a resource
 */
export function canPerformAction(
  userRole: UserRole,
  action: string,
  resourceOwnerId?: string,
  currentUserId?: string
): boolean {
  // If user owns the resource, they can always perform actions on it
  if (resourceOwnerId && currentUserId && resourceOwnerId === currentUserId) {
    return true
  }
  
  // Otherwise, check permissions
  return hasPermission(userRole, action)
}
