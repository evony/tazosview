'use client';

import React from 'react';
import { Trophy, Star, Flame, Crown, Zap, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '../tier-badge';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import { getAvatarUrl, clubToString } from '@/lib/utils';
import Image from 'next/image';
import type { StatsData, TopPlayer, MvpHallOfFameEntry } from '@/types/stats';

/* ═══════════════════════════════════════════
   MVP Spotlight Props
   ═══════════════════════════════════════════ */
interface MvpSpotlightProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}

/* ═══════════════════════════════════════════
   MVP Division Card — Same structure as ChampionsSection
   Header bar + inner content with horizontal MVP layout
   ═══════════════════════════════════════════ */
function MvpDivisionCard({
  division,
  data,
  onPlayerClick,
}: {
  division: 'male' | 'female';
  data?: StatsData;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const dt = getDivisionTheme(division);
  const emoji = division === 'male' ? '🕺' : '💃';

  // Priority: first entry from mvpHallOfFame, otherwise #1 from topPlayers
  const mvpEntry = data?.mvpHallOfFame?.[0];
  const topPlayer = data?.topPlayers?.[0];

  const featuredPlayer: (TopPlayer & { division?: string }) | null = mvpEntry
    ? {
        id: mvpEntry.id,
        name: mvpEntry.gamertag,
        gamertag: mvpEntry.gamertag,
        avatar: mvpEntry.avatar,
        tier: mvpEntry.tier,
        points: mvpEntry.points,
        totalWins: mvpEntry.totalWins,
        streak: mvpEntry.streak,
        maxStreak: mvpEntry.streak,
        totalMvp: mvpEntry.totalMvp,
        matches: 0,
        division,
      }
    : topPlayer
      ? { ...topPlayer, division }
      : null;

  if (!featuredPlayer) {
    return (
      <Card className={`${dt.casinoCard} overflow-hidden relative`}>
        <div className={dt.casinoBar} />
        {/* Header — same structure as ChampionsSection */}
        <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
          <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
            <Star className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${dt.neonText}`} />
          </div>
          <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">MVP {division === 'male' ? 'Male' : 'Female'}</h3>
        </div>
        <div className="p-6 text-center">
          <Award className={`w-8 h-8 mx-auto mb-2 opacity-30 ${dt.text}`} />
          <p className="text-xs text-muted-foreground">Belum ada MVP {division === 'male' ? 'Male' : 'Female'}</p>
        </div>
      </Card>
    );
  }

  const clubName = clubToString(
    ('club' in featuredPlayer ? featuredPlayer.club : undefined) as Parameters<typeof clubToString>[0]
  );

  const stats = [
    { label: 'Points', value: featuredPlayer.points, icon: Trophy, color: 'text-idm-gold-warm' },
    { label: 'Wins', value: featuredPlayer.totalWins, icon: Crown, color: 'text-green-400' },
    { label: 'MVP', value: featuredPlayer.totalMvp, icon: Star, color: 'text-yellow-400' },
    { label: 'Streak', value: featuredPlayer.streak, icon: Flame, color: 'text-orange-400' },
  ];

  return (
    <Card className={`${dt.casinoCard} overflow-hidden relative`}>
      <div className={dt.casinoBar} />
      {/* Decorative blur orb — same as ChampionsSection */}
      <div className={`hidden lg:block absolute top-8 right-8 w-32 h-32 rounded-full blur-3xl ${dt.bg} opacity-20 pointer-events-none`} />

      {/* Header — same structure as ChampionsSection */}
      <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
        <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <Star className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">MVP {division === 'male' ? 'Male' : 'Female'}</h3>
        <Badge className={`hidden sm:inline-flex ${dt.casinoBadge} ml-auto text-[9px]`}>MVP SPOTLIGHT</Badge>
      </div>

      {/* MVP Content — horizontal layout inside same padded container as Champions */}
      <div className="p-3 lg:p-6">
        <div className="flex gap-3 sm:gap-4 items-stretch">
          {/* Avatar panel */}
          <div className={`relative w-28 sm:w-36 lg:w-40 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br ${
            division === 'male' ? 'from-idm-male/25 to-idm-male/5' : 'from-idm-female/25 to-idm-female/5'
          }`} style={{ aspectRatio: '3/4' }}>
            {/* Full-cover avatar */}
            <Image
              src={getAvatarUrl(featuredPlayer.gamertag, division, featuredPlayer.avatar)}
              alt={featuredPlayer.gamertag}
              width={128}
              height={200}
              className="w-full h-full object-cover"
              unoptimized
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

            {/* Crown badge — top center */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-[0_0_12px_rgba(212,168,83,0.4)]">
                <Crown className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-[#0c0a06]" />
              </div>
            </div>

            {/* MVP badge — bottom */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-gradient-to-r from-idm-gold-warm to-amber-500 text-black text-[7px] font-black border-0 px-2 py-0.5 shadow-[0_0_8px_rgba(229,190,74,0.3)] whitespace-nowrap">
                <Star className="w-2 h-2 mr-0.5" />
                MVP
              </Badge>
            </div>
          </div>

          {/* Stats + Info panel */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            {/* Player name + badges */}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <h3 className="text-sm lg:text-base font-black truncate">{featuredPlayer.gamertag}</h3>
                <TierBadge tier={featuredPlayer.tier} />
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                {clubName && (
                  <span className="text-[9px] lg:text-[10px] text-muted-foreground/70 truncate">{clubName}</span>
                )}
                <Badge className={`${dt.badgeBg} text-[7px] lg:text-[8px] border py-0 px-1.5`}>
                  {emoji} {division === 'male' ? 'Male' : 'Female'}
                </Badge>
              </div>
            </div>

            {/* Stats grid — 2x2 */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${dt.bgSubtle} border ${dt.borderSubtle}`}
                >
                  <stat.icon className={`w-3 h-3 shrink-0 ${stat.color}`} />
                  <div className="min-w-0">
                    <p className={`text-[10px] sm:text-xs font-black tabular-nums ${stat.color} leading-tight`}>
                      {stat.value}
                    </p>
                    <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* MVP info (if from Hall of Fame) */}
            {mvpEntry && (
              <div className="flex items-center gap-1 mb-2">
                <Trophy className="w-2.5 h-2.5 text-idm-gold-warm/60 shrink-0" />
                <span className="text-[8px] text-muted-foreground/50 truncate">
                  MVP W{mvpEntry.weekNumber} — {mvpEntry.tournamentName}
                </span>
              </div>
            )}

            {/* CTA button */}
            <button
              onClick={() => onPlayerClick(featuredPlayer, division)}
              className={`w-full py-1.5 rounded-lg bg-gradient-to-r ${
                division === 'male'
                  ? 'from-idm-male/20 to-idm-male-light/10 border-idm-male/20'
                  : 'from-idm-female/20 to-idm-female-light/10 border-idm-female/20'
              } border text-[9px] sm:text-[10px] font-bold ${dt.text} hover:brightness-110 transition-all flex items-center justify-center gap-1 cursor-pointer`}
            >
              <Zap className="w-2.5 h-2.5" />
              Lihat Profil
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   Main Component — MVP Spotlight
   Same grid layout as CommunityChampions
   ═══════════════════════════════════════════ */
export function MvpSpotlight({ maleData, femaleData, onPlayerClick }: MvpSpotlightProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <MvpDivisionCard
        division="male"
        data={maleData}
        onPlayerClick={onPlayerClick}
      />
      <MvpDivisionCard
        division="female"
        data={femaleData}
        onPlayerClick={onPlayerClick}
      />
    </div>
  );
}
