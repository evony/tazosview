'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Trophy, TrendingUp, Award, Music, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClubLogoImage } from '../club-logo-image';
import { useCommunityTheme } from '@/hooks/use-community-theme';

/* ═══════════════════════════════════════════
   Types — Tarkam mode
   ═══════════════════════════════════════════ */
interface ClubInput {
  id: string;
  name: string;
  logo?: string | null;
  wins: number;
  losses: number;
  points: number; // Tarkam points (sum of member player.points)
  malePoints: number;
  femalePoints: number;
  gameDiff: number;
  memberCount?: number;
  maleMemberCount?: number;
  femaleMemberCount?: number;
  _count?: { members?: number };
}

interface ClubPowerRankingsProps {
  leagueData?: {
    clubs?: ClubInput[];
  };
}

interface RankedClub extends ClubInput {
  powerScore: number;
  rank: number;
}

/* ═══════════════════════════════════════════
   Power Score calculation — Tarkam mode
   Total Tarkam Points + (Male Points × 1.1) + (Female Points × 1.1) + (Members × 5)
   ═══════════════════════════════════════════ */
function calcPowerScore(club: ClubInput): number {
  const memberCount = club.memberCount || club._count?.members || 0;
  // Primary: total tarkam points + bonus for balanced divisions + small member bonus
  return club.points + Math.round(Math.min(club.malePoints, club.femalePoints) * 0.2) + (memberCount * 5);
}

/* ═══════════════════════════════════════════
   Medal emoji for top 3
   ═══════════════════════════════════════════ */
function getMedal(rank: number): string | null {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

/* ═══════════════════════════════════════════
   Main Component — Club Power Rankings (Tarkam)
   ═══════════════════════════════════════════ */
export function ClubPowerRankings({ leagueData }: ClubPowerRankingsProps) {
  const dt = useCommunityTheme();

  const rankedClubs = useMemo<RankedClub[]>(() => {
    const clubs = leagueData?.clubs || [];
    if (clubs.length === 0) return [];

    return clubs
      .map((club) => ({
        ...club,
        powerScore: calcPowerScore(club),
      }))
      .sort((a, b) => b.powerScore - a.powerScore)
      .slice(0, 5)
      .map((club, idx) => ({
        ...club,
        rank: idx + 1,
      }));
  }, [leagueData?.clubs]);

  const topScore = rankedClubs.length > 0 ? rankedClubs[0].powerScore : 1;

  if (rankedClubs.length === 0) {
    return (
      <Card className={`${dt.casinoCard} overflow-hidden`}>
        <div className={dt.casinoBar} />
        <div className="p-6 text-center">
          <Shield className={`w-8 h-8 mx-auto mb-2 opacity-30 ${dt.text}`} />
          <p className="text-xs text-muted-foreground">Belum ada klub terdaftar</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Peringkat power akan muncul setelah klub mendaftar</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${dt.casinoCard} overflow-hidden`}>
      <div className={dt.casinoBar} />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
        <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <Shield className={`w-3 h-3 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider">Power Rankings</h3>
        <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>
          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
          TOP {rankedClubs.length}
        </Badge>
      </div>

      {/* Rankings list */}
      <div className="p-4 space-y-2.5">
        {rankedClubs.map((club, idx) => {
          const medal = getMedal(club.rank);
          const pct = topScore > 0 ? (club.powerScore / topScore) * 100 : 0;

          return (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.07, duration: 0.35, ease: 'easeOut' }}
              className={`flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? `${dt.bgSubtle} border ${dt.borderSubtle}` : 'hover:bg-white/[0.02] transition-colors'} relative overflow-hidden`}
            >
              {/* Background progress bar */}
              <div
                className="absolute inset-y-0 left-0 bg-idm-gold-warm/[0.04] rounded-xl transition-all duration-700"
                style={{ width: `${pct}%` }}
              />

              {/* Rank number */}
              <div className="relative z-10 shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                  club.rank === 1 ? 'bg-idm-gold-warm/20 text-idm-gold-warm' :
                  club.rank === 2 ? 'bg-gray-400/15 text-gray-300' :
                  club.rank === 3 ? 'bg-amber-600/15 text-amber-400' :
                  `${dt.iconBg} text-muted-foreground`
                }`}>
                  {medal || club.rank}
                </div>
              </div>

              {/* Club logo */}
              <div className="relative z-10 w-9 h-9 rounded-lg overflow-hidden border border-border/20 shrink-0">
                {club.logo ? (
                  <ClubLogoImage
                    clubName={club.name}
                    dbLogo={club.logo}
                    alt={club.name}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${dt.iconBg} flex items-center justify-center`}>
                    <Shield className={`w-4 h-4 ${dt.text}`} />
                  </div>
                )}
              </div>

              {/* Club info */}
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold truncate">{club.name}</p>
                  {club.rank <= 3 && (
                    <Award className={`w-3 h-3 shrink-0 ${club.rank === 1 ? 'text-idm-gold-warm' : 'text-muted-foreground/40'}`} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-0.5">
                    <Music className="w-2.5 h-2.5" />{club.malePoints}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">+</span>
                  <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-0.5">
                    <Users className="w-2.5 h-2.5" />{club.femalePoints}
                  </span>
                </div>
              </div>

              {/* Power Score */}
              <div className="relative z-10 text-right shrink-0">
                <p className={`text-sm font-black tabular-nums ${club.rank === 1 ? dt.neonGradient : club.rank <= 3 ? dt.neonText : 'text-muted-foreground'}`}>
                  {club.powerScore.toLocaleString('id-ID')}
                </p>
                <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">
                  Power
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Formula explanation */}
      <div className={`px-4 pb-3`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${dt.bgSubtle}`}>
          <TrendingUp className={`w-3 h-3 ${dt.neonText} shrink-0`} />
          <span className="text-[9px] text-muted-foreground/60">
            Power = Tarkam Pts + Balance Bonus + (Members × 5)
          </span>
        </div>
      </div>
    </Card>
  );
}
