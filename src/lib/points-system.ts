/**
 * IDM League - Unified Points System
 * 
 * This module contains all point calculation logic to ensure consistency
 * between frontend display and backend calculations.
 * 
 * === POINTS FORMULA ===
 * Base Points:
 * - Participation: +2 pts per match played
 * - Win: +3 pts per win
 * - MVP: +5 pts per MVP award
 * 
 * Streak Bonus (cumulative):
 * - 2+ win streak: +5 pts
 * - 3+ win streak: +10 pts
 * - 4+ win streak: +15 pts
 * - 5+ win streak: +20 pts (max)
 * 
 * Tier Bonus (multiplier on base points):
 * - S Tier: 1.5x multiplier
 * - A Tier: 1.2x multiplier
 * - B Tier: 1.0x multiplier (no bonus)
 */

export interface PointsBreakdown {
  participation: number;      // 2 pts per match
  wins: number;               // 3 pts per win
  mvp: number;                // 5 pts per MVP
  streakBonus: number;        // 5-20 pts based on streak
  tierMultiplier: number;     // 1.0, 1.2, or 1.5
  total: number;
}

export interface PlayerStats {
  matches: number;
  totalWins: number;
  totalMvp: number;
  streak: number;
  tier: string;
}

/**
 * Calculate streak bonus points
 * - 2 streak: +5 pts
 * - 3 streak: +10 pts
 * - 4 streak: +15 pts
 * - 5+ streak: +20 pts (max)
 */
export function calculateStreakBonus(streak: number): number {
  if (streak < 2) return 0;
  if (streak >= 5) return 20;
  return (streak - 1) * 5; // 2=5, 3=10, 4=15
}

/**
 * Get tier multiplier
 * - S Tier: 1.5x
 * - A Tier: 1.2x
 * - B Tier: 1.0x
 */
export function getTierMultiplier(tier: string): number {
  switch (tier.toUpperCase()) {
    case 'S': return 1.5;
    case 'A': return 1.2;
    case 'B':
    default: return 1.0;
  }
}

/**
 * Calculate full points breakdown for a player
 */
export function calculatePointsBreakdown(stats: PlayerStats): PointsBreakdown {
  const participation = stats.matches * 2;           // 2 pts per match
  const wins = stats.totalWins * 3;                  // 3 pts per win
  const mvp = stats.totalMvp * 5;                    // 5 pts per MVP
  const streakBonus = calculateStreakBonus(stats.streak);
  const tierMultiplier = getTierMultiplier(stats.tier);
  
  // Apply tier multiplier to base points (not streak bonus)
  const basePoints = participation + wins + mvp;
  const total = Math.floor(basePoints * tierMultiplier) + streakBonus;
  
  return {
    participation,
    wins,
    mvp,
    streakBonus,
    tierMultiplier,
    total,
  };
}

/**
 * Recalculate total points for a player from scratch
 * Use this to ensure consistency after data changes
 */
export function recalculateTotalPoints(stats: PlayerStats): number {
  return calculatePointsBreakdown(stats).total;
}

/**
 * Points earned for winning a match
 * Base: 3 pts (win) + 2 pts (participation)
 * Tier multiplier applied
 */
export function getWinPoints(tier: string): number {
  const basePoints = 3 + 2; // win + participation
  return Math.floor(basePoints * getTierMultiplier(tier));
}

/**
 * Points earned for losing a match
 * Base: 2 pts (participation only)
 * Tier multiplier applied
 */
export function getLossPoints(tier: string): number {
  const basePoints = 2; // participation only
  return Math.floor(basePoints * getTierMultiplier(tier));
}

/**
 * Points earned for MVP
 * Fixed: 5 pts (no tier multiplier)
 */
export function getMvpPoints(): number {
  return 5;
}

/**
 * Calculate new streak after a match result
 */
export function calculateNewStreak(currentStreak: number, won: boolean): number {
  if (won) {
    return currentStreak + 1;
  }
  return 0; // Loss resets streak
}

/**
 * Tier thresholds for auto promotion/demotion
 * Based on points earned in current season
 */
export const TIER_THRESHOLDS = {
  S: { minPoints: 100, minWinRate: 0.6 },  // Must have 60%+ win rate and 100+ points to stay in S
  A: { minPoints: 50, minWinRate: 0.4 },   // Must have 40%+ win rate and 50+ points to stay in A
  B: { minPoints: 0, minWinRate: 0 },      // No minimum for B tier
};

/**
 * Check if player should be promoted to higher tier
 */
export function checkTierPromotion(currentTier: string, points: number, winRate: number): string | null {
  const tier = currentTier.toUpperCase();
  
  if (tier === 'B' && points >= 80 && winRate >= 0.5) {
    return 'A'; // Promote B -> A
  }
  if (tier === 'A' && points >= 150 && winRate >= 0.65) {
    return 'S'; // Promote A -> S
  }
  
  return null; // No promotion
}

/**
 * Check if player should be demoted to lower tier
 */
export function checkTierDemotion(currentTier: string, points: number, winRate: number): string | null {
  const tier = currentTier.toUpperCase();
  
  if (tier === 'S' && (points < 50 || winRate < 0.4)) {
    return 'A'; // Demote S -> A
  }
  if (tier === 'A' && (points < 25 || winRate < 0.25)) {
    return 'B'; // Demote A -> B
  }
  
  return null; // No demotion
}

/**
 * Season phases
 */
export const SEASON_PHASES = {
  REGISTRATION: 'registration',   // Week 1-2: Team formation, player registration
  COMPETITION: 'competition',     // Week 3-10: Weekly tournaments, league matches
  PLAYOFFS: 'playoffs',          // Week 11-12: Final brackets, championship
} as const;

export type SeasonPhase = typeof SEASON_PHASES[keyof typeof SEASON_PHASES];

/**
 * Determine current season phase based on week
 */
export function getSeasonPhase(currentWeek: number, totalWeeks: number): SeasonPhase {
  if (currentWeek <= 2) return SEASON_PHASES.REGISTRATION;
  if (currentWeek <= totalWeeks - 2) return SEASON_PHASES.COMPETITION;
  return SEASON_PHASES.PLAYOFFS;
}
