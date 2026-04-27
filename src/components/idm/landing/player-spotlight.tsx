'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Crown, Flame, Zap, Trophy, Music, Shield, ChevronLeft, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '../tier-badge';
import { SectionHeader } from './shared';
import { AnimatedEmptyState } from '../ui/animated-empty-state';
import { getAvatarUrl, clubToString, hexToRgba } from '@/lib/utils';
import type { StatsData, TopPlayer, SeasonInfo, SeasonChampionPlayer } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   PlayerSpotlight — Featured #1 ranked player or Season Champion
   - Active season: shows ranking #1 player
   - Completed season: shows champion player (championPlayerId)
   - Season selector for browsing past seasons
   ═══════════════════════════════════════════════════════════════ */

interface PlayerSpotlightProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  setSelectedPlayer: (player: any) => void;
}

const SEASONS_PER_PAGE = 5;

/* ─── Accent config per division ─── */
const DIVISION_CONFIG = {
  male: {
    accent: '#06b6d4',
    accentLight: '#22d3ee',
    accentFaint: '#67e8f9',
    icon: Music,
    label: 'Male',
  },
  female: {
    accent: '#a855f7',
    accentLight: '#c084fc',
    accentFaint: '#e9d5ff',
    icon: Shield,
    label: 'Female',
  },
} as const;

/* ─── Stat item for the 2x2 grid ─── */
function StatItem({
  icon: Icon,
  value,
  label,
  valueColor,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  value: string | number;
  label: string;
  valueColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 opacity-60" style={{ color: valueColor }} />
        <span className="text-xl sm:text-2xl font-black" style={{ color: valueColor }}>
          {value}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
        {label}
      </span>
    </div>
  );
}

/* ─── Season Selector — paginated, same style as MVP section ─── */
function SpotlightSeasonSelector({
  seasons,
  selectedSeasonId,
  onSelect,
  accent,
  accentLight,
  seasonPage,
  onSeasonPageChange,
}: {
  seasons: SeasonInfo[];
  selectedSeasonId: string;
  onSelect: (id: string) => void;
  accent: string;
  accentLight: string;
  seasonPage: number;
  onSeasonPageChange: (page: number) => void;
}) {
  if (seasons.length <= 1) return null;

  const totalSeasonPages = Math.ceil(seasons.length / SEASONS_PER_PAGE);
  const spStart = seasonPage * SEASONS_PER_PAGE;
  const spEnd = Math.min(spStart + SEASONS_PER_PAGE, seasons.length);
  const visibleSeasons = seasons.slice(spStart, spEnd);

  return (
    <div className="flex items-center gap-1.5">
      {totalSeasonPages > 1 && (
        <button
          onClick={() => onSeasonPageChange(Math.max(0, seasonPage - 1))}
          disabled={seasonPage === 0}
          className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:scale-110 cursor-pointer"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.10)' }}
          aria-label="Previous seasons"
        >
          <ChevronLeft className="w-2.5 h-2.5" />
        </button>
      )}

      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {visibleSeasons.map((s) => {
          const isActive = s.id === selectedSeasonId;
          const isCompleted = s.status === 'completed';
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`shrink-0 flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                isActive ? 'scale-105' : 'hover:scale-105'
              }`}
              style={isActive ? {
                backgroundColor: hexToRgba(accent, 0.30),
                color: accentLight,
                border: `1px solid ${hexToRgba(accent, 0.50)}`,
                boxShadow: `0 0 12px ${hexToRgba(accent, 0.25)}`,
              } : {
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.60)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              aria-label={`Season ${s.number}`}
              aria-pressed={isActive}
            >
              <Calendar className="w-2.5 h-2.5" />
              <span>S{s.number}</span>
              {isCompleted && <CheckCircle2 className="w-2.5 h-2.5 opacity-60" />}
              <span className="text-[8px] font-normal opacity-60">({s.tournamentCount}w)</span>
            </button>
          );
        })}
      </div>

      {totalSeasonPages > 1 && (
        <button
          onClick={() => onSeasonPageChange(Math.min(totalSeasonPages - 1, seasonPage + 1))}
          disabled={seasonPage === totalSeasonPages - 1}
          className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:scale-110 cursor-pointer"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.10)' }}
          aria-label="Next seasons"
        >
          <ChevronRight className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

/* ─── Skeleton card for loading state ─── */
function SpotlightCardSkeleton({ accent }: { accent: string }) {
  return (
    <div
      className="perspective-card card-shine relative rounded-2xl overflow-hidden border p-6"
      style={{
        borderColor: hexToRgba(accent, 0.15),
        background: `linear-gradient(135deg, rgba(12,10,6,0.95), rgba(12,10,6,0.85))`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 z-20"
        style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 30%, ${hexToRgba(accent, 0.06)}, transparent 60%)` }}
      />
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <div className="skeleton-shimmer w-24 h-24 sm:w-28 sm:h-28 rounded-full" />
        <div className="skeleton-shimmer h-6 w-28 rounded" />
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer h-5 w-8 rounded" />
          <div className="skeleton-shimmer h-5 w-16 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-3 space-y-2">
              <div className="skeleton-shimmer h-6 w-10 mx-auto rounded" />
              <div className="skeleton-shimmer h-2 w-12 mx-auto rounded" />
            </div>
          ))}
        </div>
        <div className="skeleton-shimmer h-3 w-24 rounded" />
        <div className="skeleton-shimmer h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/* ─── Main spotlight card for a single player ─── */
function SpotlightCard({
  player,
  division,
  isChampion,
  seasonNumber,
  setSelectedPlayer,
}: {
  player: TopPlayer | SeasonChampionPlayer;
  division: 'male' | 'female';
  isChampion: boolean;
  seasonNumber: number;
  setSelectedPlayer: (player: any) => void;
}) {
  const cfg = DIVISION_CONFIG[division];
  const DivisionIcon = cfg.icon;

  return (
    <div
      className="perspective-card card-shine hover-scale-md relative rounded-2xl overflow-hidden border p-6 cursor-pointer group transition-all duration-300"
      style={{
        borderColor: isChampion ? hexToRgba('#e5be4a', 0.35) : hexToRgba(cfg.accent, 0.15),
        background: `linear-gradient(135deg, rgba(12,10,6,0.95), rgba(12,10,6,0.85))`,
      }}
      role="button"
      tabIndex={0}
      aria-label={`Lihat profil ${player.gamertag}`}
      onClick={() => setSelectedPlayer({ ...player, division })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedPlayer({ ...player, division });
        }
      }}
    >
      {/* Accent top line — gold for champion, division color for #1 */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 z-20 transition-all duration-300 group-hover:opacity-100 opacity-70"
        style={{ background: `linear-gradient(to right, transparent, ${isChampion ? '#e5be4a' : cfg.accent}, transparent)` }}
      />

      {/* Animated radial background glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500 group-hover:opacity-100 opacity-60"
        style={{ background: `radial-gradient(ellipse at 50% 30%, ${hexToRgba(isChampion ? '#e5be4a' : cfg.accent, 0.08)}, transparent 60%)` }}
      />

      {/* Hover glow shadow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `0 0 60px ${hexToRgba(isChampion ? '#e5be4a' : cfg.accent, 0.15)}, 0 0 30px ${hexToRgba(isChampion ? '#e5be4a' : cfg.accent, 0.08)}` }}
      />

      {/* Glassmorphism shine overlay */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-3">
        {/* Avatar with ring */}
        <div className="relative">
          <div
            className="absolute -inset-1.5 rounded-full transition-all duration-300 group-hover:scale-105"
            style={{
              background: isChampion
                ? `conic-gradient(from 0deg, ${hexToRgba('#e5be4a', 0.6)}, ${hexToRgba('#e5be4a', 0.1)}, ${hexToRgba('#d4a853', 0.5)}, ${hexToRgba('#e5be4a', 0.1)}, ${hexToRgba('#e5be4a', 0.6)})`
                : `conic-gradient(from 0deg, ${hexToRgba(cfg.accent, 0.4)}, ${hexToRgba(cfg.accent, 0.1)}, ${hexToRgba('#e5be4a', 0.3)}, ${hexToRgba(cfg.accent, 0.1)}, ${hexToRgba(cfg.accent, 0.4)})`,
              filter: `blur(3px)`,
            }}
          />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 transition-all duration-300 group-hover:border-opacity-60" style={{ borderColor: isChampion ? '#e5be4a' : cfg.accent }}>
            <Image
              src={getAvatarUrl(player.gamertag, division, player.avatar)}
              alt={player.gamertag}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          {/* Crown/Star badge overlay */}
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-lg"
            style={{
              background: isChampion
                ? `linear-gradient(135deg, #e5be4a, #d4a853)`
                : `linear-gradient(135deg, ${cfg.accent}, ${cfg.accentLight})`,
              boxShadow: isChampion
                ? `0 0 16px ${hexToRgba('#e5be4a', 0.4)}`
                : `0 0 12px ${hexToRgba(cfg.accent, 0.3)}`,
            }}
          >
            {isChampion ? (
              <Crown className="w-4 h-4 text-[#0c0a06]" />
            ) : (
              <Star className="w-4 h-4 text-[#0c0a06]" />
            )}
          </div>
        </div>

        {/* Gamertag */}
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {player.gamertag}
        </h3>

        {/* Tier badge + Division badge + Champion/Rank badge */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {isChampion && (
            <Badge
              className="text-[10px] font-bold uppercase tracking-wider border px-2.5 py-0.5"
              style={{
                backgroundColor: hexToRgba('#e5be4a', 0.25),
                color: '#e5be4a',
                borderColor: hexToRgba('#e5be4a', 0.40),
              }}
            >
              <Crown className="w-3 h-3 mr-1" />
              Juara S{seasonNumber}
            </Badge>
          )}
          <TierBadge tier={player.tier} />
          <Badge
            className="text-[10px] font-bold uppercase tracking-wider border px-2.5 py-0.5"
            style={{
              backgroundColor: hexToRgba(cfg.accent, 0.2),
              color: cfg.accentLight,
              borderColor: hexToRgba(cfg.accent, 0.35),
            }}
          >
            <DivisionIcon className="w-3 h-3 mr-1" />
            {cfg.label}
          </Badge>
        </div>

        {/* Stats 2x2 grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] px-2 py-2 transition-all duration-200 group-hover:bg-white/[0.04]">
            <StatItem icon={Zap} value={player.points} label="Points" valueColor={isChampion ? '#e5be4a' : cfg.accentLight} />
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] px-2 py-2 transition-all duration-200 group-hover:bg-white/[0.04]">
            <StatItem icon={Trophy} value={player.totalWins} label="Wins" valueColor="#4ade80" />
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] px-2 py-2 transition-all duration-200 group-hover:bg-white/[0.04]">
            <StatItem icon={Crown} value={player.totalMvp} label="MVP" valueColor="#e5be4a" />
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] px-2 py-2 transition-all duration-200 group-hover:bg-white/[0.04]">
            <StatItem icon={Flame} value={player.streak} label="Streak" valueColor="#fb923c" />
          </div>
        </div>

        {/* Club name */}
        {player.club && (
          <div className="flex items-center gap-1.5 mt-1">
            <Shield className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/70 font-medium">
              {clubToString(player.club)}
            </span>
          </div>
        )}

        {/* Lihat Profil button */}
        <button
          className="mt-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border"
          style={{
            backgroundColor: hexToRgba(isChampion ? '#e5be4a' : cfg.accent, 0.15),
            color: isChampion ? '#e5be4a' : cfg.accentLight,
            borderColor: hexToRgba(isChampion ? '#e5be4a' : cfg.accent, 0.3),
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPlayer({ ...player, division });
          }}
          aria-label={`Lihat profil ${player.gamertag}`}
        >
          Lihat Profil
        </button>
      </div>
    </div>
  );
}

/* ─── Division spotlight card — handles season selector + player logic ─── */
function DivisionSpotlightCard({
  division,
  data,
  setSelectedPlayer,
}: {
  division: 'male' | 'female';
  data: StatsData;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}) {
  const allSeasons = data.allSeasons || [];
  const isMale = division === 'male';
  const cfg = DIVISION_CONFIG[division];

  // Default to latest season
  const defaultSeasonId = allSeasons[0]?.id || '';
  const [selectedSeasonId, setSelectedSeasonId] = useState(defaultSeasonId);

  // Season pagination
  const [seasonPage, setSeasonPage] = useState(() => {
    const idx = allSeasons.findIndex(s => s.id === defaultSeasonId);
    return Math.floor(Math.max(0, idx) / SEASONS_PER_PAGE);
  });

  const selectedSeason = allSeasons.find(s => s.id === selectedSeasonId);
  const isSeasonCompleted = selectedSeason?.status === 'completed';
  const hasChampion = isSeasonCompleted && selectedSeason?.championPlayer;

  // Determine which player to show
  // - Completed season with champion → show champion
  // - Active season or no champion → show #1 ranked player
  const championPlayer = hasChampion ? selectedSeason!.championPlayer : null;
  const topPlayer = data.topPlayers?.[0] || null;

  // Convert SeasonChampionPlayer to TopPlayer-compatible format for the card
  const displayPlayer: (TopPlayer | SeasonChampionPlayer) | null = championPlayer || topPlayer;
  const isChampion = !!championPlayer;

  const handleSeasonChange = useCallback((seasonId: string) => {
    setSelectedSeasonId(seasonId);
    const sIdx = allSeasons.findIndex(s => s.id === seasonId);
    if (sIdx >= 0) setSeasonPage(Math.floor(sIdx / SEASONS_PER_PAGE));
  }, [allSeasons]);

  // No data at all
  if (!displayPlayer && !allSeasons.length) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden border p-8 flex flex-col items-center justify-center min-h-[400px]"
        style={{
          borderColor: hexToRgba(cfg.accent, 0.15),
          background: `linear-gradient(135deg, rgba(12,10,6,0.95), rgba(12,10,6,0.85))`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 30%, ${hexToRgba(cfg.accent, 0.06)}, transparent 60%)` }} />
        <div className="relative z-10">
          <AnimatedEmptyState
            icon={Star}
            message="Belum ada pemain spotlight"
            hint="Data peringkat akan muncul setelah musim dimulai"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Player Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSeasonId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {displayPlayer ? (
            <SpotlightCard
              player={displayPlayer}
              division={division}
              isChampion={isChampion}
              seasonNumber={selectedSeason?.number || 1}
              setSelectedPlayer={setSelectedPlayer}
            />
          ) : (
            <div
              className="relative rounded-2xl overflow-hidden border p-8 flex flex-col items-center justify-center min-h-[400px]"
              style={{
                borderColor: hexToRgba(cfg.accent, 0.15),
                background: `linear-gradient(135deg, rgba(12,10,6,0.95), rgba(12,10,6,0.85))`,
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 30%, ${hexToRgba(cfg.accent, 0.06)}, transparent 60%)` }} />
              <Crown className="relative z-10 w-12 h-12 mb-3 opacity-30" style={{ color: cfg.accent }} />
              <p className="relative z-10 text-sm font-bold text-white/70">
                {isSeasonCompleted ? 'Belum ada juara di season ini' : 'Belum ada pemain terdaftar'}
              </p>
              <p className="relative z-10 text-xs text-muted-foreground/60 mt-1">
                {isSeasonCompleted ? 'Admin belum menetapkan juara season' : 'Turnamen belum dimulai'}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Season Selector */}
      {allSeasons.length > 1 && (
        <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(12,10,6,0.80)', borderColor: hexToRgba(cfg.accent, 0.12) }}>
          <SpotlightSeasonSelector
            seasons={allSeasons}
            selectedSeasonId={selectedSeasonId}
            onSelect={handleSeasonChange}
            accent={isChampion ? '#e5be4a' : cfg.accent}
            accentLight={isChampion ? '#e5be4a' : cfg.accentLight}
            seasonPage={seasonPage}
            onSeasonPageChange={setSeasonPage}
          />

          {/* Status indicator */}
          <div className="flex items-center justify-between gap-2 px-0.5 mt-2">
            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
              {isChampion ? (
                <>
                  <Crown className="w-2.5 h-2.5 text-idm-gold-warm" />
                  Juara Season {selectedSeason?.number}
                </>
              ) : isSeasonCompleted ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Season Selesai
                </>
              ) : (
                <>
                  <Star className="w-2.5 h-2.5" />
                  Peringkat #1 Saat Ini
                </>
              )}
            </span>
            <span className="text-[9px] text-muted-foreground/60">
              S{selectedSeason?.number || 1} • {selectedSeason?.tournamentCount || 0} weeks
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PlayerSpotlight — Main Export
   ═══════════════════════════════════════════════════════════════ */
export function PlayerSpotlight({
  maleData,
  femaleData,
  isDataLoading,
  setSelectedPlayer,
}: PlayerSpotlightProps) {
  const hasMaleData = maleData?.hasData && (maleData.topPlayers?.length > 0 || maleData.allSeasons?.length > 0);
  const hasFemaleData = femaleData?.hasData && (femaleData.topPlayers?.length > 0 || femaleData.allSeasons?.length > 0);
  const hasAnyData = hasMaleData || hasFemaleData;

  return (
    <section
      id="spotlight"
      role="region"
      aria-label="Player Spotlight"
      className="stagger-item py-16 sm:py-24 px-4 relative overflow-hidden"
    >
      {/* Background — subtle dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-[#0a0806]/30 to-background" />

      {/* Bilateral ambient glows — cyan left, purple right */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, ${hexToRgba('#06b6d4', 0.06)} 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-1/3 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.06)} 0%, transparent 60%)` }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <SectionHeader
          icon={Star}
          label="Bintang Liga"
          title="Bintang Liga"
          subtitle="Pemain terbaik dari setiap divisi — Juara season atau peringkat #1 saat ini"
        />

        {/* Loading State */}
        {isDataLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SpotlightCardSkeleton accent="#06b6d4" />
            <SpotlightCardSkeleton accent="#a855f7" />
          </div>
        )}

        {/* Empty State */}
        {!isDataLoading && !hasAnyData && (
          <AnimatedEmptyState
            icon={Star}
            message="Belum ada pemain spotlight"
            hint="Data peringkat akan muncul setelah musim dimulai"
          />
        )}

        {/* Cards */}
        {!isDataLoading && hasAnyData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Vertical Gold Divider */}
            <div className="hidden md:block absolute top-12 bottom-12 left-1/2 w-px bg-gradient-to-b from-transparent via-idm-gold-warm/30 to-transparent z-10" />

            {/* Male Division Card */}
            <div className="stagger-item-fast" style={{ animationDelay: '0ms' }}>
              {hasMaleData ? (
                <DivisionSpotlightCard
                  division="male"
                  data={maleData!}
                  setSelectedPlayer={setSelectedPlayer}
                />
              ) : (
                <SpotlightCardSkeleton accent="#06b6d4" />
              )}
            </div>

            {/* Female Division Card */}
            <div className="stagger-item-fast" style={{ animationDelay: '60ms' }}>
              {hasFemaleData ? (
                <DivisionSpotlightCard
                  division="female"
                  data={femaleData!}
                  setSelectedPlayer={setSelectedPlayer}
                />
              ) : (
                <SpotlightCardSkeleton accent="#a855f7" />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
