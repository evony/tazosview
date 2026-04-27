'use client';

import { motion } from 'framer-motion';
import { Crown, Trophy, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PlayerCard } from '../player-card';
import { TierBadge } from '../tier-badge';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import type { StatsData, TopPlayer } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   COMMUNITY CHAMPIONS — Uses PlayerCard from division dashboard
   ═══════════════════════════════════════════════════════ */
interface CommunityChampionsProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}

export function CommunityChampions({ maleData, femaleData, onPlayerClick }: CommunityChampionsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {maleData?.topPlayers?.length ? (
        <ChampionsSection
          title="Male Champions"
          emoji="🕺"
          division="male"
          data={maleData}
          onPlayerClick={onPlayerClick}
        />
      ) : null}
      {femaleData?.topPlayers?.length ? (
        <ChampionsSection
          title="Female Champions"
          emoji="💃"
          division="female"
          data={femaleData}
          onPlayerClick={onPlayerClick}
        />
      ) : null}
    </div>
  );
}

/* ─── Per-division Champions Card ─── */
function ChampionsSection({
  title,
  emoji,
  division,
  data,
  onPlayerClick,
}: {
  title: string;
  emoji: string;
  division: 'male' | 'female';
  data: StatsData;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const dt = getDivisionTheme(division);
  const top3 = data.topPlayers.slice(0, 3);

  return (
    <Card className={`${dt.casinoCard} overflow-hidden relative`}>
      <div className={dt.casinoBar} />
      {/* Decorative blur orb */}
      <div className={`hidden lg:block absolute top-8 right-8 w-32 h-32 rounded-full blur-3xl ${dt.bg} opacity-20 pointer-events-none`} />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
        <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <Crown className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <Badge className={`hidden sm:inline-flex ${dt.casinoBadge} ml-auto text-[9px]`}>SEASON BEST</Badge>
      </div>

      {/* Top 3 PlayerCard grid — same style as division dashboard */}
      <div className="p-3 lg:p-6">
        {top3.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {top3.map((p, idx) => (
              <div key={p.id}>
                <PlayerCard
                  gamertag={p.gamertag}
                  avatar={p.avatar}
                  tier={p.tier}
                  points={p.points}
                  totalWins={p.totalWins}
                  totalMvp={p.totalMvp}
                  streak={p.streak}
                  rank={idx + 1}
                  isMvp={p.totalMvp > 0 && idx === 0}
                  club={p.club}
                  onClick={() => onPlayerClick({ ...p, division }, division)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-6 rounded-xl ${dt.bgSubtle} ${dt.border} text-center`}>
            <Crown className={`w-8 h-8 mx-auto mb-2 opacity-30 ${dt.text}`} />
            <p className="text-sm text-muted-foreground">Belum ada champion</p>
          </div>
        )}
      </div>
    </Card>
  );
}
