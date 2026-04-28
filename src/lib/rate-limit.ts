import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limit store (resets on server restart, which is fine)
const store = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store) {
      if (now > value.resetTime) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  /** Time window in seconds */
  windowSeconds: number;
  /** Max requests per window */
  maxRequests: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowSeconds: 60,
  maxRequests: 30,
};

// Stricter limits for sensitive endpoints
const STRICT_OPTIONS: RateLimitOptions = {
  windowSeconds: 60,
  maxRequests: 5,
};

// Moderate limits
const MODERATE_OPTIONS: RateLimitOptions = {
  windowSeconds: 60,
  maxRequests: 15,
};

export function getClientIp(request: NextRequest | Request): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  
  return 'unknown';
}

export function rateLimit(options: Partial<RateLimitOptions> = {}): {
  check: (ip: string) => { allowed: boolean; remaining: number; resetTime: number };
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return {
    check(ip: string) {
      const now = Date.now();
      const key = ip;
      const record = store.get(key);
      
      if (!record || now > record.resetTime) {
        // New window
        const resetTime = now + opts.windowSeconds * 1000;
        store.set(key, { count: 1, resetTime });
        return { allowed: true, remaining: opts.maxRequests - 1, resetTime };
      }
      
      if (record.count >= opts.maxRequests) {
        return { allowed: false, remaining: 0, resetTime: record.resetTime };
      }
      
      record.count++;
      return { allowed: true, remaining: opts.maxRequests - record.count, resetTime: record.resetTime };
    }
  };
}

// Pre-configured rate limiters for common use cases
export const loginLimiter = rateLimit(STRICT_OPTIONS);        // 5 req/min
export const registerLimiter = rateLimit(STRICT_OPTIONS);     // 5 req/min  
export const donationLimiter = rateLimit(MODERATE_OPTIONS);   // 15 req/min
export const avatarLimiter = rateLimit(STRICT_OPTIONS);       // 5 req/min (AI cost)
export const apiLimiter = rateLimit(DEFAULT_OPTIONS);          // 30 req/min (general)
