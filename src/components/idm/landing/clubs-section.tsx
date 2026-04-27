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
  // Get Tarkam season champions from allSeasons data (not from Liga)
  const seasonChampions = [
    ...(maleData?.allSeasons || []),
    ...(femaleData?.allSeasons || []),
  ]
    .filter(s => s.status === 'completed' && s.championClub)
    .map(s => ({ ...s.championClub!, seasonNumber: s.number, division: s.name.toLowerCase().includes('female') ? 'female' as const : 'male' as const }));
  return (<>
      {/* ========== CLUB TARKAM — Card-based Layout ========== */}
      <section id="clubs" className="relative py-16 sm:py-24 px-4 overflow-hidden bg-[#0a0a14]">
        {/* Background — living atmosphere, matching Champions/MVP sections */}
        <div className="absolute inset-0 opacity-[0.025] parallax-section-bg" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0 parallax-section-bg" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.06) 0%, transparent 50%), radial-gradient(ellipse at 15% 50%, rgba(6,182,212,0.04) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(168,85,247,0.04) 0%, transparent 45%)' }} />
        {/* Top & bottom edge glow lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="stagger-item">
            <SectionHeader icon={Users} label={cmsSections.clubs?.subtitle || "Kompetisi"} title={cmsSections.clubs?.title || "Club Tarkam"} subtitle={cmsSections.clubs?.description || "Club-club terbaik yang bertarung di arena Tarkam IDM"} />

            {/* Tarkam Season Champion callout — from allSeasons data */}
            {seasonChampions.length > 0 && (
              <div className="stagger-item-fast mb-8" style={{ animationDelay: '60ms' }}>
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#d4a853]/15 bg-[#d4a853]/5">
                    <Crown className="w-3.5 h-3.5 text-[#d4a853]" />
                    {seasonChampions.map((ch, i) => (
                      <span key={ch.id} className="flex items-center gap-2">
                        {i > 0 && <span className="text-[10px] text-[#a09880]/40">•</span>}
                        <span className="text-[10px] font-bold text-[#d4a853]/70 uppercase tracking-wider">
                          Tarkam {ch.division === 'female' ? '♀' : '♂'} S{ch.seasonNumber} Champion
                        </span>
                        {ch.logo && (
                          <ClubLogoImage clubName={ch.name} dbLogo={ch.logo} alt={ch.name} width={20} height={20} className="w-5 h-5 rounded object-cover" />
                        )}
                        <span className="text-xs font-black text-white">{ch.name}</span>
                      </span>
                    ))}
                    <span className="text-[10px] text-[#a09880]/40">•</span>
                    <span className="text-[10px] text-[#a09880]/60">{leagueData?.stats?.totalClubs || (maleData?.clubs?.length || 0) + (femaleData?.clubs?.length || 0)} club bertanding</span>
                  </div>
                </div>
              </div>
            )}

            {isDataLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <CardSkeleton key={i} className="h-56" />
                ))}
              </div>
            ) : (() => {
              const leagueClubs = leagueData?.clubs || [];
              const sortedClubs = [...leagueClubs].sort((a, b) => a.name.localeCompare(b.name));
              const malePlayers = [...(maleData?.topPlayers || [])].sort((a, b) => a.gamertag.localeCompare(b.gamertag));
              const femalePlayers = [...(femaleData?.topPlayers || [])].sort((a, b) => a.gamertag.localeCompare(b.gamertag));

              return (
                <Tabs defaultValue="clubs" className="w-full">
                  {/* Tab Navigation — Gold-styled tabs */}
                  <div className="border-b border-[#d4a853]/10 mb-8">
                    <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
                      {[
                        { value: 'clubs', label: 'Club', icon: Users },
                        { value: 'male', label: 'Player Male', icon: Music },
                        { value: 'female', label: 'Player Female', icon: Shield },
                      ].map(tab => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative px-4 sm:px-6 py-2.5 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#d4a853] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#d4a853] text-[#a09880] hover:text-[#d4a853]/70 transition-colors"
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
                        {/* Club Grid — show 6 on mobile, 10 on desktop; rest behind CTA */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {(showAllClubs ? sortedClubs : sortedClubs.slice(0, 10)).map((club, idx) => {
                            const isChampion = seasonChampions.some(ch => ch.name === club.name);
                            const maleMembers = club.members?.filter(m => m.division === 'male').length || 0;
                            const femaleMembers = club.members?.filter(m => m.division === 'female').length || 0;
                            // Hide clubs 7-10 on mobile when not expanded
                            const hiddenOnMobile = !showAllClubs && idx >= 6;
                            return (
                              <div
                                key={club.id}
                                className={`stagger-item-fast cursor-pointer group/club ${hiddenOnMobile ? 'hidden sm:block' : ''}`}
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
                                <div className={`relative rounded-xl bg-[#0d0d1a] border text-center transition-all duration-300 overflow-hidden group-hover/club:border-[rgba(212,168,83,0.25)] group-hover/club:shadow-[0_0_30px_rgba(212,168,83,0.08)] group-hover/club:scale-[1.02] ${
                                  isChampion ? 'border-[rgba(212,168,83,0.25)] shadow-[0_0_20px_rgba(212,168,83,0.08)]' : 'border-[rgba(212,168,83,0.1)]'
                                }`}>
                                  {/* Gold accent line at top */}
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent opacity-50 z-20" />

                                  {/* Logo watermark background */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] group-hover/club:opacity-[0.14] transition-opacity duration-500 pointer-events-none">
                                    <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt="" width={200} height={200} className="w-[80%] h-auto aspect-square object-contain" />
                                  </div>

                                  {/* Champion badge removed — champion info shown in callout above */}

                                  {/* Card content */}
                                  <div className="relative z-10 flex flex-col items-center px-4 pt-8 pb-5">
                                    {/* Large centered logo with glow ring */}
                                    <div className="relative mb-4">
                                      {/* Outer glow ring */}
                                      <div className={`absolute -inset-1.5 rounded-2xl transition-all duration-500 group-hover/club:shadow-[0_0_20px_rgba(212,168,83,0.35)] ${
                                        isChampion ? 'shadow-[0_0_16px_rgba(212,168,83,0.3)]' : 'shadow-[0_0_10px_rgba(212,168,83,0.12)]'
                                      }`} style={{ background: isChampion ? 'linear-gradient(135deg, rgba(212,168,83,0.25), rgba(212,168,83,0.08))' : 'linear-gradient(135deg, rgba(212,168,83,0.15), rgba(212,168,83,0.04))' }} />
                                      {/* Logo container */}
                                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#0d0d1a] border-2 border-[#d4a853]/20 flex items-center justify-center group-hover/club:scale-105 group-hover/club:border-[#d4a853]/35 transition-all duration-500">
                                        <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt={club.name} fill sizes="96px" className="object-cover" />
                                      </div>
                                    </div>

                                    {/* Club name */}
                                    <p className={`text-sm font-black truncate max-w-full transition-colors duration-200 ${
                                      isChampion ? 'text-[#d4a853]' : 'text-white group-hover/club:text-[#d4a853]'
                                    }`}>{club.name}</p>

                                    {/* Champion label removed — shown in callout above */}

                                    {/* Division badges */}
                                    <div className="flex items-center justify-center gap-1.5 mt-2.5">
                                      {maleMembers > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#06b6d4]/10 text-[#22d3ee] border border-[#06b6d4]/15">
                                          <Music className="w-2.5 h-2.5" />{maleMembers} Male
                                        </span>
                                      )}
                                      {femaleMembers > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/15">
                                          <Shield className="w-2.5 h-2.5" />{femaleMembers} Fem
                                        </span>
                                      )}
                                    </div>

                                    {/* Member count */}
                                    <div className="mt-2 flex items-center gap-1">
                                      <Users className="w-3 h-3 text-[#a09880]/50" />
                                      <span className="text-[10px] text-[#a09880]/60 font-medium">{club.memberCount} anggota</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Show More/Less Button — Gold accent */}
                        {sortedClubs.length > 6 && (
                          <div className="flex justify-center mt-6">
                            <button
                              onClick={() => setShowAllClubs(!showAllClubs)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5 text-[#d4a853] text-xs font-semibold transition-all duration-300 hover:bg-[#d4a853]/10 hover:border-[#d4a853]/30 hover:shadow-[0_0_20px_rgba(212,168,83,0.12)] cursor-pointer"
                            >
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
                        <p className="text-sm text-[#a09880]">Belum ada player male</p>
                      </div>
                    ) : (
                      <>
                        {/* Player Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(showAllPlayers ? malePlayers : malePlayers.slice(0, 6)).map((player, idx) => {
                            return (
                              <div
                                key={player.id}
                                className="stagger-item-fast cursor-pointer group/player"
                                style={{ animationDelay: `${idx * 30}ms` }}
                                onClick={() => setSelectedPlayer({ ...player, division: 'male' })}
                              >
                                <div className="relative rounded-xl bg-[#0d0d1a] border border-[rgba(212,168,83,0.08)] text-center transition-all duration-300 overflow-hidden group-hover/player:border-[#06b6d4]/25 group-hover/player:shadow-[0_0_24px_rgba(6,182,212,0.08)]">
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent z-20" />
                                  <div className="relative h-32 sm:h-36 overflow-hidden group-hover/player:scale-105 transition-transform duration-500">
                                    <Image src={getAvatarUrl(player.gamertag, 'male', player.avatar)} alt={player.gamertag} fill sizes="200px" className="object-cover object-top" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/30 to-transparent" />
                                  </div>
                                  <div className="relative px-3 pb-3 pt-1">
                                    <p className="text-xs font-black text-white truncate group-hover/player:text-[#22d3ee] transition-colors duration-200">{player.gamertag}</p>
                                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px]">
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
                          <div className="flex justify-center mt-6">
                            <button
                              onClick={() => setShowAllPlayers(!showAllPlayers)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#06b6d4]/20 bg-[#06b6d4]/5 text-[#22d3ee] text-xs font-semibold transition-all duration-300 hover:bg-[#06b6d4]/10 hover:border-[#06b6d4]/30 cursor-pointer"
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
                        <p className="text-sm text-[#a09880]">Belum ada player female</p>
                      </div>
                    ) : (
                      <>
                        {/* Player Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(showAllPlayers ? femalePlayers : femalePlayers.slice(0, 6)).map((player, idx) => {
                            return (
                              <div
                                key={player.id}
                                className="stagger-item-fast cursor-pointer group/player"
                                style={{ animationDelay: `${idx * 30}ms` }}
                                onClick={() => setSelectedPlayer({ ...player, division: 'female' })}
                              >
                                <div className="relative rounded-xl bg-[#0d0d1a] border border-[rgba(212,168,83,0.08)] text-center transition-all duration-300 overflow-hidden group-hover/player:border-[#a855f7]/25 group-hover/player:shadow-[0_0_24px_rgba(168,85,247,0.08)]">
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent z-20" />
                                  <div className="relative h-32 sm:h-36 overflow-hidden group-hover/player:scale-105 transition-transform duration-500">
                                    <Image src={getAvatarUrl(player.gamertag, 'female', player.avatar)} alt={player.gamertag} fill sizes="200px" className="object-cover object-top" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/30 to-transparent" />
                                  </div>
                                  <div className="relative px-3 pb-3 pt-1">
                                    <p className="text-xs font-black text-white truncate group-hover/player:text-[#c084fc] transition-colors duration-200">{player.gamertag}</p>
                                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px]">
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
                          <div className="flex justify-center mt-6">
                            <button
                              onClick={() => setShowAllPlayers(!showAllPlayers)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#a855f7]/20 bg-[#a855f7]/5 text-[#c084fc] text-xs font-semibold transition-all duration-300 hover:bg-[#a855f7]/10 hover:border-[#a855f7]/30 cursor-pointer"
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
