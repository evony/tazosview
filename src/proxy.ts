import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting for proxy
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';
}

function checkRateLimit(ip: string, path: string): boolean {
  const now = Date.now();
  
  // Different limits for different endpoints
  let maxRequests = 60;  // General API
  let windowMs = 60 * 1000; // 1 minute
  
  if (path.includes('/api/auth/login') || path.includes('/api/account/login')) {
    maxRequests = 5; // Strict for login
  } else if (path.includes('/api/register') || path.includes('/api/account/register')) {
    maxRequests = 5; // Strict for registration
  } else if (path.includes('/api/donations') && !path.includes('/api/donations/')) {
    maxRequests = 10; // Moderate for donations
  } else if (path.includes('/api/generate-avatar')) {
    maxRequests = 3; // Very strict for AI generation
  }
  
  const key = `${ip}:${path}`;
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export function proxy(request: NextRequest) {
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = getIp(request);
    const allowed = checkRateLimit(ip, request.nextUrl.pathname);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  const response = NextResponse.next();

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://*.pusher.com wss://*.pusher.com;
    media-src 'self' https://res.cloudinary.com https://*.cloudinary.com blob:;
    frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\n/g, '').replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|logo.*\\.webp|bg.*\\.jpg|bg.*\\.webp).*)',
  ],
};
