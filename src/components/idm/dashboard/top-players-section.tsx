'use client';

import React, { useState } from 'react';

import {
  Users, Trophy, Crown, Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PlayerCard } from '../player-card';
import { TierBadge } from '../tier-badge';
import { WeekNavigator } from '../week-navigator';
import { AnimatedEmptyState } from '../ui/animated-empty-state';
import { Card } from '@/components/ui/card';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useAppStore } from '@/lib/store';
import type { StatsData } from '@/types/stats';

interface TopPlayersSectionProps {
  data: StatsData;
  division: 'male' | 'female';
  setSelectedPlayer: (player: any) => void;
}

export function TopPlayersSection({ data, division, setSelectedPlayer }: TopPlayersSectionProps) {
  const dt = useDivisionTheme();
  const playerAuth = useAppStore(s => s.playerAuth);

  const skinMap = data?.skinMap || {};
  const loggedInPlayerId = playerAuth.isAuthenticated && playerAuth.account ? playerAuth.account.player.id : null;
  const loggedInSkins = playerAuth.isAuthenticated && playerAuth.account ? playerAuth.account.skins : undefined;

  const [topPlayerTab, setTopPlayerTab] = useState<'top3' | 'champion' | 'mvp'>('top3');
  const [selectedChampionWeek, setSelectedChampionWeek] = useState<number>(1);
  const [selectedMvpWeek, setSelectedMvpWeek] = useState<number>(1);

  return (
    <div className="stagger-item-subtle stagger-d1">
      <Card className={`${dt.casinoCard} overflow-hidden relative`}>
        <div className={dt.casinoBar} />
        {/* Desktop: decorative blur orb */}
        <div className={`hidden lg:block absolute top-8 right-8 w-32 h-32 rounded-full blur-3xl ${dt.bg} opacity-20 pointer-events-none`} />
        <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
          <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
            <Crown className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${dt.neonText}`} />
          </div>
          <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">Top Players</h3>
          <Badge className={`hidden sm:inline-flex ${dt.casinoBadge} ml-auto text-[9px]`}>SEASON BEST</Badge>
        </div>
        {/* Sub-tabs — scrollable on mobile */}
        <div className={`flex items-center gap-1 px-3 lg:px-6 py-2 border-b ${dt.borderSubtle} overflow-x-auto`} role="tablist" aria-label="Top players views">
          <button
            role="tab"
            aria-selected={topPlayerTab === 'top3'}
            onClick={() => setTopPlayerTab('top3')}
            className={`relative px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              topPlayerTab === 'top3'
                ? `border-current ${dt.text}`
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="w-3 h-3 mr-1 inline" />
            Top 3
          </button>
          <button
            role="tab"
            aria-selected={topPlayerTab === 'champion'}
            onClick={() => setTopPlayerTab('champion')}
            className={`relative px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              topPlayerTab === 'champion'
                ? `border-current ${dt.text}`
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Crown className="w-3 h-3 mr-1 inline" />
            Juara Pekan Ini
          </button>
          <button
            role="tab"
            aria-selected={topPlayerTab === 'mvp'}
            onClick={() => setTopPlayerTab('mvp')}
            className={`relative px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              topPlayerTab === 'mvp'
                ? `border-current ${dt.text}`
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Award className="w-3 h-3 mr-1 inline" />
            MVP
          </button>
        </div>
        <div className="p-3 lg:p-6">
          {/* Top 3 Tab */}
          {topPlayerTab === 'top3' && (
            <>
              {data.topPlayers?.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {data.topPlayers.slice(0, 3).map((p, idx) => (
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
                        skins={skinMap[p.id] || (p.id === loggedInPlayerId ? loggedInSkins : undefined)}
                        onClick={() => setSelectedPlayer(p)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatedEmptyState
                  icon={Users}
                  message="Belum ada peserta terdaftar"
                  hint="Peserta akan muncul setelah pendaftaran"
                />
              )}
            </>
          )}

          {/* Juara Pekan Ini Tab */}
          {topPlayerTab === 'champion' && (
            <>
              {data.weeklyChampions?.length > 0 ? (
                (() => {
                  const completedWeeks = data.weeklyChampions.map(c => c.weekNumber);
                  const totalWeeks = data.seasonProgress?.totalWeeks || 10;
                  const selected = data.weeklyChampions.find(c => c.weekNumber === selectedChampionWeek) || data.weeklyChampions[data.weeklyChampions.length - 1];
                  const winnerTeam = selected.winnerTeam;
                  const championPlayers = winnerTeam?.players || [];
                  return (
                    <div className="space-y-3">
                      {/* Team banner */}
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${dt.bgSubtle} ${dt.border}`}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shrink-0`}>
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-yellow-400 truncate">{winnerTeam?.name || 'TBD'}</p>
                          <p className="text-[10px] text-muted-foreground">Week {selected.weekNumber} Champion • {selected.tournamentName}</p>
                        </div>
                        <Badge className="bg-yellow-500/15 text-yellow-500 border-0 text-[9px]">🏆 JUARA</Badge>
                      </div>
                      {/* Players */}
                      {championPlayers.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {championPlayers.map((p, idx) => (
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
                                isMvp={selected.mvp?.id === p.id}
                                skins={skinMap[p.id]}
                                onClick={() => setSelectedPlayer({
                                  ...p,
                                  name: p.gamertag,
                                  maxStreak: 0,
                                  club: undefined,
                                  division: undefined,
                                })}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`p-6 rounded-xl ${dt.bgSubtle} ${dt.border} text-center`}>
                          <p className="text-sm text-muted-foreground">Belum ada data week ini</p>
                        </div>
                      )}
                      {/* Week Navigator */}
                      <WeekNavigator
                        totalWeeks={totalWeeks}
                        completedWeeks={completedWeeks}
                        selectedWeek={selectedChampionWeek}
                        onWeekChange={setSelectedChampionWeek}
                        accent={division === 'male' ? '#06b6d4' : '#a855f7'}
                        accentLight={division === 'male' ? '#22d3ee' : '#c084fc'}
                        size="xs"
                      />
                    </div>
                  );
                })()
              ) : (
                <div className={`p-6 rounded-xl ${dt.bgSubtle} ${dt.border} text-center`}>
                  <Crown className={`w-8 h-8 mx-auto mb-2 opacity-30 text-yellow-500`} />
                  <p className="text-sm text-muted-foreground">Belum ada juara pekan ini</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1">Juara akan muncul setelah turnamen selesai</p>
                </div>
              )}
            </>
          )}

          {/* MVP Tab */}
          {topPlayerTab === 'mvp' && (
            <>
              {data.mvpHallOfFame?.length > 0 ? (
                (() => {
                  const mvpWeeks = data.mvpHallOfFame.map(m => m.weekNumber);
                  const totalWeeks = data.seasonProgress?.totalWeeks || 10;
                  const selectedMvp = data.mvpHallOfFame.find(m => m.weekNumber === selectedMvpWeek) || data.mvpHallOfFame[data.mvpHallOfFame.length - 1];
                  return (
                    <div className="space-y-3">
                      {/* Week label */}
                      <div className={`flex items-center gap-2 px-1`}>
                        <div className={`w-5 h-5 rounded bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shrink-0`}>
                          <Award className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Week {selectedMvp.weekNumber}</span>
                        <span className="text-[9px] text-muted-foreground/80 truncate">{selectedMvp.tournamentName}</span>
                      </div>
                      {/* MVP Player Card + Stats */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div>
                          <PlayerCard
                              gamertag={selectedMvp.gamertag}
                              avatar={selectedMvp.avatar}
                              tier={selectedMvp.tier}
                              points={selectedMvp.points}
                              totalWins={selectedMvp.totalWins}
                              totalMvp={selectedMvp.totalMvp}
                              streak={selectedMvp.streak}
                              rank={1}
                              isMvp={true}
                              skins={skinMap[selectedMvp.id]}
                              onClick={() => setSelectedPlayer({
                                ...selectedMvp,
                                name: selectedMvp.gamertag,
                                maxStreak: 0,
                                club: undefined,
                                division: undefined,
                                matches: 0,
                              })}
                            />
                        </div>
                        {/* MVP stats highlight */}
                        <div className={`col-span-2 flex flex-col justify-center gap-2 p-3 rounded-xl ${dt.bgSubtle} ${dt.border}`}>
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-bold text-yellow-400">{selectedMvp.gamertag}</span>
                            <TierBadge tier={selectedMvp.tier} />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`p-2 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
                              <p className={`text-sm font-bold ${dt.neonText}`}>{selectedMvp.totalMvp}x</p>
                              <p className="text-[9px] text-muted-foreground">MVP</p>
                            </div>
                            <div className={`p-2 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
                              <p className={`text-sm font-bold ${dt.neonText}`}>{selectedMvp.points}</p>
                              <p className="text-[9px] text-muted-foreground">Points</p>
                            </div>
                            <div className={`p-2 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
                              <p className={`text-sm font-bold ${dt.neonText}`}>{selectedMvp.totalWins}</p>
                              <p className="text-[9px] text-muted-foreground">Wins</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Week Navigator */}
                      <WeekNavigator
                        totalWeeks={totalWeeks}
                        completedWeeks={mvpWeeks}
                        selectedWeek={selectedMvpWeek}
                        onWeekChange={setSelectedMvpWeek}
                        accent={division === 'male' ? '#06b6d4' : '#a855f7'}
                        accentLight={division === 'male' ? '#22d3ee' : '#c084fc'}
                        size="xs"
                      />
                    </div>
                  );
                })()
              ) : (
                <div className={`p-6 rounded-xl ${dt.bgSubtle} ${dt.border} text-center`}>
                  <Award className={`w-8 h-8 mx-auto mb-2 opacity-30 text-yellow-500`} />
                  <p className="text-sm text-muted-foreground">Belum ada MVP</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1">MVP akan ditampilkan setelah turnamen selesai dan ditentukan oleh admin</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
