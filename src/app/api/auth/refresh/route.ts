import { NextResponse } from 'next/server'
import { getSessionToken, refreshSession, setSessionCookie } from '@/lib/auth/session'

/**
 * POST /api/auth/refresh
 * Refresh session token (extend expiration)
 */
export async function POST() {
  try {
    // Get current session token
    const token = await getSessionToken()
    
    if (!token) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }
    
    // Refresh session
    const success = await refreshSession(token)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      )
    }
    
    // Update cookie with refreshed session
    await setSessionCookie(token)
    
    return NextResponse.json({ 
      message: 'Session refreshed successfully',
      token 
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
