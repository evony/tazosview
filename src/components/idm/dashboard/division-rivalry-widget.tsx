'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Swords, Trophy, Flame, Crown, TrendingUp, Zap, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '../tier-badge';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useAppStore } from '@/lib/store';
import { getAvatarUrl } from '@/lib/utils';
import Image from 'next/image';

/* ========== Types ========== */
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

interface DivisionRivalryWidgetProps {
  setSelectedPlayer: (player: any) => void;
}

/* ========== Stat comparison bar ========== */
function StatBar({ label, value1, value2, max }: { label: string; value1: number; value2: number; max: number }) {
  const dt = useDivisionTheme();
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
            className={`h-full rounded-full transition-all duration-700 progress-fill-animate ${winner1 ? 'bg-idm-gold-warm' : 'bg-white/15'}`}
            style={{ width: `${Math.max(pct1, 2)}%` }}
          />
        </div>
        <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 progress-fill-animate ${winner2 ? 'bg-idm-gold-warm' : 'bg-white/15'}`}
            style={{ width: `${Math.max(pct2, 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ========== Player Card ========== */
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
  const dt = useDivisionTheme();

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group cursor-pointer w-full"
    >
      {/* Avatar with tier border */}
      <div className="relative">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 group-hover:scale-105 ${
          isLeading ? 'border-idm-gold-warm/50 shadow-[0_0_12px_rgba(229,190,74,0.2)] rivalry-leading-glow' : 'border-white/10'
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
        {/* Leading crown */}
        {isLeading && (
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-md z-10">
            <Crown className="w-3 h-3 text-[#0c0a06]" />
          </div>
        )}
        {/* Tier badge */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
          <TierBadge tier={player.tier} />
        </div>
      </div>

      {/* Player info */}
      <div className="text-center mt-1 min-w-0 w-full">
        <p className={`text-xs font-bold truncate group-hover:text-idm-gold-warm transition-colors ${
          isLeading ? 'text-white' : 'text-white/80'
        }`}>
          {player.gamertag}
        </p>
        {player.club && (
          <p className="text-[9px] text-muted-foreground truncate">{player.club.name}</p>
        )}
        <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${dt.bgSubtle} ${dt.borderSubtle} border`}>
          <Trophy className={`w-2.5 h-2.5 ${dt.neonText}`} />
          <span className={`text-[10px] font-bold tabular-nums ${dt.neonText}`}>{player.points}</span>
          <span className="text-[8px] text-muted-foreground">PTS</span>
        </div>
      </div>
    </button>
  );
}

/* ========== Main Component ========== */
export function DivisionRivalryWidget({ setSelectedPlayer }: DivisionRivalryWidgetProps) {
  const dt = useDivisionTheme();
  const division = useAppStore(s => s.division);

  const { data, isLoading } = useQuery<{ male: RivalryData | null; female: RivalryData | null }>({
    queryKey: ['division-rivalry'],
    queryFn: async () => {
      const res = await fetch('/api/division-rivalry');
      return res.json();
    },
    staleTime: 30000,
  });

  const rivalry = division === 'male' ? data?.male : data?.female;

  /* ─── Loading skeleton ─── */
  if (isLoading) {
    return (
      <Card className={`${dt.casinoCard} overflow-hidden rivalry-card h-full flex flex-col`}>
        <div className={dt.casinoBar} />
        <div className="p-4 space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-muted/20 rounded animate-pulse" />
            <div className="h-5 w-12 bg-muted/20 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4 justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 bg-muted/15 rounded-xl animate-pulse" />
              <div className="h-3 w-16 bg-muted/15 rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-muted/15 rounded-full animate-pulse" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 bg-muted/15 rounded-xl animate-pulse" />
              <div className="h-3 w-16 bg-muted/15 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 bg-muted/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  /* ─── Empty state ─── */
  if (!rivalry) {
    return (
      <Card className={`${dt.casinoCard} overflow-hidden h-full flex flex-col`}>
        <div className={dt.casinoBar} />
        <div className="p-4 text-center flex-1 flex flex-col items-center justify-center">
          <Swords className={`w-8 h-8 mx-auto mb-2 opacity-30 ${dt.text}`} />
          <p className="text-xs text-muted-foreground">Belum cukup data rivalitas</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Minimal 2 pemain diperlukan</p>
        </div>
      </Card>
    );
  }

  const { player1, player2, pointDiff, totalPlayers } = rivalry;

  const maxPoints = Math.max(player1.points, player2.points, 1);
  const maxWins = Math.max(player1.totalWins, player2.totalWins, 1);
  const maxMvp = Math.max(player1.totalMvp, player2.totalMvp, 1);
  const maxStreak = Math.max(player1.streak, player2.streak, 1);

  return (
    <Card className={`${dt.casinoCard} overflow-hidden rivalry-card h-full flex flex-col`}>
      <div className={dt.casinoBar} />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle} shrink-0`}>
        <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <Swords className={`w-3 h-3 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider">Rivalitas Puncak</h3>
        <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>
          <Zap className="w-2.5 h-2.5 mr-0.5" />
          {pointDiff} PTS
        </Badge>
      </div>

      {/* Rivalry Display */}
      <div className="p-4 space-y-4">
        {/* ─── Side-by-side on desktop, stacked on mobile ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          {/* Player 1 */}
          <RivalPlayerCard
            player={player1}
            isLeading={pointDiff > 0}
            division={division as 'male' | 'female'}
            onClick={() => setSelectedPlayer(player1)}
          />

          {/* VS Badge — animated gradient with decorative ring */}
          <div className="flex flex-col items-center gap-1 shrink-0 relative">
            {/* Outer pulse ring */}
            <div className="absolute inset-0 w-12 h-12 rounded-full rivalry-vs-pulse" aria-hidden="true" />
            {/* Diagonal slash lines behind VS */}
            <div className="rivalry-vs-slash w-14 h-14 absolute" aria-hidden="true" />
            <div className="rivalry-vs-badge w-12 h-12 rounded-full flex items-center justify-center relative">
              <span className="text-sm font-black text-idm-gold-warm relative z-10">VS</span>
            </div>
            <span className="text-[9px] text-muted-foreground/50 font-semibold">#1 vs #2</span>
          </div>

          {/* Player 2 */}
          <RivalPlayerCard
            player={player2}
            isLeading={pointDiff < 0}
            division={division as 'male' | 'female'}
            onClick={() => setSelectedPlayer(player2)}
          />
        </div>

        {/* Stat Comparison Bars */}
        <div className="space-y-2.5">
          <StatBar label="Points" value1={player1.points} value2={player2.points} max={maxPoints} />
          <StatBar label="Wins" value1={player1.totalWins} value2={player2.totalWins} max={maxWins} />
          <StatBar label="MVP" value1={player1.totalMvp} value2={player2.totalMvp} max={maxMvp} />
          <StatBar label="Streak" value1={player1.streak} value2={player2.streak} max={maxStreak} />
        </div>

        {/* Point Gap Indicator */}
        <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} border`}>
          <TrendingUp className="w-3 h-3 text-idm-gold-warm shrink-0" />
          <span className="text-[10px] text-muted-foreground">
            {pointDiff > 0 ? (
              <><span className="text-idm-gold-warm font-bold">{player1.gamertag}</span> unggul <span className="font-bold text-idm-gold-warm">{pointDiff} poin</span></>
            ) : pointDiff < 0 ? (
              <><span className="text-idm-gold-warm font-bold">{player2.gamertag}</span> unggul <span className="font-bold text-idm-gold-warm">{Math.abs(pointDiff)} poin</span></>
            ) : (
              <>Seri! Keduanya <span className="font-bold text-idm-gold-warm">imbang</span></>
            )}
          </span>
          {player1.streak > 1 && (
            <Badge className="bg-orange-500/10 text-orange-400 text-[8px] border-orange-500/20 px-1.5 py-0 shrink-0">
              <Flame className="w-2 h-2 mr-0.5" />{player1.streak}
            </Badge>
          )}
        </div>

        {/* Total Players in Division */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${dt.bgSubtle}`}>
          <div className="flex items-center gap-2">
            <Users className={`w-3.5 h-3.5 ${dt.neonText}`} />
            <span className="text-[10px] text-muted-foreground">Total Pemain Divisi</span>
          </div>
          <span className={`text-xs font-bold tabular-nums ${dt.neonGradient}`}>{totalPlayers}</span>
        </div>
      </div>
    </Card>
  );
}
