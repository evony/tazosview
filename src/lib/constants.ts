/**
 * Shared constants for the IDM League platform.
 * All hardcoded values that are used in multiple places should live here.
 */

// ── Season Configuration ──
/** Maximum number of tournament weeks per season */
export const SEASON_TOTAL_WEEKS = 10;

// ── Division Constants ──
export const DIVISION = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export type Division = (typeof DIVISION)[keyof typeof DIVISION];

// ── Division Accent Colors ──
// Aligned with use-division-theme.ts DivisionTheme.color / colorLight
export const DIVISION_COLORS = {
  male: {
    accent: '#06b6d4',       // bg-cyan-500 / Tailwind primary
    accentLight: '#22d3ee',  // text-cyan-400 / DivisionTheme.color
    accentFaint: '#67e8f9',  // text-cyan-300 / DivisionTheme.colorLight
    accentDark: '#0891b2',   // bg-cyan-600
  },
  female: {
    accent: '#a855f7',       // bg-purple-500 / Tailwind primary
    accentLight: '#c084fc',  // text-purple-400 / DivisionTheme.color
    accentFaint: '#e9d5ff',  // text-purple-200 / DivisionTheme.colorLight
    accentDark: '#9333ea',   // bg-purple-600
  },
} as const;

// ── Gold / Brand Colors ──
export const GOLD = {
  warm: '#d4a853',
  light: '#e5be4a',
  dim: '#b8942e',
} as const;

// ── Tier Order ──
export const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

// ── Tournament Status ──
export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  REGISTRATION: 'registration',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// ── Season Status ──
export const SEASON_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  UPCOMING: 'upcoming',
} as const;
