'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Trophy, Music, Shield, Crown, Flame, Wallet, Award } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { TierBadge } from '../tier-badge';
import { SectionHeader } from './shared';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

interface HallOfFameSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  cmsSections: Record<string, any>;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}

type TabKey = 'champion' | 'mvp';

/* ─── Tab Config ─── */
const TABS: { key: TabKey; label: string; icon: typeof Crown }[] = [
  { key: 'champion', label: 'Champion', icon: Crown },
  { key: 'mvp', label: 'MVP', icon: Award },
];

/* ══════════════════════════════════════════════════════════════
   Compact Champion Card — latest champion OR top 3 players by points
   (Copied from champions-section.tsx)
   ══════════════════════════════════════════════════════════════ */
function CompactChampionCard({
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
  const isMale = division === 'male';
  const accent = isMale ? '#06b6d4' : '#a855f7';
  const accentLight = isMale ? '#22d3ee' : '#c084fc';
  const accentFaint = isMale ? '#67e8f9' : '#e9d5ff';
  const divisionLabel = isMale ? 'Male' : 'Female';

  // Try weekly champions first (all seasons)
  const champions = data.weeklyChampions || [];
  const latest = champions.length > 0 ? champions[champions.length - 1] : null;
  const hasWeeklyChampion = !!latest?.winnerTeam;

  // Fallback: top 3 players by points
  const topPlayers = [...(data.topPlayers || [])]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  // Empty state — no champions AND no players
  if (!hasWeeklyChampion && topPlayers.length === 0) {
    return (
      <div
        className="champion-card reveal reveal-fade-up rounded-xl overflow-hidden bg-[#0d0d1a] border transition-colors duration-500 hover:border-[rgba(212,168,83,0.2)]"
        style={{ borderColor: hexToRgba(accent, 0.15) }}
      >
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent" />
        <div className="relative h-14 overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.08)} 0%, transparent 60%)` }} />
          <div className="absolute bottom-2.5 left-4 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(accent, 0.12) }}>
              <DivisionIcon className="w-3.5 h-3.5" style={{ color: accentLight }} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: accentLight }}>{divisionLabel} Tarkam</span>
          </div>
        </div>
        <div className="p-6 text-center space-y-3">
          {/* Crown with subtle CSS float animation */}
          <div className="champion-crown-float inline-block">
            <Crown className="w-10 h-10 opacity-20" style={{ color: accent }} />
          </div>
          <p className="text-sm font-bold text-[#f5f0e8]/70">Musim Baru Dimulai</p>
          <p className="text-xs" style={{ color: '#a09880' }}>Jadilah champion pertama!</p>
        </div>
      </div>
    );
  }

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
          {hasWeeklyChampion ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: accentLight, backgroundColor: hexToRgba(accent, 0.18), borderColor: hexToRgba(accent, 0.35) }}>
              <Crown className="w-2.5 h-2.5 inline mr-1" />W{latest?.weekNumber ?? '?'}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: '#d4a853', backgroundColor: 'rgba(212,168,83,0.12)', borderColor: 'rgba(212,168,83,0.25)' }}>
              <Trophy className="w-2.5 h-2.5 inline mr-1" />Top Players
            </span>
          )}
        </div>
      </div>

      {/* Team name + prize (only for weekly champion) — using optional chaining */}
      {hasWeeklyChampion && (
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-4 h-4 shrink-0" style={{ color: accentLight }} />
            <span className="text-base sm:text-lg font-black text-[#f5f0e8] truncate">{latest?.winnerTeam?.name ?? 'TBD'}</span>
          </div>
          {(latest?.prizePool ?? 0) > 0 && (
            <span className="text-[10px] font-bold text-[#d4a853] bg-gradient-to-r from-[rgba(212,168,83,0.12)] to-[rgba(212,168,83,0.04)] px-2 py-1 rounded-lg flex items-center gap-1 border border-[rgba(212,168,83,0.18)] shrink-0">
              <Wallet className="w-3 h-3" />{(latest?.prizePool ?? 0).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Section label for top players fallback */}
      {!hasWeeklyChampion && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-[#a09880]">Pemain dengan poin tertinggi saat ini</p>
        </div>
      )}

      {/* Gold divider */}
      <div className="h-px mx-4 bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.20)] to-transparent" />

      {/* Player Avatars — from weekly champion OR top 3 players — using optional chaining */}
      {(() => {
        const players = hasWeeklyChampion
          ? (latest?.winnerTeam?.players || [])
          : topPlayers.map(p => ({ id: p.id, gamertag: p.gamertag, tier: p.tier, points: p.points, totalWins: p.totalWins, streak: p.streak, avatar: p.avatar }));

        if (players.length === 0) {
          return <div className="m-4 p-5 text-center text-xs rounded-xl border border-dashed" style={{ borderColor: hexToRgba(accent, 0.12), color: '#a09880' }}>Belum ada data</div>;
        }

        return (
          <div className="relative flex rounded-xl overflow-hidden border m-4" style={{ height: '260px', borderColor: hexToRgba(accent, 0.12) }}>
            {/* CHAMPION watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
              <span className="text-2xl font-black uppercase tracking-widest select-none" style={{ color: 'rgba(212,168,83,0.03)', WebkitTextStroke: '1px rgba(212,168,83,0.05)' }}>CHAMPION</span>
            </div>
            {/* Crown badge with CSS float animation */}
            <div className="champion-crown-float absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-[#d4a853] flex items-center justify-center">
              <Crown className="w-2.5 h-2.5 text-[#0d0d1a]" />
            </div>

            {players.slice(0, 3).map((player, pIdx) => (
              <div
                key={player.id}
                role="button"
                tabIndex={0}
                className="relative flex-1 cursor-pointer group/avatar overflow-hidden"
                onClick={() => {
                  const found = data.topPlayers?.find(tp => tp.id === player.id);
                  if (found) setSelectedPlayer({ ...found, division });
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    const found = data.topPlayers?.find(tp => tp.id === player.id);
                    if (found) setSelectedPlayer({ ...found, division });
                  }
                }}
              >
                <Image src={getAvatarUrl(player.gamertag, division, player.avatar)} alt={player.gamertag} fill sizes="33vw" className="object-cover object-top transition-transform duration-500 group-hover/avatar:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/5 to-transparent" />
                {pIdx < Math.min(players.length, 3) - 1 && <div className="absolute right-0 top-0 bottom-0 w-px z-20" style={{ backgroundColor: hexToRgba(accent, 0.15) }} />}
                <div className="absolute bottom-0 inset-x-0 px-2 pb-2 pt-5 z-10" style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.90) 0%, transparent 100%)' }}>
                  <p className="text-[11px] sm:text-xs font-black text-[#f5f0e8] truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{player.gamertag}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TierBadge tier={player.tier} />
                    <span className="text-[9px] font-bold" style={{ color: accentFaint }}>{player.points}pts</span>
                    <span className="text-[9px] font-bold text-green-400">{player.totalWins}W</span>
                    {player.streak > 0 && <span className="text-[9px] font-bold text-orange-400 flex items-center gap-0.5"><Flame className="w-2 h-2" />{player.streak}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Compact MVP Card — latest weekly MVP OR player with highest totalMvp/points
   (Copied from mvp-section.tsx)
   ══════════════════════════════════════════════════════════════ */
function CompactMVPCard({
  division,
  data,
  setSelectedPlayer,
}: {
  division: 'male' | 'female';
  data: StatsData;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}) {
  const isMale = division === 'male';
  const accent = isMale ? '#06b6d4' : '#a855f7';
  const accentLight = isMale ? '#22d3ee' : '#c084fc';
  const DivisionIcon = isMale ? Music : Shield;
  const divisionLabel = isMale ? 'Male' : 'Female';

  // Try weekly MVP first
  const mvps = data.mvpHallOfFame || [];
  const latestMvp = mvps.length > 0 ? mvps[mvps.length - 1] : null;

  // Fallback: player with highest totalMvp (then highest points)
  const topMvpPlayer = [...(data.topPlayers || [])]
    .sort((a, b) => b.totalMvp - a.totalMvp || b.points - a.points)[0] || null;

  const hasWeeklyMvp = !!latestMvp;
  const displayPlayer = hasWeeklyMvp ? null : topMvpPlayer; // Used for fallback only

  // Empty state — no MVPs AND no players
  if (!hasWeeklyMvp && !displayPlayer) {
    return (
      <div
        className="mvp-card reveal reveal-fade-up relative rounded-xl overflow-hidden bg-[#0d0d1a] border flex flex-col items-center justify-center p-8 min-h-[380px] transition-colors duration-500 hover:border-[rgba(212,168,83,0.2)]"
        style={{ borderColor: hexToRgba(accent, 0.15) }}
      >
        {/* Spotlight glow effect behind empty state */}
        <div className="mvp-spotlight-bg absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 50%, ${hexToRgba(accent, 0.06)}, transparent 60%)` }} />
        <div className="relative z-10">
          <div className="champion-crown-float inline-block">
            <Crown className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: accent }} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#d4a853]/40" />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a09880' }}>MVP Belum Dipilih</p>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#d4a853]/40" />
          </div>
          <p className="text-[11px] text-center" style={{ color: '#a09880' }}>MVP ditetapkan saat finalisasi tournament</p>
        </div>
      </div>
    );
  }

  // Fallback: show topMvpPlayer as MVP spotlight
  if (!hasWeeklyMvp && displayPlayer) {
    return (
      <div
        className="mvp-card reveal reveal-fade-up relative rounded-xl overflow-hidden cursor-pointer group border transition-all duration-300 min-h-[380px] aspect-[3/4] sm:aspect-auto sm:min-h-[440px]"
        style={{ borderColor: hexToRgba(accent, 0.15) }}
        role="button"
        tabIndex={0}
        aria-label={`View MVP profile: ${displayPlayer.gamertag}`}
        onClick={() => setSelectedPlayer({ ...displayPlayer, division })}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') setSelectedPlayer({ ...displayPlayer, division });
        }}
      >
        {/* Spotlight glow behind card */}
        <div className="mvp-spotlight-bg absolute inset-0 pointer-events-none" aria-hidden="true" />

        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent z-20" />

        {/* Full-bleed avatar */}
        <Image src={getAvatarUrl(displayPlayer.gamertag, division, displayPlayer.avatar)} alt={displayPlayer.gamertag} fill sizes="50vw" className="object-cover object-top group-hover:scale-105 transition-transform duration-700" loading="lazy" />

        {/* Multi-layer overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d1a]/50 via-transparent to-transparent" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 80% 80%, ${hexToRgba(accent, 0.10)}, transparent 60%)` }} />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border" style={{ backgroundColor: hexToRgba(accent, 0.25), borderColor: hexToRgba(accent, 0.30) }}>
            <DivisionIcon className="w-3.5 h-3.5" style={{ color: accentLight }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentLight }}>{divisionLabel}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d4a853]/40" style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.30), rgba(212,168,83,0.12))' }}>
            <Award className="w-4 h-4 text-[#d4a853]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#d4a853]">MVP</span>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 inset-x-0 p-4 z-10">
          <div className="flex items-center gap-1.5 mb-1.5">
            {displayPlayer.totalMvp > 0 && <span className="text-[9px] font-bold text-[#d4a853] bg-[#d4a853]/15 px-1.5 py-0.5 rounded">{displayPlayer.totalMvp}x MVP</span>}
            <span className="text-[10px] text-[#a09880]/60">• Top Performer</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{displayPlayer.gamertag}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <TierBadge tier={displayPlayer.tier} />
          </div>
          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-[#d4a853]/10">
            <div>
              <p className="text-lg font-black" style={{ color: accentLight }}>{displayPlayer.points}</p>
              <p className="text-[8px] uppercase font-semibold" style={{ color: '#a09880' }}>Points</p>
            </div>
            <div className="w-px h-7 bg-[#d4a853]/10" />
            <div>
              <p className="text-lg font-black text-green-400">{displayPlayer.totalWins}</p>
              <p className="text-[8px] text-green-400/50 uppercase font-semibold">Wins</p>
            </div>
            {displayPlayer.streak > 0 && (
              <>
                <div className="w-px h-7 bg-[#d4a853]/10" />
                <div>
                  <p className="text-lg font-black text-orange-400 flex items-center gap-1"><Flame className="w-4 h-4" />{displayPlayer.streak}</p>
                  <p className="text-[8px] text-orange-400/50 uppercase font-semibold">Streak</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Weekly MVP display — using optional chaining instead of non-null assertions
  return (
    <div
      className="mvp-card reveal reveal-fade-up relative rounded-xl overflow-hidden cursor-pointer group border transition-all duration-300 min-h-[380px] aspect-[3/4] sm:aspect-auto sm:min-h-[440px]"
      style={{ borderColor: hexToRgba(accent, 0.15) }}
      role="button"
      tabIndex={0}
      aria-label={`View MVP profile: ${latestMvp?.gamertag ?? 'MVP'}`}
      onClick={() => {
        const found = data.topPlayers?.find(p => p.gamertag === latestMvp?.gamertag);
        if (found) setSelectedPlayer({ ...found, division });
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          const found = data.topPlayers?.find(p => p.gamertag === latestMvp?.gamertag);
          if (found) setSelectedPlayer({ ...found, division });
        }
      }}
    >
      {/* Spotlight glow behind card */}
      <div className="mvp-spotlight-bg absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent z-20" />

      {/* Full-bleed avatar */}
      <Image src={getAvatarUrl(latestMvp?.gamertag ?? '', division, latestMvp?.avatar)} alt={latestMvp?.gamertag ?? 'MVP'} fill sizes="50vw" className="object-cover object-top group-hover:scale-105 transition-transform duration-700" loading="lazy" />

      {/* Multi-layer overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d1a]/50 via-transparent to-transparent" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 80% 80%, ${hexToRgba(accent, 0.10)}, transparent 60%)` }} />

      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border" style={{ backgroundColor: hexToRgba(accent, 0.25), borderColor: hexToRgba(accent, 0.30) }}>
          <DivisionIcon className="w-3.5 h-3.5" style={{ color: accentLight }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentLight }}>{divisionLabel}</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d4a853]/40" style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.30), rgba(212,168,83,0.12))' }}>
          <Crown className="w-4 h-4 text-[#d4a853]" />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#d4a853]">MVP</span>
        </div>
      </div>

      {/* Bottom info — using optional chaining */}
      <div className="absolute bottom-0 inset-x-0 p-4 z-10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-bold text-[#d4a853]">W{latestMvp?.weekNumber ?? '?'}</span>
          {(latestMvp?.totalMvp ?? 0) > 1 && <span className="text-[9px] font-bold text-[#d4a853] bg-[#d4a853]/15 px-1.5 py-0.5 rounded">{latestMvp?.totalMvp}x MVP</span>}
        </div>
        <p className="text-2xl sm:text-3xl font-black text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{latestMvp?.gamertag ?? 'TBD'}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <TierBadge tier={latestMvp?.tier ?? 'B'} />
        </div>
        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-[#d4a853]/10">
          <div>
            <p className="text-lg font-black" style={{ color: accentLight }}>{latestMvp?.points ?? 0}</p>
            <p className="text-[8px] uppercase font-semibold" style={{ color: '#a09880' }}>Points</p>
          </div>
          <div className="w-px h-7 bg-[#d4a853]/10" />
          <div>
            <p className="text-lg font-black text-green-400">{latestMvp?.totalWins ?? 0}</p>
            <p className="text-[8px] text-green-400/50 uppercase font-semibold">Wins</p>
          </div>
          {(latestMvp?.streak ?? 0) > 0 && (
            <>
              <div className="w-px h-7 bg-[#d4a853]/10" />
              <div>
                <p className="text-lg font-black text-orange-400 flex items-center gap-1"><Flame className="w-4 h-4" />{latestMvp?.streak}</p>
                <p className="text-[8px] text-orange-400/50 uppercase font-semibold">Streak</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Hall of Fame Section — merged Champions + MVP with tab interface
   ══════════════════════════════════════════════════════════════ */
export function HallOfFameSection({
  maleData,
  femaleData,
  isDataLoading,
  cmsSections,
  setSelectedPlayer,
}: HallOfFameSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('champion');

  const emptyData = { hasData: false, division: 'male' as const, season: { id: '', name: '', number: 1, status: 'active' }, allSeasons: [], activeTournament: null, totalPlayers: 0, totalPrizePool: 0, seasonDonationTotal: 0, topPlayers: [], skinMap: {}, recentMatches: [], upcomingMatches: [], seasonProgress: { totalWeeks: 0, completedWeeks: 0, percentage: 0 }, topDonors: [], clubs: [], weeklyChampions: [], mvpHallOfFame: [] } as StatsData;

  return (
    <section id="hall-of-fame" role="region" aria-label="Hall of Fame" className="landing-section relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background — same as champions section */}
      <div className="absolute inset-0 bg-[#0a0a14]" />
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(212,168,83,0.08) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(6,182,212,0.04) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(168,85,247,0.04) 0%, transparent 45%)' }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="reveal reveal-fade-up">
          <SectionHeader
            icon={Crown}
            label="Hall of Fame"
            title="Hall of Fame"
            subtitle="Juara season dan pemain terbaik Tarkam IDM"
          />
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-idm-gold-warm/20 bg-[#0d0d1a]/80 backdrop-blur-sm">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  aria-pressed={isActive}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-idm-gold-warm/15 text-idm-gold-warm shadow-[0_0_20px_rgba(212,168,83,0.1)]'
                      : 'text-[#a09880] hover:text-[#f5f0e8]/70 hover:bg-white/[0.03]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="hof-tab-indicator"
                      className="absolute inset-0 rounded-lg border border-idm-gold-warm/30 bg-idm-gold-warm/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content with AnimatePresence */}
        <AnimatePresence mode="wait">
          {activeTab === 'champion' && (
            <motion.div
              key="champion"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <div className="hidden md:block absolute top-12 bottom-12 left-1/2 w-px bg-gradient-to-b from-transparent via-[rgba(212,168,83,0.20)] to-transparent z-10" />

                {isDataLoading ? (
                  <>
                    <div className="rounded-xl bg-[#0d0d1a] border border-white/5 h-72 animate-pulse" />
                    <div className="rounded-xl bg-[#0d0d1a] border border-white/5 h-72 animate-pulse" />
                  </>
                ) : (
                  <>
                    <CompactChampionCard division="male" data={maleData || emptyData} DivisionIcon={Music} setSelectedPlayer={setSelectedPlayer} />
                    <CompactChampionCard division="female" data={femaleData || { ...emptyData, division: 'female' } as StatsData} DivisionIcon={Shield} setSelectedPlayer={setSelectedPlayer} />
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'mvp' && (
            <motion.div
              key="mvp"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative max-w-5xl mx-auto">
                <div className="hidden md:block absolute top-12 bottom-12 left-1/2 w-px bg-gradient-to-b from-transparent via-[#d4a853]/25 to-transparent z-10" />

                {isDataLoading ? (
                  <>
                    <div className="rounded-xl bg-[#0d0d1a] border border-white/5 h-[440px] animate-pulse" />
                    <div className="rounded-xl bg-[#0d0d1a] border border-white/5 h-[440px] animate-pulse" />
                  </>
                ) : (
                  <>
                    <CompactMVPCard division="male" data={maleData || emptyData} setSelectedPlayer={setSelectedPlayer} />
                    <CompactMVPCard division="female" data={femaleData || { ...emptyData, division: 'female' } as StatsData} setSelectedPlayer={setSelectedPlayer} />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
