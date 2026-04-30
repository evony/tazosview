import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Skip for API routes and internal Next.js paths
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return response;
  }

  // Security headers for all pages
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Static asset caching
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff2?|ttf|eot)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

export const config = {
  // Only run on pages and static assets, not on API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
