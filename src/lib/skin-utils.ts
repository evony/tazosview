// ============================================
// IDM LEAGUE - SKIN UTILITY FUNCTIONS
// Handles skin type constants, color parsing, priority logic, and expiration
// ============================================

/**
 * Skin color configuration — stored as JSON in the Skin.colorClass database field.
 * All color values are actual CSS color strings (not Tailwind class names) because
 * Tailwind JIT cannot scan dynamic class names from the database at build time.
 *
 * - frame: ring color (CSS color string for ring-* utility)
 * - name: gradient colors for player name (CSS color string, pipe-separated for gradient stops)
 * - badge: background + text colors (CSS color strings, pipe-separated: "bg|text")
 * - border: gradient colors for card border (CSS color string, pipe-separated for gradient stops)
 * - glow: shadow/glow color (CSS rgba string)
 */
export interface SkinColors {
  frame: string;   // e.g. "#facc15" (yellow-400)
  name: string;    // e.g. "#fde047|#f59e0b|#eab308" (gradient stops)
  badge: string;   // e.g. "rgba(234,179,8,0.2)|#fde047" (bg|text)
  border: string;  // e.g. "#eab308|#f59e0b|#fde047" (gradient stops)
  glow: string;    // e.g. "rgba(234,179,8,0.4)"
}

/**
 * Full skin details including metadata, used in rendering components.
 */
export interface PlayerSkinWithDetails {
  type: string;
  icon: string;
  displayName: string;
  colorClass: string;       // JSON string from database — parse with parseSkinColors()
  priority: number;
  duration: string;         // "weekly" | "permanent"
  reason?: string | null;
  expiresAt?: string | null;
  /** Permanent donor heart badge count (independent of skin expiry) */
  donorBadgeCount?: number;
}

// ============================================
// SKIN TYPE DEFINITIONS
// Each skin has an icon, display name, priority, duration, and color scheme
// ============================================

export const SKIN_TYPES = {
  champion: {
    type: 'champion',
    icon: '🥇',
    displayName: 'Gold Crown',
    priority: 4,
    duration: 'weekly',
  },
  mvp: {
    type: 'mvp',
    icon: '⭐',
    displayName: 'Platinum Star',
    priority: 3,
    duration: 'weekly',
  },
  sawer_bronze: {
    type: 'sawer_bronze',
    icon: '🥉',
    displayName: 'Bronze Sawer',
    priority: 2,
    duration: 'weekly',
  },
  sawer_silver: {
    type: 'sawer_silver',
    icon: '🥈',
    displayName: 'Silver Sawer',
    priority: 3,
    duration: 'weekly',
  },
  sawer_gold: {
    type: 'sawer_gold',
    icon: '🥇',
    displayName: 'Gold Sawer',
    priority: 4,
    duration: 'weekly',
  },
  sawer_diamond: {
    type: 'sawer_diamond',
    icon: '💎',
    displayName: 'Diamond Sawer',
    priority: 5,
    duration: 'weekly',
  },
  donor: {
    type: 'donor',
    icon: '❤️',
    displayName: 'Maroon Heart',
    priority: 1,
    duration: 'weekly',
  },
} as const;

export type SkinTypeKey = keyof typeof SKIN_TYPES;

// ============================================
// DEFAULT COLOR SCHEMES PER SKIN TYPE
// These are the "built-in" colors when the DB colorClass is not set or fails to parse.
// All values are CSS color strings (NOT Tailwind class names) for inline style usage.
// ============================================

export const DEFAULT_SKIN_COLORS: Record<string, SkinColors> = {
  champion: {
    frame: '#facc15',                                            // yellow-400
    name: '#fde047|#f59e0b|#eab308',                            // yellow-300 → amber-500 → yellow-600
    badge: 'rgba(234,179,8,0.2)|#fde047',                       // yellow-500/20 bg | yellow-300 text
    border: '#eab308|#f59e0b|#fde047',                           // yellow-600 → amber-500 → yellow-300
    glow: 'rgba(234,179,8,0.4)',
  },
  mvp: {
    frame: '#d1d5db',                                            // gray-300 (platinum)
    name: '#e5e7eb|#d1d5db|#f3f4f6',                             // gray-200 → gray-300 → gray-100 (platinum shine)
    badge: 'rgba(209,213,219,0.2)|#e5e7eb',                       // gray-300/20 bg | gray-200 text
    border: '#d1d5db|#9ca3af|#e5e7eb',                           // gray-300 → gray-400 → gray-200 (platinum edge)
    glow: 'rgba(209,213,219,0.4)',
  },
  sawer_bronze: {
    frame: '#b45309',                                            // amber-700 (bronze)
    name: '#d97706|#b45309|#f59e0b',                             // amber-600 → amber-700 → amber-500 (warm bronze gradient)
    badge: 'rgba(180,83,9,0.2)|#f59e0b',                         // amber-700/20 bg | amber-500 text
    border: '#b45309|#d97706|#f59e0b',                           // amber-700 → amber-600 → amber-500 (bronze edge)
    glow: 'rgba(180,83,9,0.4)',
  },
  sawer_silver: {
    frame: '#9ca3af',                                            // gray-400 (silver/platinum)
    name: '#d1d5db|#9ca3af|#e5e7eb',                             // gray-300 → gray-400 → gray-200 (silver shine)
    badge: 'rgba(156,163,175,0.2)|#d1d5db',                       // gray-400/20 bg | gray-300 text
    border: '#9ca3af|#6b7280|#d1d5db',                           // gray-400 → gray-500 → gray-300 (silver edge)
    glow: 'rgba(156,163,175,0.4)',
  },
  sawer_gold: {
    frame: '#facc15',                                            // yellow-400 (gold)
    name: '#fde047|#facc15|#f59e0b',                             // yellow-300 → yellow-400 → amber-500 (gold shimmer)
    badge: 'rgba(250,204,21,0.2)|#fde047',                        // yellow-400/20 bg | yellow-300 text
    border: '#facc15|#eab308|#fde047',                           // yellow-400 → yellow-600 → yellow-300 (gold edge)
    glow: 'rgba(250,204,21,0.4)',
  },
  sawer_diamond: {
    frame: '#22d3ee',                                            // cyan-400 (diamond)
    name: '#67e8f9|#06b6d4|#a5f3fc',                             // cyan-300 → cyan-500 → cyan-200 (diamond shimmer)
    badge: 'rgba(6,182,212,0.2)|#67e8f9',                        // cyan-500/20 bg | cyan-300 text
    border: '#06b6d4|#22d3ee|#a5f3fc',                           // cyan-500 → cyan-400 → cyan-200 (diamond edge)
    glow: 'rgba(34,211,238,0.4)',
  },
  donor: {
    frame: '#fb7185',                                            // rose-400
    name: '#fb7185|#ef4444|#f472b6',                             // rose-400 → red-500 → pink-400
    badge: 'rgba(244,63,94,0.2)|#fda4af',                        // rose-500/20 bg | rose-300 text
    border: '#f43f5e|#ef4444|#f472b6',                           // rose-500 → red-400 → pink-400
    glow: 'rgba(244,63,94,0.35)',
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Safely parse the colorClass JSON string from the database.
 * Returns null if the string is invalid or cannot be parsed.
 * Falls back to DEFAULT_SKIN_COLORS if the parsed object is missing required keys.
 */
export function parseSkinColors(colorClass: string): SkinColors | null {
  if (!colorClass) return null;
  try {
    const parsed = JSON.parse(colorClass);
    // Validate required keys exist
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'frame' in parsed &&
      'name' in parsed &&
      'badge' in parsed &&
      'border' in parsed &&
      'glow' in parsed
    ) {
      return parsed as SkinColors;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the resolved SkinColors for a skin, trying the colorClass JSON first,
 * then falling back to DEFAULT_SKIN_COLORS by type.
 */
export function resolveSkinColors(skin: { type: string; colorClass: string }): SkinColors | null {
  const parsed = parseSkinColors(skin.colorClass);
  if (parsed) return parsed;
  return DEFAULT_SKIN_COLORS[skin.type] ?? null;
}

/**
 * Parse a pipe-separated color string into an array of CSS color strings.
 * Used for gradient stops in name, border, and badge rendering.
 */
export function parseColorStops(colorStr: string): string[] {
  return colorStr.split('|').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse the badge color string into background and text colors.
 * Format: "bgColor|textColor"
 */
export function parseBadgeColors(badgeStr: string): { bg: string; text: string } {
  const parts = badgeStr.split('|');
  return {
    bg: parts[0]?.trim() ?? 'rgba(255,255,255,0.1)',
    text: parts[1]?.trim() ?? '#ffffff',
  };
}

/**
 * Build a CSS linear-gradient string from pipe-separated color stops.
 */
export function buildGradient(colorStops: string, direction: string = '135deg'): string {
  const stops = parseColorStops(colorStops);
  if (stops.length === 0) return 'transparent';
  if (stops.length === 1) return stops[0];
  return `linear-gradient(${direction}, ${stops.join(', ')})`;
}

/**
 * Get the primary (highest priority) skin from a list.
 * Returns null if the list is empty.
 */
export function getPrimarySkin(skins: PlayerSkinWithDetails[]): PlayerSkinWithDetails | null {
  if (!skins || skins.length === 0) return null;
  const sorted = sortSkinsByPriority(skins);
  return sorted[0] ?? null;
}

/**
 * Sort skins by priority (highest first).
 * Ties are broken alphabetically by displayName for stable ordering.
 */
export function sortSkinsByPriority(skins: PlayerSkinWithDetails[]): PlayerSkinWithDetails[] {
  if (!skins) return [];
  return [...skins].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Check if a skin has expired.
 * Returns true if expiresAt is in the past.
 * Returns false if expiresAt is null/undefined (permanent skin) or still in the future.
 */
export function isSkinExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  try {
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) return false;
    return expiryDate.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * Filter out expired skins from a list.
 */
export function filterActiveSkins(skins: PlayerSkinWithDetails[]): PlayerSkinWithDetails[] {
  return skins.filter(skin => !isSkinExpired(skin.expiresAt));
}

/**
 * Get the SKIN_TYPES entry for a given type string.
 */
export function getSkinTypeDefinition(type: string): (typeof SKIN_TYPES)[SkinTypeKey] | undefined {
  return SKIN_TYPES[type as SkinTypeKey];
}

// ============================================
// DONOR BADGE HELPERS
// Heart badges persist permanently even after donor skin expires
// 1-4 donations: small heart badge
// 5+ donations: bigger heart badge with pulse glow
// ============================================

/**
 * Get the donor badge display config based on donation count.
 * Returns null if count is 0 (no badge to show).
 */
export function getDonorBadgeConfig(donorBadgeCount: number): {
  size: 'sm' | 'lg';
  hasPulseGlow: boolean;
  label: string;
} | null {
  if (donorBadgeCount <= 0) return null;

  if (donorBadgeCount >= 5) {
    return {
      size: 'lg',
      hasPulseGlow: true,
      label: `❤️×${donorBadgeCount}`,
    };
  }

  return {
    size: 'sm',
    hasPulseGlow: false,
    label: donorBadgeCount === 1 ? '❤️' : `❤️×${donorBadgeCount}`,
  };
}

/**
 * Check if a donor badge should be shown for a player.
 * This is independent of whether the donor skin is active or expired.
 */
export function shouldShowDonorBadge(donorBadgeCount: number): boolean {
  return donorBadgeCount > 0;
}

// ============================================
// SAWER TIER HELPERS
// Tiered sawer skin system: Bronze, Silver, Gold, Diamond
// Based on weekly sawer (donation) amount
// ============================================

/**
 * Sawer tier definitions, ordered from highest to lowest.
 */
export const SAWER_TIERS = [
  { type: 'sawer_diamond', label: 'Diamond', icon: '💎', minAmount: 200000, color: 'text-cyan-400' },
  { type: 'sawer_gold', label: 'Gold', icon: '🥇', minAmount: 100000, color: 'text-yellow-400' },
  { type: 'sawer_silver', label: 'Silver', icon: '🥈', minAmount: 50000, color: 'text-gray-300' },
  { type: 'sawer_bronze', label: 'Bronze', icon: '🥉', minAmount: 10000, color: 'text-amber-600' },
] as const;

/**
 * Determine the sawer tier skin type based on total weekly sawer amount.
 * Returns the skin type string (e.g. 'sawer_diamond') or null if below threshold.
 */
export function getSawerTier(amount: number): string | null {
  if (amount >= 200000) return 'sawer_diamond';
  if (amount >= 100000) return 'sawer_gold';
  if (amount >= 50000) return 'sawer_silver';
  if (amount >= 10000) return 'sawer_bronze';
  return null;
}

/**
 * Get the sawer badge display config for a permanent tier badge.
 * Returns null if the tier is invalid.
 */
export function getSawerBadgeConfig(tier: string): {
  icon: string;
  size: 'sm' | 'md' | 'lg';
  hasGlow: boolean;
  label: string;
} | null {
  switch (tier) {
    case 'sawer_diamond':
    case 'diamond':
      return { icon: '💎', size: 'lg', hasGlow: true, label: 'Diamond Sawer' };
    case 'sawer_gold':
    case 'gold':
      return { icon: '🥇', size: 'md', hasGlow: false, label: 'Gold Sawer' };
    case 'sawer_silver':
    case 'silver':
      return { icon: '🥈', size: 'sm', hasGlow: false, label: 'Silver Sawer' };
    case 'sawer_bronze':
    case 'bronze':
      return { icon: '🥉', size: 'sm', hasGlow: false, label: 'Bronze Sawer' };
    default:
      return null;
  }
}
