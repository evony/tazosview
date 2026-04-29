'use client';

import Image from 'next/image';
import { Crown, Trophy, Medal, Flame, Calendar, Music, Shield, Swords } from 'lucide-react';
import { SectionHeader, AnimatedSection } from './shared';
import { TierBadge } from '../tier-badge';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import type { StatsData, SeasonChampionPlayer } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — SEASON CHAMPION SECTION
   Dual-avatar card: Male + Female Champion in ONE card
   - Shows completed season champions side-by-side
   - Always renders — attractive empty state when no champions
   - Center divider with crown ornament
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

  male.sort((a, b) => b.seasonNumber - a.seasonNumber);
  female.sort((a, b) => b.seasonNumber - a.seasonNumber);

  return { male, female };
}

/* ─── Duo Champion Card — Male + Female in one card ─── */
function DuoChampionCard({
  maleChampions,
  femaleChampions,
  setSelectedPlayer,
}: {
  maleChampions: ChampionData[];
  femaleChampions: ChampionData[];
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}) {
  const maleAccent = '#06b6d4';
  const femaleAccent = '#a855f7';
  const maleAccentLight = '#22d3ee';
  const femaleAccentLight = '#c084fc';

  const latestMale = maleChampions[0];
  const latestFemale = femaleChampions[0];
  const hasMale = !!latestMale;
  const hasFemale = !!latestFemale;
  const hasAny = hasMale || hasFemale;

  // Determine the "latest" season number for badge
  const latestSeasonNumber = hasMale && hasFemale
    ? Math.max(latestMale.seasonNumber, latestFemale.seasonNumber)
    : hasMale ? latestMale.seasonNumber : hasFemale ? latestFemale.seasonNumber : 0;

  // Previous champions (from either division)
  const previousMaleChamps = maleChampions.slice(1);
  const previousFemaleChamps = femaleChampions.slice(1);
  const hasPreviousChampions = previousMaleChamps.length > 0 || previousFemaleChamps.length > 0;

  if (!hasAny) {
    return (
      <div
        className="champion-card reveal reveal-fade-up rounded-xl overflow-hidden bg-[#0d0d1a] border transition-colors duration-500 hover:border-[rgba(212,168,83,0.2)]"
        style={{ borderColor: 'rgba(212,168,83,0.10)' }}
      >
        {/* Gold accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent" />

        {/* Header */}
        <div className="relative h-14 overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(maleAccent, 0.08)} 0%, transparent 50%, ${hexToRgba(femaleAccent, 0.08)} 100%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
          <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(maleAccent, 0.15) }}>
                  <Music className="w-3.5 h-3.5" style={{ color: maleAccentLight }} />
                </div>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(femaleAccent, 0.15) }}>
                  <Shield className="w-3.5 h-3.5" style={{ color: femaleAccentLight }} />
                </div>
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-[#a09880]">Male & Female</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: '#a09880', backgroundColor: 'rgba(160,152,128,0.08)', borderColor: 'rgba(160,152,128,0.15)' }}>
              <Swords className="w-2.5 h-2.5 inline mr-1" />Berlangsung
            </span>
          </div>
        </div>

        {/* Empty state */}
        <div className="relative flex flex-col items-center justify-center py-10 px-6 text-center">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 30% 50%, ${hexToRgba(maleAccent, 0.03)}, transparent 50%), radial-gradient(ellipse at 70% 50%, ${hexToRgba(femaleAccent, 0.03)}, transparent 50%)` }} />
          <div className="champion-crown-float relative mb-4">
            <Crown className="w-12 h-12 opacity-20 text-[#d4a853]" />
          </div>
          <p className="relative text-sm font-bold text-[#f5f0e8]/80 mb-1">Belum Ada Champion</p>
          <p className="relative text-xs text-[#a09880] max-w-[220px]">
            Juara Male & Female akan dinobatkan setelah season berakhir
          </p>
          <div className="relative flex items-center gap-2 mt-4">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#d4a853]/30" />
            <Trophy className="w-3 h-3 text-[#d4a853]/30" />
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#d4a853]/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="champion-card reveal reveal-fade-up group rounded-xl overflow-hidden bg-[#0d0d1a] border transition-colors duration-500 hover:border-[rgba(212,168,83,0.2)]"
      style={{ borderColor: 'rgba(212,168,83,0.10)' }}
    >
      {/* Gold accent line with shimmer */}
      <div className="champion-gold-shimmer h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent" />

      {/* Header */}
      <div className="relative h-14 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(maleAccent, 0.08)} 0%, transparent 50%, ${hexToRgba(femaleAccent, 0.08)} 100%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
        <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: hexToRgba(maleAccent, 0.18) }}>
                <Music className="w-3 h-3" style={{ color: maleAccentLight }} />
              </div>
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: hexToRgba(femaleAccent, 0.18) }}>
                <Shield className="w-3 h-3" style={{ color: femaleAccentLight }} />
              </div>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#d4a853]">Season Champion</span>
          </div>
          {latestSeasonNumber > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: '#d4a853', backgroundColor: 'rgba(212,168,83,0.12)', borderColor: 'rgba(212,168,83,0.25)' }}>
              <Crown className="w-2.5 h-2.5 inline mr-1" />S{latestSeasonNumber}
            </span>
          )}
        </div>
      </div>

      {/* Title row */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy className="w-4 h-4 shrink-0 text-[#d4a853]" />
          <span className="text-base sm:text-lg font-black text-[#f5f0e8] truncate">
            {hasMale && hasFemale ? `${latestMale.player.gamertag} & ${latestFemale.player.gamertag}` : hasMale ? latestMale.player.gamertag : latestFemale.player.gamertag}
          </span>
        </div>
      </div>

      {/* Gold divider */}
      <div className="h-px mx-4 bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.20)] to-transparent" />

      {/* ═══ DUO CHAMPION DISPLAY ═══ */}
      <div className="relative flex m-4 rounded-xl overflow-hidden border" style={{ minHeight: '360px', borderColor: 'rgba(212,168,83,0.10)' }}>
        {/* CHAMPION watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
          <span className="text-2xl font-black uppercase tracking-widest select-none" style={{ color: 'rgba(212,168,83,0.03)', WebkitTextStroke: '1px rgba(212,168,83,0.05)' }}>CHAMPION</span>
        </div>

        {/* Male side */}
        <div
          className="relative flex-1 cursor-pointer group/male"
          role="button"
          tabIndex={hasMale ? 0 : undefined}
          aria-label={hasMale ? `View champion: ${latestMale.player.gamertag}` : undefined}
          onClick={() => {
            if (hasMale) setSelectedPlayer({
              ...latestMale.player,
              division: 'male',
              club: latestMale.player.club ?? undefined,
              name: latestMale.player.gamertag,
              gamertag: latestMale.player.gamertag,
              avatar: latestMale.player.avatar,
              tier: latestMale.player.tier,
              points: latestMale.player.points,
              totalWins: latestMale.player.totalWins,
              streak: latestMale.player.streak || 0,
              maxStreak: latestMale.player.maxStreak || 0,
              totalMvp: latestMale.player.totalMvp || 0,
              matches: latestMale.player.matches || 0,
            });
          }}
        >
          {hasMale ? (
            <>
              <Image
                src={getAvatarUrl(latestMale.player.gamertag, 'male', latestMale.player.avatar)}
                alt={latestMale.player.gamertag}
                fill
                sizes="50vw"
                className="object-cover object-top transition-transform duration-500 group-hover/male:scale-105"
                style={{ transform: 'scale(1.0) translateX(2%)' }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/10 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0d0d1a]/50" />
              {/* Male accent glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 40% 80%, ${hexToRgba(maleAccent, 0.06)}, transparent 50%)` }} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${hexToRgba(maleAccent, 0.1)}, rgba(13,13,26,0.9))` }}>
              <div className="flex flex-col items-center gap-2 opacity-25">
                <Music className="w-10 h-10" style={{ color: maleAccent }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: maleAccentLight }}>Male</span>
              </div>
            </div>
          )}
          {/* Male info at bottom */}
          {hasMale && (
            <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-8 z-10" style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.95) 0%, transparent 100%)' }}>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] font-black" style={{ color: maleAccentLight }}>♂</span>
                <p className="text-sm sm:text-base font-black text-[#f5f0e8] truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {latestMale.player.gamertag}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <TierBadge tier={latestMale.player.tier} />
                <span className="text-[9px] font-bold" style={{ color: maleAccentLight }}>{latestMale.player.points}pts</span>
                <span className="text-[9px] font-bold text-green-400">{latestMale.player.totalWins}W</span>
                {(latestMale.player.streak ?? 0) > 0 && (
                  <span className="text-[9px] font-bold text-orange-400 flex items-center gap-0.5">
                    <Flame className="w-2 h-2" />{latestMale.player.streak}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ Center Divider — Bold gold line ═══ */}
        <div className="relative flex flex-col items-center justify-center shrink-0 z-10" style={{ width: '3px' }}>
          {/* Full-height gold line */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(to bottom, transparent 5%, ${hexToRgba('#d4a853', 0.6)} 20%, #d4a853 50%, ${hexToRgba('#d4a853', 0.6)} 80%, transparent 95%)`,
            boxShadow: `0 0 12px ${hexToRgba('#d4a853', 0.4)}, 0 0 24px ${hexToRgba('#d4a853', 0.15)}`,
          }} />
          {/* Crown ornament */}
          <div
            className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center z-10"
            style={{
              backgroundColor: '#0d0d1a',
              border: '2px solid #d4a853',
              boxShadow: `0 0 16px ${hexToRgba('#d4a853', 0.35)}, inset 0 0 6px ${hexToRgba('#d4a853', 0.1)}`,
            }}
          >
            <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#d4a853]" />
          </div>
          {/* Accent color dots */}
          <div className="absolute top-[20%] w-2 h-2 rounded-full z-10" style={{ backgroundColor: maleAccent, boxShadow: `0 0 6px ${hexToRgba(maleAccent, 0.5)}` }} />
          <div className="absolute bottom-[20%] w-2 h-2 rounded-full z-10" style={{ backgroundColor: femaleAccent, boxShadow: `0 0 6px ${hexToRgba(femaleAccent, 0.5)}` }} />
        </div>

        {/* Female side */}
        <div
          className="relative flex-1 cursor-pointer group/female"
          role="button"
          tabIndex={hasFemale ? 0 : undefined}
          aria-label={hasFemale ? `View champion: ${latestFemale.player.gamertag}` : undefined}
          onClick={() => {
            if (hasFemale) setSelectedPlayer({
              ...latestFemale.player,
              division: 'female',
              club: latestFemale.player.club ?? undefined,
              name: latestFemale.player.gamertag,
              gamertag: latestFemale.player.gamertag,
              avatar: latestFemale.player.avatar,
              tier: latestFemale.player.tier,
              points: latestFemale.player.points,
              totalWins: latestFemale.player.totalWins,
              streak: latestFemale.player.streak || 0,
              maxStreak: latestFemale.player.maxStreak || 0,
              totalMvp: latestFemale.player.totalMvp || 0,
              matches: latestFemale.player.matches || 0,
            });
          }}
        >
          {hasFemale ? (
            <>
              <Image
                src={getAvatarUrl(latestFemale.player.gamertag, 'female', latestFemale.player.avatar)}
                alt={latestFemale.player.gamertag}
                fill
                sizes="50vw"
                className="object-cover object-top transition-transform duration-500 group-hover/female:scale-105"
                style={{ transform: 'scale(1.0) translateX(-2%)' }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/10 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0d0d1a]/50" />
              {/* Female accent glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 60% 80%, ${hexToRgba(femaleAccent, 0.06)}, transparent 50%)` }} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(225deg, ${hexToRgba(femaleAccent, 0.1)}, rgba(13,13,26,0.9))` }}>
              <div className="flex flex-col items-center gap-2 opacity-25">
                <Shield className="w-10 h-10" style={{ color: femaleAccent }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: femaleAccentLight }}>Female</span>
              </div>
            </div>
          )}
          {/* Female info at bottom */}
          {hasFemale && (
            <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-8 z-10" style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.95) 0%, transparent 100%)' }}>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] font-black" style={{ color: femaleAccentLight }}>♀</span>
                <p className="text-sm sm:text-base font-black text-[#f5f0e8] truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {latestFemale.player.gamertag}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <TierBadge tier={latestFemale.player.tier} />
                <span className="text-[9px] font-bold" style={{ color: femaleAccentLight }}>{latestFemale.player.points}pts</span>
                <span className="text-[9px] font-bold text-green-400">{latestFemale.player.totalWins}W</span>
                {(latestFemale.player.streak ?? 0) > 0 && (
                  <span className="text-[9px] font-bold text-orange-400 flex items-center gap-0.5">
                    <Flame className="w-2 h-2" />{latestFemale.player.streak}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Crown badge with CSS float animation */}
        <div className="champion-crown-float absolute top-2 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-[#d4a853] flex items-center justify-center shadow-lg shadow-[#d4a853]/20">
          <Crown className="w-3 h-3 text-[#0d0d1a]" />
        </div>
      </div>

      {/* Previous season champions */}
      {hasPreviousChampions && (
        <div className="px-4 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#a09880] mb-2">Juara Sebelumnya</p>
          <div className="space-y-1.5">
            {previousMaleChamps.map(champ => (
              <button
                key={`m-s${champ.seasonNumber}`}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/5 hover:border-idm-gold-warm/20 transition-colors cursor-pointer text-left"
                onClick={() => {
                  setSelectedPlayer({
                    ...champ.player,
                    division: 'male',
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
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: maleAccentLight, backgroundColor: hexToRgba(maleAccent, 0.1) }}>♂ S{champ.seasonNumber}</span>
                <span className="text-xs font-bold text-[#f5f0e8] truncate">{champ.player.gamertag}</span>
                <span className="text-[9px] ml-auto" style={{ color: maleAccentLight }}>{champ.player.points}pts</span>
              </button>
            ))}
            {previousFemaleChamps.map(champ => (
              <button
                key={`f-s${champ.seasonNumber}`}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/5 hover:border-idm-gold-warm/20 transition-colors cursor-pointer text-left"
                onClick={() => {
                  setSelectedPlayer({
                    ...champ.player,
                    division: 'female',
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
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: femaleAccentLight, backgroundColor: hexToRgba(femaleAccent, 0.1) }}>♀ S{champ.seasonNumber}</span>
                <span className="text-xs font-bold text-[#f5f0e8] truncate">{champ.player.gamertag}</span>
                <span className="text-[9px] ml-auto" style={{ color: femaleAccentLight }}>{champ.player.points}pts</span>
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
   Single card with Male + Female champion side-by-side
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
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(6,182,212,0.06) 0%, transparent 45%), radial-gradient(ellipse at 70% 20%, rgba(168,85,247,0.06) 0%, transparent 45%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(212,168,83,0.08) 0%, transparent 50%)' }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Section Header */}
        <AnimatedSection>
          <SectionHeader
            icon={Crown}
            label="SEASON CHAMPION"
            title="Season Champion"
            subtitle="Juara season Tarkam IDM — pemain peringkat #1 saat season ditutup"
          />
        </AnimatedSection>

        {/* Single Duo Champion Card */}
        <div className="mt-10 sm:mt-14">
          {isDataLoading ? (
            <div className="rounded-xl bg-[#0d0d1a] border border-white/5 h-80 animate-pulse" />
          ) : (
            <DuoChampionCard
              maleChampions={maleChampions}
              femaleChampions={femaleChampions}
              setSelectedPlayer={setSelectedPlayer}
            />
          )}
        </div>
      </div>
    </section>
  );
}
