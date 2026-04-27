'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import {
  Trophy, Crown, Medal, ChevronRight, TrendingUp,
  Swords, Shield, Users, Flame, Zap, Target
} from 'lucide-react';
import { SectionHeader } from './shared';
import { AnimatedEmptyState } from '../ui/animated-empty-state';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import { TierBadge } from '@/components/idm/tier-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { getAvatarUrl, clubToString } from '@/lib/utils';

/* ========== Types ========== */
interface LeaderboardClub {
  id: string;
  name: string;
  logo: string | null;
  points: number;
  wins: number;
  losses: number;
  gameDiff: number;
  memberCount: number;
  maleMemberCount: number;
  femaleMemberCount: number;
  rank: number;
}

interface LeaderboardPlayer {
  rank: number;
  id: string;
  name: string;
  gamertag: string;
  tier: string;
  avatar: string | null;
  points: number;
  totalWins: number;
  totalMvp: number;
  streak: number;
  maxStreak: number;
  matches: number;
  club: string | { id: string; name: string; logo?: string | null } | null;
  division?: string;
}

type LeaderboardTab = 'club-tarkam' | 'club-liga' | 'player-male' | 'player-female';

interface ClubLeaderboardProps {
  onClubClick?: (club: LeaderboardClub) => void;
  onPlayerClick?: (player: LeaderboardPlayer) => void;
}

/* ========== Tab Configuration ========== */
const TAB_CONFIG: Record<LeaderboardTab, { icon: typeof Swords; label: string; desc: string }> = {
  'club-tarkam': {
    icon: Swords,
    label: 'Klub Tarkam',
    desc: 'Total poin anggota club (Male + Female)',
  },
  'club-liga': {
    icon: Shield,
    label: 'Klub Liga',
    desc: 'Poin dari hasil pertandingan Liga',
  },
  'player-male': {
    icon: Users,
    label: 'Pemain Male',
    desc: 'Peringkat pemain divisi male',
  },
  'player-female': {
    icon: Users,
    label: 'Pemain Female',
    desc: 'Peringkat pemain divisi female',
  },
};

/* ========== Rank Badge — Gold / Silver / Bronze ========== */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 text-[#1a1608] shadow-[0_0_16px_rgba(250,204,21,0.4)] leaderboard-rank-glow-gold relative">
        <Crown className="w-4 h-4" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-[#1a1608] shadow-[0_0_10px_rgba(156,163,175,0.3)]">
        <Medal className="w-4 h-4" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-[#1a1608] shadow-[0_0_10px_rgba(180,83,9,0.3)]">
        <Medal className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] text-muted-foreground font-bold text-sm">
      {rank}
    </div>
  );
}

/* ========== Strength Bar ========== */
function StrengthBar({ points, maxPoints }: { points: number; maxPoints: number }) {
  const pct = maxPoints > 0 ? Math.max((points / maxPoints) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full leaderboard-bar-fill bg-gradient-to-r from-idm-gold-warm to-idm-gold transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

/* ========== Win Rate Mini Bar ========== */
function WinRateMini({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
          style={{ width: `${winRate}%` }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground tabular-nums">
        {total > 0 ? `${Math.round(winRate)}%` : '-'}
      </span>
    </div>
  );
}

/* ========== Club Row ========== */
function ClubRow({ club, index, maxPoints, type, onClick }: {
  club: LeaderboardClub; index: number; maxPoints: number; type: 'tarkam' | 'liga';
  onClick: () => void;
}) {
  const isTop3 = club.rank <= 3;
  const rowStyles: Record<number, string> = {
    1: 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/[0.08] to-transparent shadow-[0_0_20px_rgba(250,204,21,0.1)] hover:shadow-[0_0_28px_rgba(250,204,21,0.15)]',
    2: 'border-gray-400/20 bg-gradient-to-r from-gray-400/[0.05] to-transparent hover:shadow-[0_0_16px_rgba(156,163,175,0.08)]',
    3: 'border-amber-700/20 bg-gradient-to-r from-amber-700/[0.05] to-transparent hover:shadow-[0_0_16px_rgba(180,83,9,0.08)]',
  };
  const rowClass = isTop3
    ? rowStyles[club.rank]
    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]';
  const isEven = index % 2 === 0;
  const memberLabel = club.maleMemberCount > 0 && club.femaleMemberCount > 0
    ? `${club.maleMemberCount}M + ${club.femaleMemberCount}F`
    : club.memberCount > 0
      ? `${club.memberCount} anggota`
      : 'Belum ada anggota';

  return (
    <div
      className={`leaderboard-row-wrapper leaderboard-row-enhanced grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-[1.01] cursor-pointer ${isEven ? 'leaderboard-row-even' : 'leaderboard-row-odd'} ${rowClass}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Lihat profil ${club.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <RankBadge rank={club.rank} />
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-white/[0.06] flex items-center justify-center border border-white/[0.04]">
          <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt={club.name} width={36} height={36} className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold truncate ${isTop3 ? 'text-white' : 'text-white/80'}`}>
              {club.name}
            </p>
            {club.rank === 1 && <Crown className="w-3.5 h-3.5 text-idm-gold-warm shrink-0 leaderboard-crown-icon" />}
            {club.rank !== 1 && club.rank <= 3 && <TrendingUp className="w-3 h-3 text-idm-gold-warm shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-muted-foreground">{memberLabel}</p>
            {type === 'liga' && (
              <>
                <span className="hidden sm:inline text-[10px] text-muted-foreground/50">·</span>
                <div className="hidden sm:flex items-center gap-1">
                  <span className="text-[10px] font-bold text-green-400">{club.wins}W</span>
                  <span className="text-[10px] text-muted-foreground/50">-</span>
                  <span className="text-[10px] font-bold text-red-400">{club.losses}L</span>
                </div>
              </>
            )}
          </div>
          <div className="leaderboard-hover-stats mt-1">
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground/70">
              {type === 'liga' && (
                <>
                  <span>Win Rate: {club.wins + club.losses > 0 ? Math.round((club.wins / (club.wins + club.losses)) * 100) : 0}%</span>
                  <span>GD: {club.gameDiff > 0 ? '+' : ''}{club.gameDiff}</span>
                </>
              )}
              <span>PTS/Member: {club.memberCount > 0 ? (club.points / club.memberCount).toFixed(1) : '0'}</span>
            </div>
          </div>
        </div>
      </div>
      <span className="text-sm font-black text-idm-gold-warm tabular-nums">{club.points}</span>
      {type === 'liga' && (
        <>
          <div className="hidden sm:block">
            <span className={`text-xs font-bold tabular-nums ${club.gameDiff > 0 ? 'text-green-400' : club.gameDiff < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {club.gameDiff > 0 ? '+' : ''}{club.gameDiff}
            </span>
          </div>
          <div className="hidden sm:block">
            <WinRateMini wins={club.wins} losses={club.losses} />
          </div>
        </>
      )}
      <div className="hidden sm:block">
        <StrengthBar points={club.points} maxPoints={maxPoints} />
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 hidden sm:block" />
    </div>
  );
}

/* ========== Player Row ========== */
function PlayerRow({ player, index, maxPoints, onClick }: {
  player: LeaderboardPlayer; index: number; maxPoints: number;
  onClick: () => void;
}) {
  const isTop3 = player.rank <= 3;
  const isMale = player.division === 'male';
  const accentColor = isMale ? 'idm-male' : 'idm-female';
  const avatarSrc = getAvatarUrl(player.gamertag, isMale ? 'male' : 'female', player.avatar);
  const losses = player.matches - player.totalWins;
  const winRate = player.matches > 0 ? Math.round((player.totalWins / player.matches) * 100) : 0;

  const rowStyles: Record<number, string> = {
    1: `border-${accentColor}/30 bg-gradient-to-r from-${accentColor}/[0.08] to-transparent shadow-[0_0_20px_rgba(${isMale ? '34,211,238' : '192,132,252'},0.1)]`,
    2: 'border-gray-400/20 bg-gradient-to-r from-gray-400/[0.05] to-transparent',
    3: 'border-amber-700/20 bg-gradient-to-r from-amber-700/[0.05] to-transparent',
  };
  const rowClass = isTop3
    ? rowStyles[player.rank]
    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]';

  return (
    <div
      className={`leaderboard-row-wrapper leaderboard-row-enhanced grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-[1.01] cursor-pointer ${rowClass}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Lihat profil ${player.gamertag}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <RankBadge rank={player.rank} />
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-white/[0.06] border border-white/[0.04]">
          <Image src={avatarSrc} alt={player.gamertag} width={36} height={36} className="w-full h-full object-cover object-top" unoptimized />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold truncate ${isTop3 ? 'text-white' : 'text-white/80'}`}>
              {player.gamertag}
            </p>
            <TierBadge tier={player.tier} />
            {player.rank <= 3 && <TrendingUp className={`w-3 h-3 text-${accentColor} shrink-0`} />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {clubToString(player.club) && (
              <p className="text-[10px] text-muted-foreground truncate">{clubToString(player.club)}</p>
            )}
            <span className="text-[10px] text-muted-foreground/50">
              {player.totalWins}W/{losses}L
            </span>
            {player.streak > 1 && (
              <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                <Flame className="w-3 h-3" />{player.streak}
              </span>
            )}
          </div>
          <div className="leaderboard-hover-stats mt-1">
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground/70">
              <span>Win Rate: {winRate}%</span>
              {player.totalMvp > 0 && <span>MVP: {player.totalMvp}x</span>}
              <span>Match: {player.matches}</span>
            </div>
          </div>
        </div>
      </div>
      <span className={`text-sm font-black tabular-nums ${isMale ? 'text-idm-male' : 'text-idm-female'}`}>{player.points}</span>
      <div className="hidden sm:block">
        <StrengthBar points={player.points} maxPoints={maxPoints} />
      </div>
      <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5"><Target className="w-3 h-3" />{winRate}%</span>
        {player.totalMvp > 0 && <span className="flex items-center gap-0.5 text-yellow-500"><Zap className="w-3 h-3" />{player.totalMvp}</span>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 hidden sm:block" />
    </div>
  );
}

/* ========== Loading Skeleton ========== */
function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <Skeleton className="w-9 h-9 rounded-full bg-white/[0.06]" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-full bg-white/[0.06]" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24 bg-white/[0.06]" />
              <Skeleton className="h-2.5 w-14 bg-white/[0.06]" />
            </div>
          </div>
          <Skeleton className="h-5 w-10 bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

/* ========== Main Component ========== */
export function ClubLeaderboard({ onClubClick, onPlayerClick }: ClubLeaderboardProps) {
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('club-tarkam');

  const isClubTab = activeTab === 'club-tarkam' || activeTab === 'club-liga';
  const clubType = activeTab === 'club-liga' ? 'liga' : 'tarkam';
  const playerDivision = activeTab === 'player-female' ? 'female' : 'male';

  /* ---- Club Leaderboard Query ---- */
  const { data: clubData, isLoading: isClubLoading } = useQuery<{ clubs: LeaderboardClub[]; type: string }>({
    queryKey: ['clubs-leaderboard', clubType],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/leaderboard?type=${clubType}`);
      if (!res.ok) return { clubs: [], type: clubType };
      return res.json();
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    enabled: isClubTab,
  });

  /* ---- Player Leaderboard Query ---- */
  const { data: playerData, isLoading: isPlayerLoading } = useQuery<LeaderboardPlayer[]>({
    queryKey: ['players-leaderboard', playerDivision],
    queryFn: async () => {
      const res = await fetch(`/api/players/leaderboard?division=${playerDivision}&limit=50`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    enabled: !isClubTab,
  });

  const isLoading = isClubTab ? isClubLoading : isPlayerLoading;

  const allClubs = clubData?.clubs ?? [];
  const displayClubs = showAll ? allClubs : allClubs.slice(0, 8);
  const hasMoreClubs = allClubs.length > 8;
  const maxClubPoints = allClubs.length > 0 ? allClubs[0].points || 1 : 1;

  const allPlayers = (playerData ?? []) as LeaderboardPlayer[];
  const displayPlayers = showAll ? allPlayers : allPlayers.slice(0, 10);
  const hasMorePlayers = allPlayers.length > 10;
  const maxPlayerPoints = allPlayers.length > 0 ? allPlayers[0].points || 1 : 1;

  /* ---- Click Handlers ---- */
  const handleClubClick = (club: LeaderboardClub) => {
    onClubClick?.(club);
  };

  const handlePlayerClick = (player: LeaderboardPlayer) => {
    onPlayerClick?.({ ...player, division: playerDivision });
  };

  return (
    <section id="leaderboard" className="relative py-24 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-background" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,83,0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 60%, rgba(229,190,74,0.03) 0%, transparent 40%), radial-gradient(ellipse at 80% 60%, rgba(212,168,83,0.03) 0%, transparent 40%)' }} />

      <div className="relative z-10 max-w-5xl mx-auto">
        <SectionHeader
          icon={Trophy}
          label="Peringkat"
          title="Klasemen & Peringkat"
          subtitle="Peringkat klub dan pemain berdasarkan performa"
        />

        {/* 4-Tab Switcher */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 flex-wrap">
          {(Object.entries(TAB_CONFIG) as [LeaderboardTab, typeof TAB_CONFIG['club-tarkam']][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setShowAll(false); }}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/30 shadow-[0_0_16px_rgba(212,168,83,0.15)]'
                    : 'bg-white/[0.04] text-muted-foreground border border-white/[0.08] hover:bg-white/[0.08] hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{cfg.label}</span>
                <span className="xs:hidden">{cfg.label.replace('Klub ', '').replace('Pemain ', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Tab description */}
        <p className="text-center text-[11px] text-muted-foreground/60 mb-6">
          {TAB_CONFIG[activeTab].desc}
        </p>

        {/* ===== CLUB LEADERBOARD ===== */}
        {isClubTab && (
          <>
            {/* Column Headers — desktop only */}
            {clubType === 'liga' ? (
              <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 px-4 pb-2 mb-1">
                <span className="w-9 text-center text-[10px] text-muted-foreground uppercase tracking-wider font-bold">#</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Club</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">PTS</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">GD</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Win Rate</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Kekuatan</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold w-4" />
              </div>
            ) : (
              <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 pb-2 mb-1">
                <span className="w-9 text-center text-[10px] text-muted-foreground uppercase tracking-wider font-bold">#</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Club</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">PTS</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Kekuatan</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold w-4" />
              </div>
            )}

            {isLoading ? (
              <LeaderboardSkeleton />
            ) : allClubs.length === 0 ? (
              <AnimatedEmptyState
                icon={Trophy}
                message={clubType === 'tarkam' ? 'Belum ada data klasemen tarkam' : 'Belum ada data klasemen liga'}
                hint={clubType === 'tarkam' ? 'Club akan muncul setelah anggotanya bermain di tarkam' : 'Club akan muncul setelah pertandingan liga dimulai'}
              />
            ) : (
              <>
                {/* Mobile: horizontal scrollable */}
                <div className="sm:hidden overflow-x-auto -mx-4 px-4 custom-scrollbar">
                  <div className="min-w-[340px] space-y-2">
                    {displayClubs.map((club, idx) => (
                      <ClubRow key={club.id} club={club} index={idx} maxPoints={maxClubPoints} type={clubType} onClick={() => handleClubClick(club)} />
                    ))}
                  </div>
                </div>
                {/* Desktop */}
                <div className="hidden sm:block space-y-2">
                  {displayClubs.map((club, idx) => (
                    <ClubRow key={club.id} club={club} index={idx} maxPoints={maxClubPoints} type={clubType} onClick={() => handleClubClick(club)} />
                  ))}
                </div>

                {hasMoreClubs && !showAll && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setShowAll(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/5 text-idm-gold-warm text-sm font-semibold transition-all duration-300 hover:bg-idm-gold-warm/10 hover:border-idm-gold-warm/30 hover:shadow-[0_0_20px_rgba(212,168,83,0.15)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      Lihat Semua Club
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-[10px] text-muted-foreground">({allClubs.length} club)</span>
                    </button>
                  </div>
                )}
                {showAll && hasMoreClubs && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAll(false)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-muted-foreground text-sm font-medium transition-all duration-200 hover:text-foreground hover:bg-white/[0.06] cursor-pointer"
                    >
                      Tampilkan Lebih Sedikit
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ===== PLAYER LEADERBOARD ===== */}
        {!isClubTab && (
          <>
            {/* Column Headers — desktop only */}
            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 pb-2 mb-1">
              <span className="w-9 text-center text-[10px] text-muted-foreground uppercase tracking-wider font-bold">#</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Player</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">PTS</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Kekuatan</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Stats</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold w-4" />
            </div>

            {isLoading ? (
              <LeaderboardSkeleton />
            ) : allPlayers.length === 0 ? (
              <AnimatedEmptyState
                icon={Users}
                message={playerDivision === 'male' ? 'Belum ada pemain divisi male' : 'Belum ada pemain divisi female'}
                hint="Pemain akan muncul setelah terdaftar dan bermain"
              />
            ) : (
              <>
                {/* Mobile */}
                <div className="sm:hidden overflow-x-auto -mx-4 px-4 custom-scrollbar">
                  <div className="min-w-[340px] space-y-2">
                    {displayPlayers.map((player, idx) => (
                      <PlayerRow key={player.id} player={player} index={idx} maxPoints={maxPlayerPoints} onClick={() => handlePlayerClick(player)} />
                    ))}
                  </div>
                </div>
                {/* Desktop */}
                <div className="hidden sm:block space-y-2">
                  {displayPlayers.map((player, idx) => (
                    <PlayerRow key={player.id} player={player} index={idx} maxPoints={maxPlayerPoints} onClick={() => handlePlayerClick(player)} />
                  ))}
                </div>

                {hasMorePlayers && !showAll && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setShowAll(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/5 text-idm-gold-warm text-sm font-semibold transition-all duration-300 hover:bg-idm-gold-warm/10 hover:border-idm-gold-warm/30 hover:shadow-[0_0_20px_rgba(212,168,83,0.15)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      Lihat Semua Pemain
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-[10px] text-muted-foreground">({allPlayers.length} pemain)</span>
                    </button>
                  </div>
                )}
                {showAll && hasMorePlayers && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAll(false)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-muted-foreground text-sm font-medium transition-all duration-200 hover:text-foreground hover:bg-white/[0.06] cursor-pointer"
                    >
                      Tampilkan Lebih Sedikit
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
