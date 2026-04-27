'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Swords, Trophy, Flame, Crown, TrendingUp, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '../tier-badge';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import { getAvatarUrl } from '@/lib/utils';
import Image from 'next/image';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */
interface RivalPlayer {
  id: string;
  gamertag: string;
  avatar: string | null;
  tier: string;
  points: number;
  totalWins: number;
  totalMvp: number;
  streak: number;
  maxStreak: number;
  matches: number;
  club: { name: string; logo: string | null } | null;
}

interface RivalryData {
  player1: RivalPlayer;
  player2: RivalPlayer;
  totalPlayers: number;
  pointDiff: number;
}

interface CommunityRivalryProps {
  onPlayerClick: (player: RivalPlayer, division: 'male' | 'female') => void;
}

/* ═══════════════════════════════════════════
   Stat comparison bar (mirrors division-rivalry-widget)
   ═══════════════════════════════════════════ */
function StatBar({
  label,
  value1,
  value2,
  max,
  dt,
}: {
  label: string;
  value1: number;
  value2: number;
  max: number;
  dt: ReturnType<typeof getDivisionTheme>;
}) {
  const pct1 = max > 0 ? (value1 / max) * 100 : 0;
  const pct2 = max > 0 ? (value2 / max) * 100 : 0;
  const winner1 = value1 > value2;
  const winner2 = value2 > value1;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold tabular-nums ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>{value1}</span>
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>{value2}</span>
      </div>
      <div className="flex items-center gap-1 h-1.5">
        <div className="flex-1 bg-white/5 rounded-full overflow-hidden flex justify-end">
          <div
            className={`h-full rounded-full transition-all duration-700 ${winner1 ? 'bg-idm-gold-warm' : 'bg-white/15'}`}
            style={{ width: `${Math.max(pct1, 2)}%` }}
          />
        </div>
        <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${winner2 ? 'bg-idm-gold-warm' : 'bg-white/15'}`}
            style={{ width: `${Math.max(pct2, 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Player card inside rivalry — horizontal compact on mobile, vertical on desktop
   ═══════════════════════════════════════════ */
function RivalPlayerCard({
  player,
  isLeading,
  division,
  onClick,
}: {
  player: RivalPlayer;
  isLeading: boolean;
  division: 'male' | 'female';
  onClick: () => void;
}) {
  const dt = getDivisionTheme(division);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer w-full"
    >
      {/* Avatar with tier border */}
      <div className="relative">
        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 group-hover:scale-105 ${
          isLeading ? 'border-idm-gold-warm/50 shadow-[0_0_12px_rgba(229,190,74,0.2)]' : 'border-white/10'
        }`}>
          <Image
            src={getAvatarUrl(player.gamertag, division, player.avatar)}
            alt={player.gamertag}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        {isLeading && (
          <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-md z-10">
            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#0c0a06]" />
          </div>
        )}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 hidden sm:block">
          <TierBadge tier={player.tier} />
        </div>
      </div>

      {/* Player info */}
      <div className="text-center min-w-0 w-full">
        <p className={`text-[10px] sm:text-xs font-bold truncate group-hover:text-idm-gold-warm transition-colors ${
          isLeading ? 'text-white' : 'text-white/80'
        }`}>
          {player.gamertag}
        </p>
        {player.club && (
          <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate">{player.club.name}</p>
        )}
        {/* Mobile: compact tier + pts inline; Desktop: pill badge */}
        <div className="hidden sm:block mt-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${dt.bgSubtle} ${dt.borderSubtle} border`}>
            <Trophy className={`w-2.5 h-2.5 ${dt.neonText}`} />
            <span className={`text-[10px] font-bold tabular-nums ${dt.neonText}`}>{player.points}</span>
            <span className="text-[8px] text-muted-foreground">PTS</span>
          </div>
        </div>
        {/* Mobile: just points */}
        <div className="sm:hidden mt-0.5">
          <span className={`text-[10px] font-bold tabular-nums ${dt.neonText}`}>{player.points}</span>
          <span className="text-[7px] text-muted-foreground ml-0.5">PTS</span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   Single division rivalry card
   ═══════════════════════════════════════════ */
function DivisionRivalryCard({
  division,
  rivalry,
  onPlayerClick,
}: {
  division: 'male' | 'female';
  rivalry: RivalryData | null | undefined;
  onPlayerClick: (player: RivalPlayer, division: 'male' | 'female') => void;
}) {
  const dt = getDivisionTheme(division);
  const emoji = division === 'male' ? '🕺' : '💃';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full"
    >
      <Card className={`${dt.casinoCard} overflow-hidden h-full flex flex-col`}>
        <div className={dt.casinoBar} />

        {/* Header */}
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle} shrink-0`}>
          <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
            <Swords className={`w-3 h-3 ${dt.neonText}`} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            {emoji} Rivalitas Puncak
          </h3>
          {rivalry && (
            <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>
              <Zap className="w-2.5 h-2.5 mr-0.5" />
              {rivalry.pointDiff} PTS
            </Badge>
          )}
        </div>

        {!rivalry ? (
          /* Empty state */
          <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
            <Swords className={`w-8 h-8 mx-auto mb-2 opacity-30 ${dt.text}`} />
            <p className="text-xs text-muted-foreground">Belum cukup data rivalitas</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Minimal 2 pemain diperlukan</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 flex-1">
            {/* Side-by-side players — always horizontal, compact on mobile */}
            <div className="flex items-center justify-center gap-2 sm:gap-6">
              <RivalPlayerCard
                player={rivalry.player1}
                isLeading={rivalry.pointDiff > 0}
                division={division}
                onClick={() => onPlayerClick(rivalry.player1, division)}
              />

              {/* VS Badge */}
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 shrink-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-idm-gold-warm/20 to-idm-gold-warm/5 border border-idm-gold-warm/30 flex items-center justify-center shadow-[0_0_16px_rgba(229,190,74,0.15)]">
                  <span className="text-[10px] sm:text-sm font-black text-idm-gold-warm">VS</span>
                </div>
                <span className="text-[7px] sm:text-[9px] text-muted-foreground/50 font-semibold">#1 vs #2</span>
              </div>

              <RivalPlayerCard
                player={rivalry.player2}
                isLeading={rivalry.pointDiff < 0}
                division={division}
                onClick={() => onPlayerClick(rivalry.player2, division)}
              />
            </div>

            {/* Stat Comparison Bars */}
            <div className="space-y-2 sm:space-y-2.5">
              <StatBar
                label="Points"
                value1={rivalry.player1.points}
                value2={rivalry.player2.points}
                max={Math.max(rivalry.player1.points, rivalry.player2.points, 1)}
                dt={dt}
              />
              <StatBar
                label="Wins"
                value1={rivalry.player1.totalWins}
                value2={rivalry.player2.totalWins}
                max={Math.max(rivalry.player1.totalWins, rivalry.player2.totalWins, 1)}
                dt={dt}
              />
              <StatBar
                label="MVP"
                value1={rivalry.player1.totalMvp}
                value2={rivalry.player2.totalMvp}
                max={Math.max(rivalry.player1.totalMvp, rivalry.player2.totalMvp, 1)}
                dt={dt}
              />
              <StatBar
                label="Streak"
                value1={rivalry.player1.streak}
                value2={rivalry.player2.streak}
                max={Math.max(rivalry.player1.streak, rivalry.player2.streak, 1)}
                dt={dt}
              />
            </div>

            {/* Point Gap Indicator */}
            <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} border`}>
              <TrendingUp className="w-3 h-3 text-idm-gold-warm shrink-0" />
              <span className="text-[10px] text-muted-foreground">
                {rivalry.pointDiff > 0 ? (
                  <><span className="text-idm-gold-warm font-bold">{rivalry.player1.gamertag}</span> unggul <span className="font-bold text-idm-gold-warm">{rivalry.pointDiff} poin</span></>
                ) : rivalry.pointDiff < 0 ? (
                  <><span className="text-idm-gold-warm font-bold">{rivalry.player2.gamertag}</span> unggul <span className="font-bold text-idm-gold-warm">{Math.abs(rivalry.pointDiff)} poin</span></>
                ) : (
                  <>Seri! Keduanya <span className="font-bold text-idm-gold-warm">imbang</span></>
                )}
              </span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Main Component — Community Rivalry
   ═══════════════════════════════════════════ */
export function CommunityRivalry({ onPlayerClick }: CommunityRivalryProps) {
  const { data, isLoading } = useQuery<{ male: RivalryData | null; female: RivalryData | null }>({
    queryKey: ['division-rivalry'],
    queryFn: async () => {
      const res = await fetch('/api/division-rivalry');
      return res.json();
    },
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['male', 'female'].map((div) => {
          const dt = getDivisionTheme(div as 'male' | 'female');
          return (
            <Card key={div} className={`${dt.casinoCard} overflow-hidden`}>
              <div className={dt.casinoBar} />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-muted/20 rounded animate-pulse" />
                  <div className="h-5 w-12 bg-muted/20 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-4 justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-muted/15 rounded-xl animate-pulse" />
                    <div className="h-3 w-16 bg-muted/15 rounded animate-pulse" />
                  </div>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-muted/15 rounded-full animate-pulse" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-muted/15 rounded-xl animate-pulse" />
                    <div className="h-3 w-16 bg-muted/15 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 bg-muted/10 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DivisionRivalryCard
        division="male"
        rivalry={data?.male}
        onPlayerClick={onPlayerClick}
      />
      <DivisionRivalryCard
        division="female"
        rivalry={data?.female}
        onPlayerClick={onPlayerClick}
      />
    </div>
  );
}
