'use client';

import { useState } from 'react';
import { Crown, TrendingUp, Flame, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PlayerCard } from '../player-card';
import { TierBadge } from '../tier-badge';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import type { StatsData, TopPlayer, WeeklyPerformer } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   COMMUNITY CHAMPIONS — Tabbed: Top 3 / Top Form / Juara
   ═══════════════════════════════════════════════════════ */
interface CommunityChampionsProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}

export function CommunityChampions({ maleData, femaleData, onPlayerClick }: CommunityChampionsProps) {
  const [activeTab, setActiveTab] = useState<'top3' | 'topform'>('top3');

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('top3')}
          className={`relative px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'top3'
              ? 'border-idm-gold-warm text-idm-gold-warm'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Crown className="w-3 h-3 mr-1 inline" />
          Top 3
        </button>
        <button
          onClick={() => setActiveTab('topform')}
          className={`relative px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'topform'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-3 h-3 mr-1 inline" />
          Top Form
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'top3' && (
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
      )}

      {activeTab === 'topform' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TopFormSection
            division="male"
            performer={maleData?.weeklyTopPerformers?.[0]}
            onPlayerClick={onPlayerClick}
          />
          <TopFormSection
            division="female"
            performer={femaleData?.weeklyTopPerformers?.[0]}
            onPlayerClick={onPlayerClick}
          />
        </div>
      )}
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

/* ─── Top Form Section — Weekly Best Performer per division ─── */
function TopFormSection({
  division,
  performer,
  onPlayerClick,
}: {
  division: 'male' | 'female';
  performer: WeeklyPerformer | undefined;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const dt = getDivisionTheme(division);
  const accentColor = division === 'male' ? '#06b6d4' : '#a855f7';

  return (
    <Card className={`${dt.casinoCard} overflow-hidden relative`}>
      <div className={dt.casinoBar} />
      <div className={`hidden lg:block absolute top-8 right-8 w-32 h-32 rounded-full blur-3xl ${dt.bg} opacity-20 pointer-events-none`} />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
        <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded bg-amber-500/15 flex items-center justify-center shrink-0`}>
          <TrendingUp className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-amber-400" />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">
          {division === 'male' ? 'Male' : 'Female'} Top Form
        </h3>
        {performer && (
          <Badge className="hidden sm:inline-flex bg-amber-500/15 text-amber-500 border-0 ml-auto text-[9px]">🔥 MINGGU INI</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 lg:p-6">
        {performer ? (
          <div className="space-y-3">
            {/* Top Form banner */}
            <div className={`flex items-center gap-3 p-3 rounded-xl ${dt.bgSubtle} ${dt.border}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-400 truncate">{performer.gamertag}</p>
                <p className="text-[10px] text-muted-foreground">Week {performer.weekNumber} • Composite {performer.compositeScore}</p>
              </div>
              <Badge className="bg-amber-500/15 text-amber-500 border-0 text-[9px]">🔥 TOP FORM</Badge>
            </div>
            {/* Player Card + Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <PlayerCard
                  gamertag={performer.gamertag}
                  avatar={performer.avatar}
                  tier={performer.tier}
                  points={performer.points}
                  totalWins={performer.weeklyWins}
                  totalMvp={0}
                  streak={performer.streak}
                  rank={1}
                  club={performer.club ? { id: '', name: performer.club } : undefined}
                  onClick={() => onPlayerClick({
                    ...performer,
                    name: performer.gamertag,
                    totalWins: performer.weeklyWins,
                    totalMvp: 0,
                    maxStreak: performer.streak,
                    matches: performer.weeklyMatches,
                    division,
                  } as TopPlayer & { division?: string }, division)}
                />
              </div>
              {/* Composite Score Breakdown */}
              <div className={`col-span-2 flex flex-col justify-center gap-2 p-3 rounded-xl ${dt.bgSubtle} ${dt.border}`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">{performer.compositeScore}</span>
                  <span className="text-[9px] text-muted-foreground">COMPOSITE</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-2 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
                    <p className={`text-sm font-bold ${dt.neonText}`}>+{performer.weeklyPointsGained}</p>
                    <p className="text-[9px] text-muted-foreground">+Pts</p>
                  </div>
                  <div className={`p-2 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
                    <p className={`text-sm font-bold ${dt.neonText}`}>{performer.weeklyWinRate}%</p>
                    <p className="text-[9px] text-muted-foreground">Win%</p>
                  </div>
                  <div className={`p-2 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
                    <div className="flex items-center justify-center gap-0.5">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <p className={`text-sm font-bold ${dt.neonText}`}>{performer.streak}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Streak</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-8 rounded-xl ${dt.bgSubtle} ${dt.border} text-center`}>
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20 text-amber-500" />
            <p className="text-sm font-semibold text-muted-foreground/80 mb-1">Belum Ada Top Form {division === 'male' ? 'Male' : 'Female'}</p>
            <p className="text-xs text-muted-foreground/50">Pemain dengan performa terbaik minggu ini akan muncul di sini</p>
          </div>
        )}
      </div>
    </Card>
  );
}
