'use client';

import Image from 'next/image';
import { Crown, Trophy, Medal, Flame, Calendar, Music, Shield, Swords } from 'lucide-react';
import { SectionHeader, AnimatedSection } from './shared';
import { TierBadge } from '../tier-badge';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import type { StatsData, SeasonChampionPlayer } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — SEASON CHAMPION SECTION
   Dedicated section showing ONLY completed season champions.
   - Male Champion = #1 ranked player when male season closed
   - Female Champion = #1 ranked player when female season closed
   - ALWAYS renders — shows attractive empty state when no champions yet
   - Does NOT show weekly champions — those are in Puncak Prestasi
   ═══════════════════════════════════════════════════════════════ */

interface SeasonChampionSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}

/* ─── Season Champion Data ─── */
interface ChampionData {
  seasonNumber: number;
  seasonName: string;
  player: SeasonChampionPlayer;
  division: 'male' | 'female';
}

/* ─── Build champion list from completed seasons ─── */
function buildSeasonChampions(
  maleData: StatsData | undefined,
  femaleData: StatsData | undefined
): { male: ChampionData[]; female: ChampionData[] } {
  const male: ChampionData[] = [];
  const female: ChampionData[] = [];

  const completedMaleSeasons = maleData?.allSeasons?.filter(s => s.status === 'completed' && s.championPlayer) || [];
  const completedFemaleSeasons = femaleData?.allSeasons?.filter(s => s.status === 'completed' && s.championPlayer) || [];

  for (const season of completedMaleSeasons) {
    if (season.championPlayer) {
      male.push({
        seasonNumber: season.number,
        seasonName: season.name,
        player: season.championPlayer,
        division: 'male',
      });
    }
  }

  for (const season of completedFemaleSeasons) {
    if (season.championPlayer) {
      female.push({
        seasonNumber: season.number,
        seasonName: season.name,
        player: season.championPlayer,
        division: 'female',
      });
    }
  }

  // Sort by season number descending (most recent first)
  male.sort((a, b) => b.seasonNumber - a.seasonNumber);
  female.sort((a, b) => b.seasonNumber - a.seasonNumber);

  return { male, female };
}

/* ─── Empty/Upcoming Champion Card — shown when no season is completed yet ─── */
function EmptyChampionCard({ division }: { division: 'male' | 'female' }) {
  const isMale = division === 'male';
  const accent = isMale ? '#06b6d4' : '#a855f7';
  const accentLight = isMale ? '#22d3ee' : '#c084fc';
  const DivisionIcon = isMale ? Music : Shield;
  const divisionLabel = isMale ? 'Male' : 'Female';

  return (
    <div
      className="champion-card reveal reveal-fade-up rounded-xl overflow-hidden bg-[#0d0d1a] border transition-colors duration-500 hover:border-[rgba(212,168,83,0.2)]"
      style={{ borderColor: hexToRgba(accent, 0.10) }}
    >
      {/* Gold accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent" />

      {/* Header */}
      <div className="relative h-14 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.12)} 0%, transparent 60%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
        <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(accent, 0.18) }}>
              <DivisionIcon className="w-3.5 h-3.5" style={{ color: accentLight }} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: accentLight }}>{divisionLabel}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: '#a09880', backgroundColor: 'rgba(160,152,128,0.08)', borderColor: 'rgba(160,152,128,0.15)' }}>
            <Swords className="w-2.5 h-2.5 inline mr-1" />Berlangsung
          </span>
        </div>
      </div>

      {/* Empty state content */}
      <div className="relative flex flex-col items-center justify-center py-10 px-6 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 50%, ${hexToRgba(accent, 0.04)}, transparent 60%)` }} />

        {/* Crown with float animation */}
        <div className="champion-crown-float relative mb-4">
          <Crown className="w-12 h-12 opacity-20" style={{ color: accent }} />
        </div>

        <p className="relative text-sm font-bold text-[#f5f0e8]/80 mb-1">Belum Ada Champion</p>
        <p className="relative text-xs text-[#a09880] max-w-[200px]">
          Juara {divisionLabel} akan dinobatkan setelah season berakhir
        </p>

        {/* Decorative line */}
        <div className="relative flex items-center gap-2 mt-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#d4a853]/30" />
          <Trophy className="w-3 h-3 text-[#d4a853]/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#d4a853]/30" />
        </div>
      </div>
    </div>
  );
}

/* ─── Champion Card — with data ─── */
function ChampionCard({
  champions,
  division,
  setSelectedPlayer,
}: {
  champions: ChampionData[];
  division: 'male' | 'female';
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}) {
  const isMale = division === 'male';
  const accent = isMale ? '#06b6d4' : '#a855f7';
  const accentLight = isMale ? '#22d3ee' : '#c084fc';
  const DivisionIcon = isMale ? Music : Shield;
  const divisionLabel = isMale ? 'Male' : 'Female';

  if (champions.length === 0) {
    return <EmptyChampionCard division={division} />;
  }

  const latestChampion = champions[0]; // Most recent season champion

  return (
    <div
      className="champion-card reveal reveal-fade-up group rounded-xl overflow-hidden bg-[#0d0d1a] border transition-colors duration-500 hover:border-[rgba(212,168,83,0.2)]"
      style={{ borderColor: hexToRgba(accent, 0.10) }}
    >
      {/* Gold accent line with shimmer */}
      <div className="champion-gold-shimmer h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent" />

      {/* Header */}
      <div className="relative h-14 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.12)} 0%, transparent 60%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
        <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(accent, 0.18) }}>
              <DivisionIcon className="w-3.5 h-3.5" style={{ color: accentLight }} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: accentLight }}>{divisionLabel}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: '#d4a853', backgroundColor: 'rgba(212,168,83,0.12)', borderColor: 'rgba(212,168,83,0.25)' }}>
            <Crown className="w-2.5 h-2.5 inline mr-1" />S{latestChampion.seasonNumber}
          </span>
        </div>
      </div>

      {/* Champion player section */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy className="w-4 h-4 shrink-0" style={{ color: '#d4a853' }} />
          <span className="text-base sm:text-lg font-black text-[#f5f0e8] truncate">Season {latestChampion.seasonNumber} Champion</span>
        </div>
      </div>

      {/* Gold divider */}
      <div className="h-px mx-4 bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.20)] to-transparent" />

      {/* Champion player display */}
      <div
        className="relative flex rounded-xl overflow-hidden border m-4 cursor-pointer group/avatar"
        style={{ height: '260px', borderColor: hexToRgba(accent, 0.12) }}
        role="button"
        tabIndex={0}
        aria-label={`View champion profile: ${latestChampion.player.gamertag}`}
        onClick={() => {
          setSelectedPlayer({
            ...latestChampion.player,
            division,
            club: latestChampion.player.club ?? undefined,
            name: latestChampion.player.gamertag,
            gamertag: latestChampion.player.gamertag,
            avatar: latestChampion.player.avatar,
            tier: latestChampion.player.tier,
            points: latestChampion.player.points,
            totalWins: latestChampion.player.totalWins,
            streak: latestChampion.player.streak || 0,
            maxStreak: latestChampion.player.maxStreak || 0,
            totalMvp: latestChampion.player.totalMvp || 0,
            matches: latestChampion.player.matches || 0,
          });
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            setSelectedPlayer({
              ...latestChampion.player,
              division,
              club: latestChampion.player.club ?? undefined,
              name: latestChampion.player.gamertag,
              gamertag: latestChampion.player.gamertag,
              avatar: latestChampion.player.avatar,
              tier: latestChampion.player.tier,
              points: latestChampion.player.points,
              totalWins: latestChampion.player.totalWins,
              streak: latestChampion.player.streak || 0,
              maxStreak: latestChampion.player.maxStreak || 0,
              totalMvp: latestChampion.player.totalMvp || 0,
              matches: latestChampion.player.matches || 0,
            });
          }
        }}
      >
        {/* CHAMPION watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
          <span className="text-2xl font-black uppercase tracking-widest select-none" style={{ color: 'rgba(212,168,83,0.03)', WebkitTextStroke: '1px rgba(212,168,83,0.05)' }}>CHAMPION</span>
        </div>
        {/* Crown badge with CSS float animation */}
        <div className="champion-crown-float absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-[#d4a853] flex items-center justify-center">
          <Crown className="w-2.5 h-2.5 text-[#0d0d1a]" />
        </div>

        {/* Champion avatar - full bleed */}
        <Image
          src={getAvatarUrl(latestChampion.player.gamertag, division, latestChampion.player.avatar)}
          alt={latestChampion.player.gamertag}
          fill
          sizes="50vw"
          className="object-cover object-top transition-transform duration-500 group-hover/avatar:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/5 to-transparent" />

        {/* Player info at bottom */}
        <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-6 z-10" style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.95) 0%, transparent 100%)' }}>
          <p className="text-sm sm:text-base font-black text-[#f5f0e8] truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {latestChampion.player.gamertag}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <TierBadge tier={latestChampion.player.tier} />
            <span className="text-[9px] font-bold" style={{ color: accentLight }}>{latestChampion.player.points}pts</span>
            <span className="text-[9px] font-bold text-green-400">{latestChampion.player.totalWins}W</span>
            {(latestChampion.player.streak ?? 0) > 0 && (
              <span className="text-[9px] font-bold text-orange-400 flex items-center gap-0.5">
                <Flame className="w-2 h-2" />{latestChampion.player.streak}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Previous season champions list (if multiple completed seasons) */}
      {champions.length > 1 && (
        <div className="px-4 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#a09880] mb-2">Juara Sebelumnya</p>
          <div className="space-y-1.5">
            {champions.slice(1).map(champ => (
              <button
                key={champ.seasonNumber}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/5 hover:border-idm-gold-warm/20 transition-colors cursor-pointer text-left"
                onClick={() => {
                  setSelectedPlayer({
                    ...champ.player,
                    division,
                    club: champ.player.club ?? undefined,
                    name: champ.player.gamertag,
                    gamertag: champ.player.gamertag,
                    avatar: champ.player.avatar,
                    tier: champ.player.tier,
                    points: champ.player.points,
                    totalWins: champ.player.totalWins,
                    streak: champ.player.streak || 0,
                    maxStreak: champ.player.maxStreak || 0,
                    totalMvp: champ.player.totalMvp || 0,
                    matches: champ.player.matches || 0,
                  });
                }}
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: '#d4a853', backgroundColor: 'rgba(212,168,83,0.1)' }}>S{champ.seasonNumber}</span>
                <span className="text-xs font-bold text-[#f5f0e8] truncate">{champ.player.gamertag}</span>
                <span className="text-[9px] ml-auto" style={{ color: accentLight }}>{champ.player.points}pts</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SEASON CHAMPION SECTION COMPONENT
   ALWAYS renders — shows empty state when no champions yet
   ═══════════════════════════════════════════════════════════════ */
export function SeasonChampionSection({
  maleData,
  femaleData,
  isDataLoading,
  setSelectedPlayer,
}: SeasonChampionSectionProps) {
  const { male: maleChampions, female: femaleChampions } = buildSeasonChampions(maleData, femaleData);

  return (
    <section id="season-champion" role="region" aria-label="Season Champion" className="landing-section relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a14]" />
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(212,168,83,0.08) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(6,182,212,0.04) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(168,85,247,0.04) 0%, transparent 45%)' }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <AnimatedSection>
          <SectionHeader
            icon={Crown}
            label="SEASON CHAMPION"
            title="Season Champion"
            subtitle="Juara season Tarkam IDM — pemain peringkat #1 saat season ditutup"
          />
        </AnimatedSection>

        {/* Champion Cards Grid — always shows both cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative mt-10 sm:mt-14">
          {/* Center divider */}
          <div className="hidden md:block absolute top-12 bottom-12 left-1/2 w-px bg-gradient-to-b from-transparent via-[rgba(212,168,83,0.20)] to-transparent z-10" />

          {isDataLoading ? (
            <>
              <div className="rounded-xl bg-[#0d0d1a] border border-white/5 h-80 animate-pulse" />
              <div className="rounded-xl bg-[#0d0d1a] border border-white/5 h-80 animate-pulse" />
            </>
          ) : (
            <>
              <ChampionCard champions={maleChampions} division="male" setSelectedPlayer={setSelectedPlayer} />
              <ChampionCard champions={femaleChampions} division="female" setSelectedPlayer={setSelectedPlayer} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
