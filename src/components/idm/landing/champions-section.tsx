'use client';

import Image from 'next/image';
import { Trophy, Music, Shield, Crown, Flame, Wallet } from 'lucide-react';
import { TierBadge } from '../tier-badge';
import { SectionHeader } from './shared';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

interface ChampionsSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  cmsSections: Record<string, any>;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}

/* ─── Compact Champion Card — latest champion OR top 3 players by points ─── */
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

/* ─── Champions Section ─── */
export function ChampionsSection({
  maleData,
  femaleData,
  isDataLoading,
  cmsSections,
  setSelectedPlayer,
}: ChampionsSectionProps) {
  const emptyData = { hasData: false, division: 'male' as const, season: { id: '', name: '', number: 1, status: 'active' }, allSeasons: [], activeTournament: null, totalPlayers: 0, totalPrizePool: 0, seasonDonationTotal: 0, topPlayers: [], skinMap: {}, recentMatches: [], upcomingMatches: [], seasonProgress: { totalWeeks: 0, completedWeeks: 0, percentage: 0 }, topDonors: [], clubs: [], weeklyChampions: [], mvpHallOfFame: [] } as StatsData;

  return (
    <section id="champions" role="region" aria-label="Season Champions" className="landing-section relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a14]" />
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(212,168,83,0.08) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(6,182,212,0.04) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(168,85,247,0.04) 0%, transparent 45%)' }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="reveal reveal-fade-up">
          <SectionHeader icon={Crown} label={cmsSections.champions?.subtitle || "Aula Champion"} title={cmsSections.champions?.title || "Season Champion"} subtitle={cmsSections.champions?.description || "Juara terbaru dari setiap tarkam"} />
        </div>

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
      </div>
    </section>
  );
}
