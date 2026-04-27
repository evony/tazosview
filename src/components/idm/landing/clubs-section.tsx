'use client';

import Image from 'next/image';
import { Users, Shield, Music, ChevronUp, ChevronDown, Crown } from 'lucide-react';
import { SectionHeader } from './shared';
import { CardSkeleton } from '../ui/skeleton';
import { TierBadge } from '../tier-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getAvatarUrl } from '@/lib/utils';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import type { StatsData } from '@/types/stats';

interface LeagueClub {
  id: string;
  name: string;
  logo: string | null;
  bannerImage: string | null;
  wins: number;
  losses: number;
  points: number;
  gameDiff: number;
  memberCount: number;
  members: {
    id: string;
    gamertag: string;
    name: string;
    division: string;
    tier: string;
    points: number;
    role: string;
    avatar: string | null;
  }[];
}

interface ClubsSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  cmsSections: Record<string, any>;
  leagueData: {
    hasData: boolean;
    clubs?: LeagueClub[];
    ligaChampion?: {
      id: string;
      name: string;
      logo: string | null;
      seasonNumber: number;
    } | null;
    stats?: { totalClubs: number };
  } | undefined;
  setSelectedClub: (club: StatsData['clubs'][0] & { division?: string; members?: any[] } | null) => void;
  selectedClub: (StatsData['clubs'][0] & { division?: string }) | null;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
  showAllClubs: boolean;
  setShowAllClubs: (show: boolean) => void;
  showAllPlayers: boolean;
  setShowAllPlayers: (show: boolean) => void;
}

export function ClubsSection({ maleData, femaleData, isDataLoading, cmsSections, leagueData, setSelectedClub, selectedClub, setSelectedPlayer, showAllClubs, setShowAllClubs, showAllPlayers, setShowAllPlayers }: ClubsSectionProps) {
  return (<>
      {/* ========== CLUB PESERTA — Premium Showcase ========== */}
      <section id="clubs" className="relative py-24 px-4 overflow-hidden">
        {/* Background — Clean roster with subtle dot grid + central gold glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-background" />
        {/* Subtle dot grid pattern — roster/ledger feel */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        {/* Central gold glow for champion callout area */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.06) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, rgba(6,182,212,0.02) 0%, transparent 40%), radial-gradient(ellipse at 70% 70%, rgba(168,85,247,0.02) 0%, transparent 40%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="stagger-item">
            <SectionHeader icon={Users} label={cmsSections.clubs?.subtitle || "Kompetisi"} title={cmsSections.clubs?.title || "Club & Peserta"} subtitle={cmsSections.clubs?.description || "Club-club terbaik yang bertarung di arena IDM League"} />

            {/* Liga IDM Champion callout */}
            {leagueData?.ligaChampion && (
              <div className="stagger-item-fast mb-8" style={{ animationDelay: '60ms' }}>
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-idm-gold-warm/15 bg-idm-gold-warm/5">
                    <Crown className="w-3.5 h-3.5 text-idm-gold-warm" />
                    <span className="text-[10px] font-bold text-idm-gold-warm/70 uppercase tracking-wider">Liga IDM S{leagueData.ligaChampion.seasonNumber} Champion</span>
                    {leagueData.ligaChampion.logo && (
                      <ClubLogoImage clubName={leagueData.ligaChampion.name} dbLogo={leagueData.ligaChampion.logo} alt={leagueData.ligaChampion.name} width={20} height={20} className="w-5 h-5 rounded object-cover" />
                    )}
                    <span className="text-xs font-black text-white">{leagueData.ligaChampion.name}</span>
                    <span className="text-[10px] text-muted-foreground/60">•</span>
                    <span className="text-[10px] text-muted-foreground/60">{leagueData?.stats?.totalClubs || 0} club bertanding</span>
                  </div>
                </div>
              </div>
            )}

            {isDataLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} className="h-40" />
                ))}
              </div>
            ) : (() => {
              // ── Use leagueData.clubs as the single source of truth for clubs ──
              // The /api/league endpoint correctly finds the season with clubs,
              // includes members, and is consistent with what the admin panel shows.
              // Previously, merging maleData.clubs + femaleData.clubs caused
              // duplication because /api/stats doesn't filter clubs by division.
              const leagueClubs = leagueData?.clubs || [];

              // Sort clubs alphabetically for display
              const sortedClubs = [...leagueClubs].sort((a, b) => a.name.localeCompare(b.name));

              // Top players per division — sorted alphabetically (list, not leaderboard)
              const malePlayers = [...(maleData?.topPlayers || [])].sort((a, b) => a.gamertag.localeCompare(b.gamertag));
              const femalePlayers = [...(femaleData?.topPlayers || [])].sort((a, b) => a.gamertag.localeCompare(b.gamertag));

              return (
                <Tabs defaultValue="clubs" className="w-full">
                  {/* Tab Navigation — Toornament underline style */}
                  <div className="border-b border-idm-gold-warm/10 mb-8">
                    <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
                      {[
                        { value: 'clubs', label: 'Club', icon: Users },
                        { value: 'male', label: 'Player Male', icon: Music },
                        { value: 'female', label: 'Player Female', icon: Shield },
                      ].map(tab => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative px-4 sm:px-6 py-2.5 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-idm-gold-warm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-idm-gold-warm text-muted-foreground hover:text-idm-gold-warm/70 transition-colors"
                        >
                          <tab.icon className="w-3.5 h-3.5 mr-1.5 inline" />
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* ═══════════════ CLUB TAB ═══════════════ */}
                  <TabsContent value="clubs" className="mt-0">
                    {sortedClubs.length === 0 ? null : (
                      <>
                        {/* Club Grid - Limited display */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(showAllClubs ? sortedClubs : sortedClubs.slice(0, 6)).map((club, idx) => {
                            const isChampion = leagueData?.ligaChampion && club.name === leagueData.ligaChampion.name;
                            return (
                              <div
                                key={club.id}
                                className="stagger-item-fast hover-scale-md cursor-pointer group/club"
                                style={{ animationDelay: `${idx * 30}ms` }}
                                onClick={() => setSelectedClub({
                                  id: club.id,
                                  name: club.name,
                                  logo: club.logo,
                                  wins: club.wins,
                                  losses: club.losses,
                                  points: club.points,
                                  gameDiff: club.gameDiff,
                                  _count: { members: club.memberCount },
                                  members: club.members?.map(m => ({
                                    id: m.id,
                                    name: m.name,
                                    gamertag: m.gamertag,
                                    avatar: m.avatar,
                                    tier: m.tier,
                                    points: m.points,
                                  })),
                                })}
                              >
                                <div className={`club-card-shimmer club-card-hover relative rounded-xl bg-white/[0.06] border p-3 pb-4 text-center transition-all duration-300 overflow-hidden hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:scale-[1.03] ${
                                  isChampion ? 'border-idm-gold-warm/30 shadow-[0_0_20px_rgba(212,168,83,0.1)]' : 'border-white/[0.06] hover:border-idm-gold-warm/20'
                                }`}>
                                  {/* Champion badge */}
                                  {isChampion && (
                                    <div className="absolute top-1.5 right-1.5 z-10">
                                      <div className="w-5 h-5 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-md">
                                        <Crown className="w-3 h-3 text-[#0c0a06]" />
                                      </div>
                                    </div>
                                  )}
                                  <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white/5 mb-2 group-hover/club:scale-105 transition-transform duration-300 ${
                                    isChampion ? 'border-2 border-idm-gold-warm/30' : 'border border-idm-gold-warm/20'
                                  }`}>
                                    <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt={club.name} fill sizes="80px" className="object-cover" />
                                  </div>
                                  <p className={`text-xs sm:text-sm font-black truncate transition-colors duration-200 ${
                                    isChampion ? 'text-idm-gold-warm' : 'text-white group-hover/club:text-idm-gold-warm'
                                  }`}>{club.name}</p>
                                  {isChampion && (
                                    <p className="text-[10px] font-bold text-idm-gold-warm/60 uppercase tracking-wider mt-0.5">S{leagueData!.ligaChampion!.seasonNumber} Champion</p>
                                  )}
                                  <div className="mt-2 flex items-center justify-center gap-2 text-[10px]">
                                    <span className="font-black text-[#e8d5a3]">{club.points} PTS</span>
                                    <span className="text-white/30">•</span>
                                    <span className="font-bold text-green-400">{club.wins}W</span>
                                    <span className="text-white/60">/</span>
                                    <span className="font-bold text-red-400">{club.losses}L</span>
                                  </div>
                                  {/* Win Rate Progress Bar */}
                                  {(() => {
                                    const totalGames = club.wins + club.losses;
                                    const winRate = totalGames > 0 ? (club.wins / totalGames) * 100 : 0;
                                    const rateClass = winRate >= 60 ? '' : winRate >= 40 ? 'mid' : 'low';
                                    return totalGames > 0 ? (
                                      <div className="club-winrate-bar mt-2.5">
                                        <div
                                          className={`club-winrate-bar-fill progress-fill-animate ${rateClass}`}
                                          style={{ width: `${winRate}%` }}
                                        />
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Show More/Less Button */}
                        {sortedClubs.length > 6 && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => setShowAllClubs(!showAllClubs)}
                              className="club-showmore-btn flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold"
                            >
                              <span className="flex items-center gap-1.5">
                                {showAllClubs ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Tampilkan Lebih Sedikit
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Lihat Semua ({sortedClubs.length} Club)
                                  </>
                                )}
                              </span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* ═══════════════ PLAYER MALE TAB ═══════════════ */}
                  <TabsContent value="male" className="mt-0">
                    {malePlayers.length === 0 ? (
                      <div className="py-12 text-center">
                        <Music className="w-10 h-10 text-[#06b6d4]/15 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Belum ada player male</p>
                      </div>
                    ) : (
                      <>
                        {/* Player Grid - Compact */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(showAllPlayers ? malePlayers : malePlayers.slice(0, 6)).map((player, idx) => {
                            const losses = player.matches - player.totalWins;
                            return (
                              <div
                                key={player.id}
                                className="stagger-item-fast hover-scale-md cursor-pointer group/player"
                                style={{ animationDelay: `${idx * 30}ms` }}
                                onClick={() => setSelectedPlayer({ ...player, division: 'male' })}
                              >
                                <div className="relative rounded-xl bg-white/[0.06] border border-[#06b6d4]/10 text-center transition-all duration-300 overflow-hidden hover:shadow-[0_8px_24px_rgba(6,182,212,0.08)]">
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent z-20" />
                                  <div className="relative h-28 sm:h-32 overflow-hidden group-hover/player:scale-105 transition-transform duration-500">
                                    <Image src={getAvatarUrl(player.gamertag, 'male', player.avatar)} alt={player.gamertag} fill sizes="200px" className="object-cover object-top" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/30 to-transparent" />
                                  </div>
                                  <div className="relative px-2 pb-2.5 pt-1">
                                    <p className="text-xs font-black text-white truncate group-hover/player:text-[#22d3ee] transition-colors duration-200">{player.gamertag}</p>
                                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px]">
                                      <TierBadge tier={player.tier} />
                                      <span className="font-black text-[#22d3ee]">{player.points}</span>
                                      <span className="text-green-400">{player.totalWins}W</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Show More/Less Button */}
                        {malePlayers.length > 6 && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => setShowAllPlayers(!showAllPlayers)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#06b6d4]/10 text-[#22d3ee] text-xs font-semibold border border-[#06b6d4]/20 hover:bg-[#06b6d4]/20 transition-all"
                            >
                              {showAllPlayers ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Tampilkan Lebih Sedikit
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Lihat Semua ({malePlayers.length} Player)
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* ═══════════════ PLAYER FEMALE TAB ═══════════════ */}
                  <TabsContent value="female" className="mt-0">
                    {femalePlayers.length === 0 ? (
                      <div className="py-12 text-center">
                        <Shield className="w-10 h-10 text-[#a855f7]/15 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Belum ada player female</p>
                      </div>
                    ) : (
                      <>
                        {/* Player Grid - Compact */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(showAllPlayers ? femalePlayers : femalePlayers.slice(0, 6)).map((player, idx) => {
                            return (
                              <div
                                key={player.id}
                                className="stagger-item-fast hover-scale-md cursor-pointer group/player"
                                style={{ animationDelay: `${idx * 30}ms` }}
                                onClick={() => setSelectedPlayer({ ...player, division: 'female' })}
                              >
                                <div className="relative rounded-xl bg-white/[0.06] border border-[#a855f7]/10 text-center transition-all duration-300 overflow-hidden hover:shadow-[0_8px_24px_rgba(168,85,247,0.08)]">
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent z-20" />
                                  <div className="relative h-28 sm:h-32 overflow-hidden group-hover/player:scale-105 transition-transform duration-500">
                                    <Image src={getAvatarUrl(player.gamertag, 'female', player.avatar)} alt={player.gamertag} fill sizes="200px" className="object-cover object-top" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/30 to-transparent" />
                                  </div>
                                  <div className="relative px-2 pb-2.5 pt-1">
                                    <p className="text-xs font-black text-white truncate group-hover/player:text-[#c084fc] transition-colors duration-200">{player.gamertag}</p>
                                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px]">
                                      <TierBadge tier={player.tier} />
                                      <span className="font-black text-[#c084fc]">{player.points}</span>
                                      <span className="text-green-400">{player.totalWins}W</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Show More/Less Button */}
                        {femalePlayers.length > 6 && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => setShowAllPlayers(!showAllPlayers)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#a855f7]/10 text-[#c084fc] text-xs font-semibold border border-[#a855f7]/20 hover:bg-[#a855f7]/20 transition-all"
                            >
                              {showAllPlayers ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Tampilkan Lebih Sedikit
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Lihat Semua ({femalePlayers.length} Player)
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              );
            })()}
          </div>
        </div>
      </section>
  </>);
}
