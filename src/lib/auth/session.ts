import { db } from '@/lib/db'
import { User } from '@prisma/client'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

/**
 * Session configuration
 */
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const SESSION_COOKIE_NAME = 'session_token'

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  
  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
  
  return token
}

/**
 * Validate a session token and return the user
 */
export async function validateSession(token: string): Promise<User | null> {
  if (!token) {
    return null
  }
  
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  
  if (!session) {
    return null
  }
  
  // Check if session is expired
  if (session.expiresAt < new Date()) {
    // Delete expired session
    await db.session.delete({ where: { token } })
    return null
  }
  
  // Check if user is active
  if (!session.user.isActive) {
    return null
  }
  
  return session.user
}

/**
 * Destroy a session
 */
export async function destroySession(token: string): Promise<void> {
  if (token) {
    await db.session.deleteMany({
      where: { token },
    }).catch(() => {
      // Ignore error if session doesn't exist
    })
  }
}

/**
 * Get the current session token from cookies
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken()
  if (!token) {
    return null
  }
  return validateSession(token)
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    path: '/',
  })
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Refresh a session (extend its expiration)
 */
export async function refreshSession(token: string): Promise<boolean> {
  if (!token) {
    return false
  }
  
  const session = await db.session.findUnique({
    where: { token },
  })
  
  if (!session || session.expiresAt < new Date()) {
    return false
  }
  
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  
  await db.session.update({
    where: { token },
    data: { expiresAt: newExpiresAt },
  })
  
  return true
}

/**
 * Clean up expired sessions (can be run as a cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  
  return result.count
}

/**
 * Delete all sessions for a user (useful for "logout all devices")
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
  const result = await db.session.deleteMany({
    where: { userId },
  })
  
  return result.count
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<{ id: string; createdAt: Date; expiresAt: Date }[]> {
  const sessions = await db.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  
  return sessions
}
