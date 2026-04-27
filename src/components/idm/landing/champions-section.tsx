'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Music, Users, Shield, Crown, Wallet, Flame, Play,
  ChevronLeft, ChevronRight, Calendar, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChampionCardSkeleton } from '../ui/skeleton';
import { TierBadge } from '../tier-badge';
import { SectionHeader } from './shared';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import type { StatsData, WeeklyChampion, SeasonInfo } from '@/types/stats';

interface ChampionsSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  isDataLoading: boolean;
  cmsSections: Record<string, any>;
  championVideoUrl?: string;
  onVideoPlay?: (url: string, title: string) => void;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}

const WEEKS_PER_PAGE = 5;
const SEASONS_PER_PAGE = 5;

/** Reorder players: S-tier center, A-tier left, B-tier right */
function reorderPlayersByTier(players: NonNullable<WeeklyChampion['winnerTeam']>['players']) {
  if (!players || players.length <= 1) return players || [];
  const tierOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
  const sorted = [...players].sort((a, b) => (tierOrder[a.tier] ?? 5) - (tierOrder[b.tier] ?? 5));
  if (sorted.length === 3) {
    return [sorted[1], sorted[0], sorted[2]]; // A left, S center, B right
  }
  return sorted;
}

/** Season Selector — paginated tabs for switching between seasons */
function SeasonSelector({
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
      {/* Prev page */}
      {totalSeasonPages > 1 && (
        <button
          onClick={() => onSeasonPageChange(Math.max(0, seasonPage - 1))}
          disabled={seasonPage === 0}
          className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:scale-110 cursor-pointer"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.10)' }}
          aria-label="Previous seasons"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
      )}

      {/* Season tabs */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {visibleSeasons.map((s) => {
          const isActive = s.id === selectedSeasonId;
          const isCompleted = s.status === 'completed';
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer ${
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
              <Calendar className="w-3 h-3" />
              <span>S{s.number}</span>
              {isCompleted && <CheckCircle2 className="w-3 h-3 opacity-60" />}
              <span className="text-[9px] font-normal opacity-60">({s.tournamentCount}w)</span>
            </button>
          );
        })}
      </div>

      {/* Next page */}
      {totalSeasonPages > 1 && (
        <button
          onClick={() => onSeasonPageChange(Math.min(totalSeasonPages - 1, seasonPage + 1))}
          disabled={seasonPage === totalSeasonPages - 1}
          className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:scale-110 cursor-pointer"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.10)' }}
          aria-label="Next seasons"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/** Division Champion Card — with independent season + week selector */
function DivisionChampionCard({
  division,
  data,
  DivisionIcon,
  setSelectedPlayer,
}: {
  division: 'male' | 'female';
  data: StatsData;
  DivisionIcon: typeof Music;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}) {
  const allChampions = data.weeklyChampions;
  const allSeasons = data.allSeasons || [];

  // Group champions by season
  const championsBySeason = useMemo(() => {
    const map = new Map<string, WeeklyChampion[]>();
    for (const c of allChampions) {
      if (!map.has(c.seasonId)) map.set(c.seasonId, []);
      map.get(c.seasonId)!.push(c);
    }
    // Sort each season's champions by week number
    for (const [, champs] of map) {
      champs.sort((a, b) => a.weekNumber - b.weekNumber);
    }
    return map;
  }, [allChampions]);

  // Default to latest season (allSeasons is sorted desc by number)
  const defaultSeasonId = allSeasons[0]?.id || (allChampions.length > 0 ? allChampions[allChampions.length - 1].seasonId : '');
  const [selectedSeasonId, setSelectedSeasonId] = useState(defaultSeasonId);
  const champions = championsBySeason.get(selectedSeasonId) || [];

  const [selectedWeekIdx, setSelectedWeekIdx] = useState(() => {
    const champs = championsBySeason.get(defaultSeasonId) || [];
    return Math.max(0, champs.length - 1);
  });
  const [weekPage, setWeekPage] = useState(() => {
    const champs = championsBySeason.get(defaultSeasonId) || [];
    return Math.floor(Math.max(0, champs.length - 1) / WEEKS_PER_PAGE);
  });

  // Season pagination — default to page containing the selected season
  const [seasonPage, setSeasonPage] = useState(() => {
    const idx = allSeasons.findIndex(s => s.id === defaultSeasonId);
    return Math.floor(Math.max(0, idx) / SEASONS_PER_PAGE);
  });

  const isMale = division === 'male';
  const accent = isMale ? '#06b6d4' : '#a855f7';
  const accentLight = isMale ? '#22d3ee' : '#c084fc';
  const accentFaint = isMale ? '#67e8f9' : '#e9d5ff';

  const totalPages = Math.ceil(champions.length / WEEKS_PER_PAGE);
  const pageStart = weekPage * WEEKS_PER_PAGE;
  const pageEnd = Math.min(pageStart + WEEKS_PER_PAGE, champions.length);
  const visibleWeeks = champions.slice(pageStart, pageEnd);

  const selected = champions[selectedWeekIdx];
  const orderedPlayers = selected?.winnerTeam?.players ? reorderPlayersByTier(selected.winnerTeam.players) : [];

  const selectedSeasonInfo = allSeasons.find(s => s.id === selectedSeasonId);

  const handleSeasonChange = useCallback((seasonId: string) => {
    setSelectedSeasonId(seasonId);
    const newChampions = championsBySeason.get(seasonId) || [];
    const newIdx = Math.max(0, newChampions.length - 1);
    setSelectedWeekIdx(newIdx);
    setWeekPage(Math.floor(newIdx / WEEKS_PER_PAGE));
    // Auto-navigate season page to include selected season
    const sIdx = allSeasons.findIndex(s => s.id === seasonId);
    if (sIdx >= 0) setSeasonPage(Math.floor(sIdx / SEASONS_PER_PAGE));
  }, [championsBySeason, allSeasons]);

  const handleWeekSelect = useCallback((idx: number) => {
    setSelectedWeekIdx(idx);
  }, []);

  // Empty state — no champions at all
  if (!allChampions.length) {
    return (
      <Card className="champion-rotating-border overflow-hidden border card-shine champion-gold-frame" style={{ borderColor: hexToRgba(accent, 0x20) }}>
        <div className="h-1 bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: accent }} />
        <CardContent className="p-0">
          <div className="relative h-16 sm:h-20 overflow-hidden">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0x08)} 0%, ${hexToRgba(accent, 0x04)} 50%, transparent 100%)` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/40 to-transparent" />
            <div className="absolute top-3 left-3 w-8 h-8 border-t border-l" style={{ borderColor: hexToRgba(accent, 0x20) }} aria-hidden="true" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t border-r" style={{ borderColor: hexToRgba(accent, 0x20) }} aria-hidden="true" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="empty-state-icon animate-float-medium">
                <Crown className="w-14 h-14" style={{ color: hexToRgba(accent, 0x25), filter: `drop-shadow(0 0 24px ${hexToRgba(accent, 0x20)})` }} />
              </div>
            </div>
            <div className="absolute bottom-4 inset-x-0 px-5 flex items-end justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: hexToRgba(accent, 0x15) }}>
                  <DivisionIcon className="w-4 h-4" style={{ color: accentLight }} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider" style={{ color: accentLight }}>{division} Division</h3>
                  <p className="text-[10px] font-semibold text-white/80">SEASON CHAMPION</p>
                </div>
              </div>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-idm-gold-warm/25 to-transparent" />
          <div className="p-6 text-center space-y-4">
            <div>
              <p className="text-sm font-bold text-white/80">Musim Baru Dimulai</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Season baru segera dimulai — jadilah champion pertama!</p>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-24 h-16 rounded-xl border border-dashed flex items-center justify-center card-shine" style={{ borderColor: hexToRgba(accent, 0x20), background: `linear-gradient(135deg, ${hexToRgba(accent, 0x06)} 0%, transparent 50%, ${hexToRgba(accent, 0x04)} 100%)` }}>
                  <span className="text-[10px] font-bold" style={{ color: hexToRgba(accent, 0x35) }}>#{i}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="champion-rotating-border perspective-card overflow-hidden border card-shine champion-gold-frame card-border-glow group transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,168,83,0.2)]" style={{ borderColor: hexToRgba(accent, 0x20) }}>
      {/* Gold accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: accent }} />
      <CardContent className="p-0">
        {/* Banner Header */}
        <div className="relative h-16 sm:h-20 overflow-hidden">
          <img
            src="/bg-section.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-15 transition-transform duration-500 group-hover:scale-110"
            aria-hidden="true"
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0x30)} 0%, ${hexToRgba(accent, 0x15)} 50%, transparent 100%)` }} />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 40%, ${hexToRgba(accent, 0x35)}, transparent 60%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/40 to-transparent" />

          {/* Division + Week Badges */}
          <div className="absolute bottom-4 inset-x-0 px-5 flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: hexToRgba(accent, 0x25) }}>
                <DivisionIcon className="w-4 h-4" style={{ color: accentLight }} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider" style={{ color: accentLight }}>{division} Division</h3>
                <p className="text-[10px] font-semibold text-white/80">
                  SEASON {selectedSeasonInfo?.number || '?'} CHAMPION
                  {selectedSeasonInfo?.status === 'completed' && <span className="ml-1 text-idm-gold-warm">• Completed</span>}
                </p>
              </div>
            </div>
            {selected && (
              <Badge style={{ backgroundColor: hexToRgba(accent, 0x25), color: accentLight, borderColor: hexToRgba(accent, 0x40) }} className="text-[10px] border px-2.5 py-0.5">
                <Crown className="w-3 h-3 mr-1" />Week {selected.weekNumber}
              </Badge>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedSeasonId}-${selectedWeekIdx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="p-5 space-y-4"
          >
          {/* Season Selector */}
          <SeasonSelector
            seasons={allSeasons}
            selectedSeasonId={selectedSeasonId}
            onSelect={handleSeasonChange}
            accent={accent}
            accentLight={accentLight}
            seasonPage={seasonPage}
            onSeasonPageChange={setSeasonPage}
          />

          {/* No champions for this season */}
          {!selected && champions.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground rounded-xl border border-dashed" style={{ borderColor: hexToRgba(accent, 0x15) }}>
              <Crown className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: accent }} />
              <p>Belum ada champion di season ini</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tournament belum difinalisasi</p>
            </div>
          )}

          {/* Team Info */}
          {selected && (
          <>
          <div className="relative flex items-center justify-between flex-wrap gap-2">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-32 h-16 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(212,168,83,0.08) 0%, transparent 70%)' }} aria-hidden="true" />
            <div className="relative flex items-center gap-2.5">
              <Trophy className="w-5 h-5" style={{ color: accentLight }} />
              <span className="text-xl sm:text-2xl font-black text-white">{selected.winnerTeam?.name || 'TBD'}</span>
            </div>
            {selected.prizePool > 0 && (
              <span className="text-[11px] font-bold text-idm-gold-warm bg-gradient-to-r from-idm-gold-warm/15 to-idm-gold-warm/5 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-idm-gold-warm/20"><Wallet className="w-3.5 h-3.5" />{selected.prizePool.toLocaleString()}</span>
            )}
          </div>

          {/* Gold divider line */}
          <div className="h-px bg-gradient-to-r from-transparent via-idm-gold-warm/30 to-transparent" />

          {/* 3 Player Avatars — reordered by tier */}
          {selected.winnerTeam && orderedPlayers.length > 0 ? (
            <div className="relative flex rounded-2xl overflow-hidden border -mx-5" style={{ height: '260px', borderColor: hexToRgba(accent, 0.15) }}>
              {/* CHAMPION gold watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
                <span className="text-4xl font-black uppercase tracking-widest select-none" style={{ color: 'rgba(212,168,83,0.04)', WebkitTextStroke: '1px rgba(212,168,83,0.06)' }}>CHAMPION</span>
              </div>
              {/* Diamond badge */}
              <div className="absolute top-3 right-3 z-20 champion-diamond-badge" aria-label="Champion badge">
                <Crown className="w-3.5 h-3.5 text-[#0c0a06]" />
              </div>

              {orderedPlayers.slice(0, 3).map((player, pIdx) => {
                const tierOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
                const isCenter = pIdx === 1 && orderedPlayers.length >= 3 && (tierOrder[orderedPlayers[1].tier] ?? 5) === 0;
                return (
                  <div
                    key={player.id}
                    role="button"
                    tabIndex={0}
                    className={`relative flex-1 cursor-pointer group/avatar overflow-hidden ${isCenter ? 'z-10' : ''}`}
                    onClick={() => {
                      const found = data.topPlayers?.find(tp => tp.id === player.id);
                      if (found) setSelectedPlayer({ ...found, division });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        const found = data.topPlayers?.find(tp => tp.id === player.id);
                        if (found) setSelectedPlayer({ ...found, division });
                      }
                    }}
                  >
                    <Image src={getAvatarUrl(player.gamertag, division as 'male' | 'female', player.avatar)} alt={player.gamertag} fill sizes="33vw" className="object-cover object-top transition-transform duration-500 group-hover/avatar:scale-110" />
                    {/* Bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/5 to-transparent" />
                    {/* Top gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a06]/5 via-transparent to-transparent" />
                    {/* Divider lines between players */}
                    {pIdx < 2 && <div className="absolute right-0 top-0 bottom-0 w-px z-20" style={{ backgroundColor: hexToRgba(accent, 0.20) }} />}

                    {/* Player info at bottom */}
                    <div className="absolute bottom-0 inset-x-0 px-2.5 pb-2.5 pt-6 z-10" style={{ background: 'linear-gradient(to top, rgba(12,10,6,0.85) 0%, transparent 100%)' }}>
                      <p className="text-xs sm:text-sm font-black text-white truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{player.gamertag}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TierBadge tier={player.tier} />
                        {isCenter && <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ color: accentLight, backgroundColor: hexToRgba(accent, 0.25) }}>CPT</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold" style={{ color: accentFaint }}>{player.points}pts</span>
                        <span className="text-[10px] font-bold text-green-400">{player.totalWins}W</span>
                        <span className="text-[10px] font-bold text-orange-400 flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />{player.streak}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground rounded-xl border border-dashed" style={{ borderColor: hexToRgba(accent, 0x15) }}>Belum ada data week ini</div>
          )}
          </>
          )}

          {/* ─── Week Selector ─── */}
          {champions.length > 0 && (
          <div className="space-y-2">
            {/* Phase labels */}
            {champions.length > 3 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: hexToRgba(accent, 0.50) }}>
                  {weekPage === 0 ? 'Early Phase' : weekPage === totalPages - 1 ? 'Late Phase' : 'Mid Phase'}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground">
                  W{selected?.weekNumber || selectedWeekIdx + 1} / {selectedSeasonInfo?.tournamentCount || champions.length} weeks
                </span>
              </div>
            )}

            {/* Week pills row */}
            <div className="flex items-center gap-1.5">
              {/* Prev page button */}
              {totalPages > 1 && (
                <button
                  onClick={() => {
                    const newPage = Math.max(0, weekPage - 1);
                    setWeekPage(newPage);
                    const newIdx = Math.min(selectedWeekIdx, (newPage + 1) * WEEKS_PER_PAGE - 1);
                    setSelectedWeekIdx(newIdx);
                  }}
                  disabled={weekPage === 0}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.10)' }}
                  aria-label="Previous weeks"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Week Pills */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-1">
                {visibleWeeks.map((wk, i) => {
                  const globalIdx = pageStart + i;
                  const isActive = globalIdx === selectedWeekIdx;
                  return (
                    <button
                      key={`${selectedSeasonId}-W${wk.weekNumber}`}
                      onClick={() => handleWeekSelect(globalIdx)}
                      className={`shrink-0 h-8 px-3 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={isActive ? {
                        backgroundColor: hexToRgba(accent, 0.35),
                        color: accentLight,
                        border: `1px solid ${hexToRgba(accent, 0.60)}`,
                        boxShadow: `0 0 14px ${hexToRgba(accent, 0.30)}, inset 0 1px 0 ${hexToRgba(accent, 0.20)}`,
                      } : {
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.70)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                      aria-label={`Week ${wk.weekNumber}`}
                      aria-pressed={isActive}
                    >
                      W{wk.weekNumber}
                    </button>
                  );
                })}
              </div>

              {/* Next page button */}
              {totalPages > 1 && (
                <button
                  onClick={() => {
                    const newPage = Math.min(totalPages - 1, weekPage + 1);
                    setWeekPage(newPage);
                    const newIdx = Math.max(selectedWeekIdx, newPage * WEEKS_PER_PAGE);
                    setSelectedWeekIdx(newIdx);
                  }}
                  disabled={weekPage === totalPages - 1}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.10)' }}
                  aria-label="Next weeks"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selected week info bar */}
            {selected && (
            <div className="flex items-center justify-between gap-2 mt-1 px-1">
              <div className="flex items-center gap-2">
                {selected.completedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(selected.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {selected.tournamentName && (
                  <span className="text-[10px] text-muted-foreground/60 truncate max-w-[140px]">
                    {selected.tournamentName}
                  </span>
                )}
              </div>

            </div>
            )}
          </div>
          )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export function ChampionsSection({
  maleData,
  femaleData,
  leagueData,
  isDataLoading,
  cmsSections,
  championVideoUrl,
  onVideoPlay,
  setSelectedPlayer,
}: ChampionsSectionProps) {
  return (
    <>
      {/* ========== SEASON CHAMPION — Smooth Reveal ========== */}
      <section id="champions" role="region" aria-label="Season Champions" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Crown animation at top center */}
        <div className="champions-crown-float absolute top-8 left-1/2 -translate-x-1/2 z-20" aria-hidden="true">
          <Crown className="w-6 h-6 text-idm-gold-warm/40" style={{ filter: 'drop-shadow(0 0 12px rgba(212,168,83,0.3))' }} />
        </div>
        {/* Background — Premium Championship */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a06] via-[#0f0b05]/98 to-[#0c0a06]" />
        {/* Diamond lattice pattern — championship prestige */}
        <div className="absolute inset-0 opacity-[0.014]" style={{ backgroundImage: 'linear-gradient(135deg, rgba(212,168,83,0.2) 25%, transparent 25%), linear-gradient(225deg, rgba(212,168,83,0.2) 25%, transparent 25%), linear-gradient(315deg, rgba(212,168,83,0.2) 25%, transparent 25%), linear-gradient(45deg, rgba(212,168,83,0.2) 25%, transparent 25%)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px' }} />
        {/* Gold spotlight from top center — champion spotlight */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 15%, rgba(212,168,83,0.10) 0%, transparent 45%)' }} />
        {/* Bilateral division color glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(6,182,212,0.06) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(168,85,247,0.06) 0%, transparent 45%)' }} />
        {/* Top & bottom gold edge glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-idm-gold-warm/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-idm-gold-warm/15 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="stagger-item">
            <SectionHeader icon={Crown} label={cmsSections.champions?.subtitle || "Aula Champion"} title={cmsSections.champions?.title || "Season Champion"} subtitle={cmsSections.champions?.description || "Juara terbaru dari setiap divisi — 1 tim, 3 pemain, 1 gelar"} />
          </div>

          {/* Liga IDM Champion — Premium Showcase */}
          {leagueData?.ligaChampion && (
            <div
              className="animate-fade-enter mb-8 perspective-container"
              style={{ animationDelay: '100ms' }}
            >
              <div className="perspective-card relative rounded-2xl overflow-hidden border border-idm-gold-warm/30" style={{ background: 'linear-gradient(135deg, #0c0a06 0%, #1a1208 25%, #0d0a06 50%, #1a0f05 75%, #0c0a06 100%)' }}>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(var(--idm-gold-warm) 1px, transparent 1px), linear-gradient(90deg, var(--idm-gold-warm) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,83,0.12) 0%, transparent 50%)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 60%, rgba(212,168,83,0.05) 0%, transparent 40%), radial-gradient(ellipse at 80% 60%, rgba(212,168,83,0.05) 0%, transparent 40%)' }} />

                <div className="h-1 bg-gradient-to-r from-transparent via-idm-gold-warm to-transparent" />

                <div className="relative z-10 p-6 sm:p-8">
                  {championVideoUrl && onVideoPlay && (
                    <button
                      onClick={() => onVideoPlay(championVideoUrl, 'Champion Showcase')}
                      className="absolute bottom-4 right-4 z-20 w-9 h-9 rounded-full bg-idm-gold-warm/20 border border-idm-gold-warm/30 flex items-center justify-center hover:bg-idm-gold-warm/35 hover:border-idm-gold-warm/50 transition-all cursor-pointer"
                      aria-label="Play champion video"
                    >
                      <Play className="w-3.5 h-3.5 text-idm-gold-warm fill-idm-gold-warm" />
                    </button>
                  )}
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-idm-gold-warm/15 border border-idm-gold-warm/25 flex items-center justify-center" style={{ boxShadow: '0 0 40px rgba(212,168,83,0.15)' }}>
                        <Trophy className="w-6 h-6 text-idm-gold-warm" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm text-[10px] border border-idm-gold-warm/25 font-bold uppercase tracking-wider">Liga IDM</Badge>
                          <Badge className="bg-yellow-500/15 text-yellow-400 text-[10px] border border-yellow-500/25 font-bold">SEASON {leagueData.ligaChampion.seasonNumber} CHAMPION</Badge>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black mt-1" style={{ background: 'linear-gradient(135deg, var(--idm-gold-warm), #f5d78e, var(--idm-gold-warm))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          Liga IDM Season {leagueData.ligaChampion.seasonNumber}
                        </h3>
                      </div>
                    </div>
                    <div className="animate-float-medium hidden sm:block">
                      <Crown className="w-10 h-10 text-idm-gold-warm/40" style={{ filter: 'drop-shadow(0 0 20px rgba(212,168,83,0.3))' }} />
                    </div>
                  </div>

                  {/* Champion Club Display */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex flex-col items-center text-center sm:text-left sm:flex-row gap-4 flex-1">
                      <div className="relative champion-trophy-pedestal">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-idm-gold-warm/30 bg-idm-gold-warm/5" style={{ boxShadow: '0 0 50px rgba(212,168,83,0.2)' }}>
                          <ClubLogoImage clubName={leagueData.ligaChampion.name} dbLogo={leagueData.ligaChampion.logo} alt={leagueData.ligaChampion.name} width={112} height={112} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -top-2 -right-2 champion-diamond-badge" aria-label="Champion badge">
                          <Crown className="w-4 h-4 text-[#0c0a06]" />
                        </div>
                      </div>
                      <div>
                        <h4 className="champion-name-shine text-2xl sm:text-3xl font-black text-white tracking-wide">{leagueData.ligaChampion.name}</h4>
                        <p className="text-sm text-idm-gold-warm/80 font-semibold mt-1">Liga IDM Season {leagueData.ligaChampion.seasonNumber} Champion</p>
                        <p className="text-xs text-muted-foreground mt-1">Club terbaik di Liga IDM Season {leagueData.ligaChampion.seasonNumber}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge className="bg-cyan-500/10 text-cyan-400 text-[10px] border-cyan-500/20 px-2.5 py-1">
                            <Users className="w-3 h-3 mr-1" />
                            {leagueData.ligaChampion.members.filter((m: { division: string }) => m.division === 'male').length} Male
                          </Badge>
                          <Badge className="bg-purple-500/10 text-purple-400 text-[10px] border-purple-500/20 px-2.5 py-1">
                            <Users className="w-3 h-3 mr-1" />
                            {leagueData.ligaChampion.members.filter((m: { division: string }) => m.division === 'female').length} Female
                          </Badge>
                          <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] border-idm-gold-warm/20 px-2.5 py-1">
                            <Users className="w-3 h-3 mr-1" />
                            {leagueData.ligaChampion.members.length} Total
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Members Preview */}
                    <div className="flex-1 w-full sm:w-auto">
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-3 text-center sm:text-left">Skuad Champion</p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        {leagueData.ligaChampion.members.slice(0, 5).map((member: { id: string; gamertag: string; division: string; role: string; avatar?: string | null }, i: number) => (
                          <div key={member.id} className="group/member relative flex flex-col items-center">
                            <div className={`champion-member-card w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-110 cursor-default ${
                              member.division === 'male'
                                ? 'border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-[0_0_16px_rgba(34,211,238,0.15)]'
                                : 'border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_16px_rgba(192,132,252,0.15)]'
                            } ${member.role === 'captain' ? 'ring-2 ring-idm-gold-warm/50 border-idm-gold-warm/30' : ''}`}>
                              <Image
                                src={getAvatarUrl(member.gamertag, member.division as 'male' | 'female', member.avatar)}
                                alt={member.gamertag}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                              {member.role === 'captain' && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-idm-gold-warm flex items-center justify-center z-10">
                                  <Crown className="w-2.5 h-2.5 text-[#0c0a06]" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold mt-1 truncate max-w-[64px] text-center text-white/80">{member.gamertag}</p>
                            <p className="text-[10px] font-medium capitalize" style={{ color: member.division === 'male' ? '#22d3ee' : '#c084fc' }}>{member.division}</p>
                          </div>
                        ))}
                        {leagueData.ligaChampion.members.length > 5 && (
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-sm font-bold border-2 border-dashed border-white/10 bg-white/5 text-muted-foreground">
                              +{leagueData.ligaChampion.members.length - 5}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">lainnya</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom decorative line */}
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-idm-gold-warm/20 to-transparent" />
                    <div className="flex items-center gap-1.5 text-idm-gold-warm/40">
                      <Trophy className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Liga IDM Champion</span>
                      <Trophy className="w-3 h-3" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-idm-gold-warm/20 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Both Divisions Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            {/* Vertical Gold Divider */}
            <div className="hidden lg:block absolute top-12 bottom-12 left-1/2 w-px bg-gradient-to-b from-transparent via-idm-gold-warm/30 to-transparent z-10" />

            {isDataLoading ? (
              <>
                <ChampionCardSkeleton accent="#06b6d4" division="male" />
                <ChampionCardSkeleton accent="#a855f7" division="female" />
              </>
            ) : ([['male', maleData, Music], ['female', femaleData, Shield]] as const).map(([division, data, DivisionIcon], divIdx) => {
              if (!data || !data.weeklyChampions?.length) {
                // Render empty state with the card still visible
                return (
                  <div key={division} className="stagger-item-fast perspective-container" style={{ animationDelay: `${divIdx * 100}ms` }}>
                    <DivisionChampionCard
                      division={division as 'male' | 'female'}
                      data={{ ...data!, weeklyChampions: [], allSeasons: [] } as StatsData}
                      DivisionIcon={DivisionIcon as typeof Music}
                      setSelectedPlayer={setSelectedPlayer}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={division}
                  className="stagger-item-fast perspective-container"
                  style={{ animationDelay: `${divIdx * 100}ms` }}
                >
                  {/* Sparkle decorations around champion cards */}
                  <div className="champion-sparkle champion-sparkle-1" aria-hidden="true" />
                  <div className="champion-sparkle champion-sparkle-2" aria-hidden="true" />
                  <div className="champion-sparkle champion-sparkle-3" aria-hidden="true" />
                  <div className="champion-sparkle champion-sparkle-4" aria-hidden="true" />
                  <DivisionChampionCard
                    division={division as 'male' | 'female'}
                    data={data}
                    DivisionIcon={DivisionIcon as typeof Music}
                    setSelectedPlayer={setSelectedPlayer}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
