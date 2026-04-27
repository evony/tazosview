'use client';

import Image from 'next/image';
import { Music, Shield, Crown, Flame, Award } from 'lucide-react';
import { TierBadge } from '../tier-badge';
import { SectionHeader } from './shared';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

interface MvpSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  cmsSections: Record<string, any>;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}

/* ─── Compact MVP Card — latest weekly MVP OR player with highest totalMvp/points ─── */
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
        className="reveal reveal-fade-up relative rounded-xl overflow-hidden bg-[#0d0d1a] border flex flex-col items-center justify-center p-8 min-h-[380px] transition-all duration-500 hover:border-[rgba(212,168,83,0.2)]"
        style={{ borderColor: hexToRgba(accent, 0.15) }}
      >
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 50%, ${hexToRgba(accent, 0.06)}, transparent 60%)` }} />
        <div className="relative z-10">
          <Crown className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: accent }} />
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
        className="reveal reveal-fade-up relative rounded-xl overflow-hidden cursor-pointer group border transition-all duration-300 min-h-[380px] aspect-[3/4] sm:aspect-auto sm:min-h-[440px]"
        style={{ borderColor: hexToRgba(accent, 0.15), boxShadow: `0 0 40px ${hexToRgba(accent, 0.06)}` }}
        role="button"
        tabIndex={0}
        aria-label={`View MVP profile: ${displayPlayer.gamertag}`}
        onClick={() => setSelectedPlayer({ ...displayPlayer, division })}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') setSelectedPlayer({ ...displayPlayer, division });
        }}
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent z-20" />

        {/* Full-bleed avatar */}
        <Image src={getAvatarUrl(displayPlayer.gamertag, division, displayPlayer.avatar)} alt={displayPlayer.gamertag} fill sizes="50vw" className="object-cover object-top group-hover:scale-105 transition-transform duration-700" />

        {/* Multi-layer overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d1a]/50 via-transparent to-transparent" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 80% 80%, ${hexToRgba(accent, 0.10)}, transparent 60%)` }} />

        {/* Hover glow */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: `0 0 50px ${hexToRgba(accent, 0.15)}, 0 0 25px ${hexToRgba(accent, 0.08)}` }} />

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

  // Weekly MVP display
  return (
    <div
      className="reveal reveal-fade-up relative rounded-xl overflow-hidden cursor-pointer group border transition-all duration-300 min-h-[380px] aspect-[3/4] sm:aspect-auto sm:min-h-[440px]"
      style={{ borderColor: hexToRgba(accent, 0.15), boxShadow: `0 0 40px ${hexToRgba(accent, 0.06)}` }}
      role="button"
      tabIndex={0}
      aria-label={`View MVP profile: ${latestMvp!.gamertag}`}
      onClick={() => {
        const found = data.topPlayers?.find(p => p.gamertag === latestMvp!.gamertag);
        if (found) setSelectedPlayer({ ...found, division });
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          const found = data.topPlayers?.find(p => p.gamertag === latestMvp!.gamertag);
          if (found) setSelectedPlayer({ ...found, division });
        }
      }}
    >
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent z-20" />

      {/* Full-bleed avatar */}
      <Image src={getAvatarUrl(latestMvp!.gamertag, division, latestMvp!.avatar)} alt={latestMvp!.gamertag} fill sizes="50vw" className="object-cover object-top group-hover:scale-105 transition-transform duration-700" />

      {/* Multi-layer overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d1a]/50 via-transparent to-transparent" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 80% 80%, ${hexToRgba(accent, 0.10)}, transparent 60%)` }} />

      {/* Hover glow */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: `0 0 50px ${hexToRgba(accent, 0.15)}, 0 0 25px ${hexToRgba(accent, 0.08)}` }} />

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

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-4 z-10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-bold text-[#d4a853]">W{latestMvp!.weekNumber}</span>
          {latestMvp!.totalMvp > 1 && <span className="text-[9px] font-bold text-[#d4a853] bg-[#d4a853]/15 px-1.5 py-0.5 rounded">{latestMvp!.totalMvp}x MVP</span>}
        </div>
        <p className="text-2xl sm:text-3xl font-black text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{latestMvp!.gamertag}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <TierBadge tier={latestMvp!.tier} />
        </div>
        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-[#d4a853]/10">
          <div>
            <p className="text-lg font-black" style={{ color: accentLight }}>{latestMvp!.points}</p>
            <p className="text-[8px] uppercase font-semibold" style={{ color: '#a09880' }}>Points</p>
          </div>
          <div className="w-px h-7 bg-[#d4a853]/10" />
          <div>
            <p className="text-lg font-black text-green-400">{latestMvp!.totalWins}</p>
            <p className="text-[8px] text-green-400/50 uppercase font-semibold">Wins</p>
          </div>
          {latestMvp!.streak > 0 && (
            <>
              <div className="w-px h-7 bg-[#d4a853]/10" />
              <div>
                <p className="text-lg font-black text-orange-400 flex items-center gap-1"><Flame className="w-4 h-4" />{latestMvp!.streak}</p>
                <p className="text-[8px] text-orange-400/50 uppercase font-semibold">Streak</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MVP Section ─── */
export function MvpSection({
  maleData,
  femaleData,
  isDataLoading,
  cmsSections,
  setSelectedPlayer,
}: MvpSectionProps) {
  const emptyData = { hasData: false, division: 'male' as const, season: { id: '', name: '', number: 1, status: 'active' }, allSeasons: [], activeTournament: null, totalPlayers: 0, totalPrizePool: 0, seasonDonationTotal: 0, topPlayers: [], skinMap: {}, recentMatches: [], upcomingMatches: [], seasonProgress: { totalWeeks: 0, completedWeeks: 0, percentage: 0 }, topDonors: [], clubs: [], weeklyChampions: [], mvpHallOfFame: [] } as StatsData;

  return (
    <section id="mvp" role="region" aria-label="MVP Arena" className="py-16 sm:py-24 px-4 relative overflow-hidden bg-[#0a0a14]">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(212,168,83,0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(6,182,212,0.04) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.04) 0%, transparent 40%)' }} />
      <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="stagger-item">
          <SectionHeader icon={Award} label={cmsSections.mvp?.subtitle || "Hall of Fame"} title={cmsSections.mvp?.title || "MVP Arena"} subtitle={cmsSections.mvp?.description || "Pemain terbaik dari setiap Tarkam"} />

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
        </div>
      </div>
    </section>
  );
}
