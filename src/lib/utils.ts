import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deterministic hash from string for procedural generation
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get avatar URL - uses database avatar if available, otherwise generates a fallback
 * Returns a path like /avatars/avatar-male-1.png as fallback
 */
export function getAvatarUrl(gamertag: string, division: 'male' | 'female', dbAvatar?: string | null): string {
  // Priority: 1) Database avatar field, 2) Fallback
  if (dbAvatar) return dbAvatar;
  const index = (hashString(gamertag) % 3) + 1;
  return `/avatars/avatar-${division}-${index}.png`;
}

/**
 * Club logo mapping — returns path to club logo image
 * Priority: 1) Database logo field (Cloudinary URL), 2) Local mapping, 3) Generated placeholder
 * Real clubs (IDM League) should have logos uploaded to Cloudinary via admin panel
 */
const CLUB_LOGO_MAP: Record<string, string> = {
  // Legacy demo clubs (kept for backward compatibility)
  'Neon Blaze': '/clubs/neon-blaze.png',
  'Phantom Step': '/clubs/phantom-step.png',
  'Rhythm Force': '/clubs/rhythm-force.png',
  'Crystal Wave': '/clubs/crystal-wave.png',
  'Shadow Dance': '/clubs/shadow-dance.png',
  'Thunder Beat': '/clubs/thunder-beat.png',
  'Velvet Groove': '/clubs/velvet-groove.png',
  'Star Rise': '/clubs/star-rise.png',
  'Lunar Flow': '/clubs/lunar-flow.png',
  // Winner teams from demo data
  'Team Rhythm': '/clubs/rhythm-force.png',
  'Team Flow': '/clubs/lunar-flow.png',
  'Team Grace': '/clubs/crystal-wave.png',
  'Team Velvet': '/clubs/velvet-groove.png',
};

export function getClubLogoUrl(clubName: string, dbLogo?: string | null): string {
  // Priority: 1) Database logo field (Cloudinary URL), 2) Mapping, 3) Generated data URI placeholder
  if (dbLogo) return dbLogo;
  const mapped = CLUB_LOGO_MAP[clubName];
  if (mapped) return mapped;

  // Generate inline SVG data URI to avoid Next.js Image optimizer 400 errors
  const initials = clubName
    .split(/[\s_]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  let hash = 0;
  for (let i = 0; i < clubName.length; i++) {
    hash = ((hash << 5) - hash) + clubName.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const fontSize = initials.length <= 2 ? 72 : 56;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:hsl(${hue},45%,18%)"/><stop offset="100%" style="stop-color:hsl(${hue},45%,18%);stop-opacity:0.7"/></linearGradient></defs><rect width="200" height="200" rx="24" fill="url(#bg)"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${fontSize}" font-weight="900" fill="hsl(${hue},65%,70%)" letter-spacing="2">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Check if a URL is a generated placeholder (data URI) that shouldn't go through image optimizer
 */
export function isClubLogoPlaceholder(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Convert hex color + alpha to rgba() string.
 * Avoids 8-digit hex (#rrggbbaa) which is invalid in some browsers.
 *
 * @param hex  6-digit hex color, e.g. "#d4a853"
 * @param alpha  0–100 opacity percentage (20 = 12.5%, 40 = 25%, etc.)
 * @returns  rgba() string, e.g. "rgba(212,168,83,0.125)"
 */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = Math.round((alpha / 255) * 1000) / 1000; // normalize 0-255 → 0-1
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Format number as IDR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Format number as abbreviated IDR currency for compact displays (mobile).
 * Examples: 240000 → "Rp. 240K", 1200000 → "Rp. 1.2M", 50000 → "Rp. 50K"
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `Rp. ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `Rp. ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `Rp. ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `Rp. ${amount}`;
}

/**
 * Normalize club to a display string regardless of input format.
 * The /api/players/search endpoint returns club as {id, name, logo},
 * while /api/stats returns club as a string. This helper ensures
 * consistent string rendering across all components.
 */
export function clubToString(club: string | { id: string; name: string; logo?: string | null } | null | undefined): string {
  if (!club) return '';
  if (typeof club === 'string') return club;
  return club.name || '';
}
