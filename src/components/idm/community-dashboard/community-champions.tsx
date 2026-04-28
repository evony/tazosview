'use client';

import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PlayerCard } from '../player-card';
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
      <ChampionsSection
        title="Male Champions"
        emoji="🕺"
        division="male"
        topPlayers={maleData?.topPlayers || []}
        onPlayerClick={onPlayerClick}
      />
      <ChampionsSection
        title="Female Champions"
        emoji="💃"
        division="female"
        topPlayers={femaleData?.topPlayers || []}
        onPlayerClick={onPlayerClick}
      />
    </div>
  );
}

/* ─── Per-division Champions Card ─── */
function ChampionsSection({
  title,
  emoji,
  division,
  topPlayers,
  onPlayerClick,
}: {
  title: string;
  emoji: string;
  division: 'male' | 'female';
  topPlayers: TopPlayer[];
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const dt = getDivisionTheme(division);
  const top3 = topPlayers.slice(0, 3);

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
        {top3.length > 0 && (
          <Badge className={`hidden sm:inline-flex ${dt.casinoBadge} ml-auto text-[9px]`}>SEASON BEST</Badge>
        )}
      </div>

      {/* Content — top 3 players or empty state */}
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
          <div className={`p-8 rounded-xl ${dt.bgSubtle} ${dt.border} text-center`}>
            <Crown className={`w-10 h-10 mx-auto mb-3 opacity-20 ${dt.text}`} />
            <p className="text-sm font-semibold text-muted-foreground/80 mb-1">Belum Ada Champion {division === 'male' ? 'Male' : 'Female'}</p>
            <p className="text-xs text-muted-foreground/50">Champion akan muncul setelah season dimulai dan pertandingan selesai</p>
          </div>
        )}
      </div>
    </Card>
  );
}
