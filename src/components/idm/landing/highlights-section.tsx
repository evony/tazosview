'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Trophy, Crown, Calendar, Play, Eye, Swords,
  Star, ChevronRight, ChevronLeft, Zap, Users, Flame, TrendingUp, BarChart3,
  Medal, Gem, Award,
} from 'lucide-react';
import { SectionHeader, AnimatedSection } from './shared';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import type { StatsData, TopPlayer, SeasonInfo } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — HIGHLIGHTS SECTION (PUNCAK PRESTASI)
   Interactive thumbnail selector with featured card transitions
   Asymmetric 5-column grid with 3D perspective hover

   Includes "Puncak Prestasi" items (purely Tarkam — no Liga concept):
   - #1 Tarkam Male / Female (current ranking leaders)
   - #1 Club Tarkam (combined member tarkam points)
   - Streak Male / Female (longest win streak)
   - MVP Terbaru Male / Female (latest weekly MVP per division)

   NOTE: Season Champions are shown in a dedicated SeasonChampionSection.
   ═══════════════════════════════════════════════════════════════ */

interface HighlightsSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onVideoPlay?: (url: string, title: string) => void;
  setSelectedPlayer: (player: any) => void;
}

/* ─── Highlight Item Type ─── */
interface HighlightItem {
  id: string;
  type: 'rank1-male' | 'rank1-female' | 'rank1-club' | 'streak-male' | 'streak-female' | 'mvp-male' | 'mvp-female';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  /** Short 2-3 word label for thumbnail */
  thumbLabel: string;
  imageUrl?: string;
  accentColor: string;
  accentLight: string;
  division?: 'male' | 'female';
  metadata: { icon: typeof Calendar; label: string; value: string }[];
  player?: TopPlayer & { division?: string };
  clubName?: string;
  clubLogo?: string | null;
  /** Season number for season-related types */
  seasonNumber?: number;
  /** Whether this is an empty/placeholder item */
  isEmpty?: boolean;
  /** MVP week number for MVP types */
  mvpWeek?: number;
  /** Total MVP count for MVP types */
  mvpCount?: number;
}

/* ─── 3D Tilt Card Hook ─── */
function use3DTilt(intensity = 12) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;
      cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  return { cardRef, handleMouseMove, handleMouseLeave };
}

/* ─── Build Highlight Items from Data ─── */
function buildHighlights(
  maleData: StatsData | undefined,
  femaleData: StatsData | undefined,
  leagueData: any
): HighlightItem[] {
  const items: HighlightItem[] = [];

  /* ═══════════════════════════════════════════════════════════
     PRIORITY ORDER (by importance):
     1. #1 Tarkam Male — current #1 ranked male player
     2. #1 Tarkam Female — current #1 ranked female player
     3. #1 Club Tarkam — top club by combined member tarkam points
     4. Streak Male — male player with longest win streak
     5. Streak Female — female player with longest win streak
     6. MVP Terbaru Male — latest weekly MVP in male division
     7. MVP Terbaru Female — latest weekly MVP in female division
     ═══════════════════════════════════════════════════════════ */

  // ─── 1. #1 Tarkam Male — current #1 ranked male player ───
  const topMalePlayer = maleData?.topPlayers?.[0];
  if (topMalePlayer) {
    items.push({
      id: 'rank1-male',
      type: 'rank1-male',
      title: topMalePlayer.gamertag,
      subtitle: '#1 Tarkam Male',
      description: `Pemimpin klasemen tarkam divisi male dengan ${topMalePlayer.points} poin dan ${topMalePlayer.totalWins} kemenangan. ${topMalePlayer.gamertag} menunjukkan konsistensi luar biasa di setiap pertandingan Tarkam${topMalePlayer.streak >= 2 ? ` dengan streak ${topMalePlayer.streak} kemenangan berturut-turut` : ''}.`,
      badge: '#1 TARKAM MALE',
      thumbLabel: '#1 Male',
      imageUrl: getAvatarUrl(topMalePlayer.gamertag, 'male', topMalePlayer.avatar),
      accentColor: '#06b6d4',
      accentLight: '#22d3ee',
      division: 'male',
      metadata: [
        { icon: Medal, label: 'Tier', value: topMalePlayer.tier || '—' },
        { icon: Trophy, label: 'Points', value: `${topMalePlayer.points}` },
        { icon: Eye, label: 'Wins', value: `${topMalePlayer.totalWins}` },
        { icon: Flame, label: 'Streak', value: `${topMalePlayer.streak}W` },
      ],
      player: { ...topMalePlayer, division: 'male' },
    });
  }

  // ─── 2. #1 Tarkam Female — current #1 ranked female player ───
  const topFemalePlayer = femaleData?.topPlayers?.[0];
  if (topFemalePlayer) {
    items.push({
      id: 'rank1-female',
      type: 'rank1-female',
      title: topFemalePlayer.gamertag,
      subtitle: '#1 Tarkam Female',
      description: `Pemimpin klasemen tarkam divisi female dengan ${topFemalePlayer.points} poin dan ${topFemalePlayer.totalWins} kemenangan. ${topFemalePlayer.gamertag} menunjukkan grace dan skill yang memukau di setiap pertandingan Tarkam${topFemalePlayer.streak >= 2 ? ` dengan streak ${topFemalePlayer.streak} kemenangan berturut-turut` : ''}.`,
      badge: '#1 TARKAM FEMALE',
      thumbLabel: '#1 Female',
      imageUrl: getAvatarUrl(topFemalePlayer.gamertag, 'female', topFemalePlayer.avatar),
      accentColor: '#a855f7',
      accentLight: '#c084fc',
      division: 'female',
      metadata: [
        { icon: Medal, label: 'Tier', value: topFemalePlayer.tier || '—' },
        { icon: Trophy, label: 'Points', value: `${topFemalePlayer.points}` },
        { icon: Eye, label: 'Wins', value: `${topFemalePlayer.totalWins}` },
        { icon: Flame, label: 'Streak', value: `${topFemalePlayer.streak}W` },
      ],
      player: { ...topFemalePlayer, division: 'female' },
    });
  }

  // ─── 3. #1 Club Tarkam — top club by COMBINED tarkam points of members ───
  // Sort clubs by combined tarkam points of members, or use leagueData.stats.topClub
  let topClub = leagueData?.stats?.topClub || null;
  if (!topClub && leagueData?.clubs?.length > 0) {
    // Sort clubs by combined member tarkam points
    const sortedClubs = [...leagueData.clubs].sort((a: any, b: any) => {
      const aPoints = a.members?.reduce((sum: number, m: any) => sum + (m.tarkamPoints || m.points || 0), 0) || a.points || 0;
      const bPoints = b.members?.reduce((sum: number, m: any) => sum + (m.tarkamPoints || m.points || 0), 0) || b.points || 0;
      return bPoints - aPoints;
    });
    topClub = sortedClubs[0];
  }
  if (topClub) {
    const maleCount = topClub.members?.filter((m: any) => m.division === 'male')?.length || 0;
    const femaleCount = topClub.members?.filter((m: any) => m.division === 'female')?.length || 0;
    const totalClubMembers = topClub.memberCount || topClub.members?.length || 0;
    // Combined tarkam points from all members
    const combinedTarkamPoints = topClub.members?.reduce(
      (sum: number, m: any) => sum + (m.tarkamPoints || m.points || 0), 0
    ) || topClub.combinedPoints || topClub.points || 0;

    items.push({
      id: 'rank1-club',
      type: 'rank1-club',
      title: topClub.name,
      subtitle: '#1 Club Tarkam',
      description: `Klub terkuat di Tarkam IDM dengan ${totalClubMembers} anggota (${maleCount} male, ${femaleCount} female) dan ${combinedTarkamPoints.toLocaleString()} combined tarkam points. Klub ini menggabungkan kekuatan kedua divisi untuk mendominasi tarkam.`,
      badge: '#1 CLUB TARKAM',
      thumbLabel: '#1 Club',
      accentColor: '#d4a853',
      accentLight: '#f5d77a',
      clubName: topClub.name,
      clubLogo: topClub.logo,
      metadata: [
        { icon: Users, label: 'Members', value: `${totalClubMembers}` },
        { icon: Trophy, label: 'Combined Points', value: `${combinedTarkamPoints.toLocaleString()}` },
        { icon: Eye, label: 'Wins', value: `${topClub.wins || 0}` },
      ],
    });
  }

  // ─── 4. Streak Male — male player with longest win streak ───
  const malePlayers = maleData?.topPlayers || [];
  const maleStreakKing = [...malePlayers].sort((a, b) => b.streak - a.streak)[0];
  if (maleStreakKing && maleStreakKing.streak >= 2) {
    items.push({
      id: 'streak-male',
      type: 'streak-male',
      title: maleStreakKing.gamertag,
      subtitle: 'Streak Male',
      description: `Streak ${maleStreakKing.streak} kemenangan berturut-turut di divisi male! ${maleStreakKing.gamertag} menunjukkan konsistensi luar biasa di setiap pertandingan Tarkam.`,
      badge: 'STREAK MALE',
      thumbLabel: 'Streak Male',
      imageUrl: getAvatarUrl(maleStreakKing.gamertag, 'male', maleStreakKing.avatar),
      accentColor: '#f97316',
      accentLight: '#fb923c',
      division: 'male',
      metadata: [
        { icon: Flame, label: 'Streak', value: `${maleStreakKing.streak}W` },
        { icon: Trophy, label: 'Points', value: `${maleStreakKing.points}` },
        { icon: Eye, label: 'Wins', value: `${maleStreakKing.totalWins}` },
      ],
      player: { ...maleStreakKing, division: 'male' },
    });
  }

  // ─── 5. Streak Female — female player with longest win streak ───
  const femalePlayers = femaleData?.topPlayers || [];
  const femaleStreakKing = [...femalePlayers].sort((a, b) => b.streak - a.streak)[0];
  if (femaleStreakKing && femaleStreakKing.streak >= 2) {
    items.push({
      id: 'streak-female',
      type: 'streak-female',
      title: femaleStreakKing.gamertag,
      subtitle: 'Streak Female',
      description: `Streak ${femaleStreakKing.streak} kemenangan berturut-turut di divisi female! ${femaleStreakKing.gamertag} menunjukkan dominasi dan ketekunan yang luar biasa di Tarkam.`,
      badge: 'STREAK FEMALE',
      thumbLabel: 'Streak Female',
      imageUrl: getAvatarUrl(femaleStreakKing.gamertag, 'female', femaleStreakKing.avatar),
      accentColor: '#ef4444',
      accentLight: '#f87171',
      division: 'female',
      metadata: [
        { icon: Flame, label: 'Streak', value: `${femaleStreakKing.streak}W` },
        { icon: Trophy, label: 'Points', value: `${femaleStreakKing.points}` },
        { icon: Eye, label: 'Wins', value: `${femaleStreakKing.totalWins}` },
      ],
      player: { ...femaleStreakKing, division: 'female' },
    });
  }

  // ─── 6. MVP Terbaru Male — latest weekly MVP, or top MVP player as fallback ───
  const maleMvpList = maleData?.mvpHallOfFame || [];
  const latestMaleMvp = maleMvpList.length > 0 ? maleMvpList[maleMvpList.length - 1] : null;
  // Fallback: player with highest totalMvp from topPlayers (when no completed tournaments yet)
  const maleMvpFallback = !latestMaleMvp
    ? [...(maleData?.topPlayers || [])].filter(p => p.totalMvp > 0).sort((a, b) => b.totalMvp - a.totalMvp || b.points - a.points)[0] || null
    : null;
  const maleMvpSource = latestMaleMvp || maleMvpFallback;
  if (maleMvpSource) {
    const isMaleMvpFromHall = !!latestMaleMvp;
    const mvpPlayer = maleData?.topPlayers?.find(p => p.gamertag === maleMvpSource.gamertag);
    items.push({
      id: 'mvp-male',
      type: 'mvp-male',
      title: maleMvpSource.gamertag,
      subtitle: isMaleMvpFromHall ? `MVP Terbaru ♂` : 'MVP Terbanyak ♂',
      description: isMaleMvpFromHall
        ? `MVP terbaru divisi male di pekan ${maleMvpSource.weekNumber}! ${maleMvpSource.gamertag} menunjukkan performa luar biasa dan dinobatkan sebagai pemain terbaik pekan ini${maleMvpSource.totalMvp > 1 ? ` — sudah ${maleMvpSource.totalMvp}x meraih MVP sepanjang musim` : ''}.`
        : `Pemain dengan MVP terbanyak di divisi male! ${maleMvpSource.gamertag} telah meraih ${maleMvpSource.totalMvp}x MVP dan mengumpulkan ${maleMvpSource.points} poin sepanjang musim.`,
      badge: isMaleMvpFromHall ? `MVP W${maleMvpSource.weekNumber} ♂` : `${maleMvpSource.totalMvp}x MVP ♂`,
      thumbLabel: `MVP ♂`,
      imageUrl: getAvatarUrl(maleMvpSource.gamertag, 'male', maleMvpSource.avatar),
      accentColor: '#22c55e',
      accentLight: '#4ade80',
      division: 'male',
      mvpWeek: isMaleMvpFromHall ? maleMvpSource.weekNumber : undefined,
      mvpCount: maleMvpSource.totalMvp,
      metadata: [
        { icon: Award, label: 'MVP', value: `${maleMvpSource.totalMvp}x` },
        { icon: Trophy, label: 'Points', value: `${maleMvpSource.points}` },
        { icon: Eye, label: 'Wins', value: `${maleMvpSource.totalWins}` },
        { icon: Flame, label: 'Streak', value: `${maleMvpSource.streak}W` },
      ],
      player: mvpPlayer ? { ...mvpPlayer, division: 'male' } : (maleMvpFallback ? { ...maleMvpFallback, division: 'male' } : undefined),
    });
  }

  // ─── 7. MVP Terbaru Female — latest weekly MVP, or top MVP player as fallback ───
  const femaleMvpList = femaleData?.mvpHallOfFame || [];
  const latestFemaleMvp = femaleMvpList.length > 0 ? femaleMvpList[femaleMvpList.length - 1] : null;
  // Fallback: player with highest totalMvp from topPlayers (when no completed tournaments yet)
  const femaleMvpFallback = !latestFemaleMvp
    ? [...(femaleData?.topPlayers || [])].filter(p => p.totalMvp > 0).sort((a, b) => b.totalMvp - a.totalMvp || b.points - a.points)[0] || null
    : null;
  const femaleMvpSource = latestFemaleMvp || femaleMvpFallback;
  if (femaleMvpSource) {
    const isFemaleMvpFromHall = !!latestFemaleMvp;
    const mvpPlayer = femaleData?.topPlayers?.find(p => p.gamertag === femaleMvpSource.gamertag);
    items.push({
      id: 'mvp-female',
      type: 'mvp-female',
      title: femaleMvpSource.gamertag,
      subtitle: isFemaleMvpFromHall ? `MVP Terbaru ♀` : 'MVP Terbanyak ♀',
      description: isFemaleMvpFromHall
        ? `MVP terbaru divisi female di pekan ${femaleMvpSource.weekNumber}! ${femaleMvpSource.gamertag} menunjukkan performa luar biasa dan dinobatkan sebagai pemain terbaik pekan ini${femaleMvpSource.totalMvp > 1 ? ` — sudah ${femaleMvpSource.totalMvp}x meraih MVP sepanjang musim` : ''}.`
        : `Pemain dengan MVP terbanyak di divisi female! ${femaleMvpSource.gamertag} telah meraih ${femaleMvpSource.totalMvp}x MVP dan mengumpulkan ${femaleMvpSource.points} poin sepanjang musim.`,
      badge: isFemaleMvpFromHall ? `MVP W${femaleMvpSource.weekNumber} ♀` : `${femaleMvpSource.totalMvp}x MVP ♀`,
      thumbLabel: `MVP ♀`,
      imageUrl: getAvatarUrl(femaleMvpSource.gamertag, 'female', femaleMvpSource.avatar),
      accentColor: '#ec4899',
      accentLight: '#f472b6',
      division: 'female',
      mvpWeek: isFemaleMvpFromHall ? femaleMvpSource.weekNumber : undefined,
      mvpCount: femaleMvpSource.totalMvp,
      metadata: [
        { icon: Award, label: 'MVP', value: `${femaleMvpSource.totalMvp}x` },
        { icon: Trophy, label: 'Points', value: `${femaleMvpSource.points}` },
        { icon: Eye, label: 'Wins', value: `${femaleMvpSource.totalWins}` },
        { icon: Flame, label: 'Streak', value: `${femaleMvpSource.streak}W` },
      ],
      player: mvpPlayer ? { ...mvpPlayer, division: 'female' } : (femaleMvpFallback ? { ...femaleMvpFallback, division: 'female' } : undefined),
    });
  }

  return items;
}

/* ─── Shimmer Effect Component ─── */
function ShimmerOverlay({ accentColor, visible }: { accentColor: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${hexToRgba(accentColor, 0.08)} 45%, ${hexToRgba(accentColor, 0.15)} 50%, ${hexToRgba(accentColor, 0.08)} 55%, transparent 60%)`,
          animation: 'shimmer-sweep 0.8s cubic-bezier(0.4, 0, 0.2, 1) both',
        }}
      />
    </div>
  );
}

/* ─── Determine badge icon for featured card ─── */
function getBadgeIcon(type: HighlightItem['type'], accentLight: string) {
  switch (type) {
    case 'mvp-male':
    case 'mvp-female':
      return <Award className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    case 'rank1-male':
    case 'rank1-female':
      return <Medal className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    case 'rank1-club':
      return <Gem className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    case 'streak-male':
    case 'streak-female':
      return <Flame className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    default:
      return <Star className="w-3.5 h-3.5" style={{ color: accentLight }} />;
  }
}

/* ─── Determine watermark text for featured card ─── */
function getWatermarkText(type: HighlightItem['type']): string {
  switch (type) {
    case 'mvp-male':
    case 'mvp-female':
      return 'MVP';
    case 'rank1-male':
      return '#1 MALE';
    case 'rank1-female':
      return '#1 FEMALE';
    case 'rank1-club':
      return '#1 CLUB';
    case 'streak-male':
    case 'streak-female':
      return 'STREAK';
    default:
      return 'TARKAM';
  }
}

/* ─── Determine if this type should show a club logo watermark ─── */
function isClubType(type: HighlightItem['type']): boolean {
  return type === 'rank1-club';
}

/* ─── Thumbnail Card ─── */
function ThumbnailCard({
  item,
  isActive,
  onClick,
  index,
}: {
  item: HighlightItem;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const iconColor = isActive ? item.accentLight : item.accentColor;
  const iconScale = isActive ? 'scale(1.1)' : 'scale(1)';

  return (
    <button
      onClick={onClick}
      className={`reveal reveal-fade-up reveal-delay-${Math.min(index, 4)} group/thumb relative shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
        isActive ? 'scale-105' : 'opacity-60 hover:opacity-100'
      }`}
      aria-label={`View highlight: ${item.title}`}
      aria-pressed={isActive}
    >
      {/* Thumbnail square card */}
      <div
        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: isActive
            ? `0 0 0 2px ${item.accentColor}, 0 0 20px ${hexToRgba(item.accentColor, 0.35)}, 0 0 40px ${hexToRgba(item.accentColor, 0.15)}`
            : 'none',
          border: isActive ? `2px solid ${item.accentColor}` : `1px solid ${hexToRgba(item.accentColor, 0.2)}`,
        }}
      >
        {/* Background: image or gradient */}
        <div className="absolute inset-0">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="112px"
              className="object-cover object-top transition-opacity duration-300"
              style={{ opacity: isActive ? 0.7 : 0.35 }}
            />
          ) : item.clubName ? (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${hexToRgba(item.accentColor, 0.2)} 0%, rgba(13,13,26,0.9) 70%)` }}>
              <ClubLogoImage
                clubName={item.clubName}
                dbLogo={item.clubLogo}
                alt={item.clubName}
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                style={{ opacity: isActive ? 1 : 0.5 }}
              />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(item.accentColor, 0.25)} 0%, ${hexToRgba(item.accentColor, 0.05)} 50%, rgba(13,13,26,0.9) 100%)`,
              }}
            />
          )}
          {/* Dark overlay for inactive */}
          {!isActive && <div className="absolute inset-0 bg-[#0d0d1a]/50" />}
          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a]/80 via-transparent to-transparent" />
        </div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: hexToRgba(item.accentColor, isActive ? 0.25 : 0.1),
              border: `1px solid ${hexToRgba(item.accentColor, isActive ? 0.5 : 0.2)}`,
              boxShadow: isActive ? `0 0 20px ${hexToRgba(item.accentColor, 0.2)}` : 'none',
            }}
          >
            {item.type === 'rank1-male' || item.type === 'rank1-female' ? (
              <Medal className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" style={{ color: iconColor, transform: iconScale }} />
            ) : item.type === 'rank1-club' ? (
              <Gem className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" style={{ color: iconColor, transform: iconScale }} />
            ) : item.type === 'streak-male' || item.type === 'streak-female' ? (
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" style={{ color: iconColor, transform: iconScale }} />
            ) : item.type === 'mvp-male' || item.type === 'mvp-female' ? (
              <Award className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" style={{ color: iconColor, transform: iconScale }} />
            ) : (
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" style={{ color: iconColor, transform: iconScale }} />
            )}
          </div>
        </div>

        {/* Active ring glow animation — CSS-only pulse */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 1px ${hexToRgba(item.accentColor, 0.4)}`,
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
        )}

        {/* Streak fire effect for streak types — CSS bounce */}
        {(item.type === 'streak-male' || item.type === 'streak-female') && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-bounce">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
          </div>
        )}

        {/* Season champion trophy icon overlay — replaced by SeasonChampionSection */}
        {/* MVP star icon overlay */}
        {(item.type === 'mvp-male' || item.type === 'mvp-female') && (
          <div className="absolute top-1.5 right-1.5 pointer-events-none">
            <Award className="w-3.5 h-3.5" style={{ color: item.accentLight, filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.5))' }} />
          </div>
        )}

        {/* Rank #1 overlay for rank1 types */}
        {(item.type === 'rank1-male' || item.type === 'rank1-female' || item.type === 'rank1-club') && (
          <div className="absolute top-1.5 right-1.5 pointer-events-none">
            <span className="text-[9px] font-black" style={{ color: item.accentLight, textShadow: `0 0 8px ${hexToRgba(item.accentColor, 0.5)}` }}>
              #1
            </span>
          </div>
        )}
      </div>

      {/* Label below thumbnail */}
      <span
        className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-center leading-tight transition-colors duration-300 max-w-[96px] sm:max-w-[112px] truncate"
        style={{ color: isActive ? item.accentColor : 'rgba(255,255,255,0.45)' }}
      >
        {item.thumbLabel}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HIGHLIGHTS SECTION COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function HighlightsSection({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onVideoPlay,
  setSelectedPlayer,
}: HighlightsSectionProps) {
  // CMS text fields with fallbacks
  const highlightsLabel = cmsSettings?.highlights_label || 'HIGHLIGHTS';
  const highlightsTitle = cmsSettings?.highlights_title || 'Puncak Prestasi';
  const highlightsSubtitle = cmsSettings?.highlights_subtitle || 'Peringkat #1 tarkam, streak terpanjang, dan MVP terbaru di Tarkam IDM';
  const highlightsVideoUrl = cmsSettings?.highlights_video_url || '';
  /* ─── Build highlight items from data ─── */
  const highlights = useMemo(
    () => buildHighlights(maleData, femaleData, leagueData),
    [maleData, femaleData, leagueData]
  );

  /* ─── Active highlight state ─── */
  const [activeIdx, setActiveIdx] = useState(0);
  const active = highlights[activeIdx];
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Clamp activeIdx when highlights array changes
  useEffect(() => {
    if (highlights.length > 0 && activeIdx >= highlights.length) {
      setTimeout(() => setActiveIdx(highlights.length - 1), 0);
    }
  }, [highlights.length, activeIdx]);

  /* ─── Handle thumbnail click with transition ─── */
  const handleThumbClick = useCallback((idx: number) => {
    if (idx === activeIdx) return;
    setIsTransitioning(true);
    setActiveIdx(idx);
    // Shimmer duration
    setTimeout(() => setIsTransitioning(false), 800);
  }, [activeIdx]);

  /* ─── 3D tilt hook for featured card ─── */
  const { cardRef, handleMouseMove, handleMouseLeave } = use3DTilt(8);

  /* ─── Section ref for accessibility ─── */
  const sectionRef = useRef<HTMLElement>(null);

  /* ─── Thumbnail scroll ref & arrows ─── */
  const thumbScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = thumbScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = thumbScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollability, { passive: true });
      return () => el.removeEventListener('scroll', checkScrollability);
    }
  }, [checkScrollability, highlights.length]);

  const scrollThumbs = useCallback((direction: 'left' | 'right') => {
    const el = thumbScrollRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  // Auto-scroll to active thumbnail
  useEffect(() => {
    const el = thumbScrollRef.current;
    if (!el) return;
    const thumbEl = el.children[activeIdx] as HTMLElement | undefined;
    if (thumbEl) {
      const elRect = el.getBoundingClientRect();
      const thumbRect = thumbEl.getBoundingClientRect();
      const offset = thumbRect.left - elRect.left + thumbRect.width / 2 - elRect.width / 2;
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [activeIdx]);

  /* ─── No data state ─── */
  if (highlights.length === 0) return null;

  return (
    <section
      id="highlights"
      ref={sectionRef}
      role="region"
      aria-label="Highlights"
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* ═══ Background Layers ═══ */}
      <div className="absolute inset-0 bg-[#0d0d1a]" />
      {/* Gold grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,168,83,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,83,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      {/* Gold radial spotlight from top center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.08) 0%, transparent 55%)',
        }}
      />
      {/* Bilateral accent glows - dynamically based on active highlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 15% 50%, ${hexToRgba(active?.accentColor || '#06b6d4', 0.05)} 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, ${hexToRgba(active?.accentColor || '#a855f7', 0.05)} 0%, transparent 45%)`,
        }}
      />
      {/* Top & bottom gold edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-idm-gold-warm/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-idm-gold-warm/15 to-transparent" />

      {/* ═══ Content ═══ */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <AnimatedSection>
          <SectionHeader
            icon={Trophy}
            label={highlightsLabel}
            title={highlightsTitle}
            subtitle={highlightsSubtitle}
          />
        </AnimatedSection>

        {/* ═══ Main Grid: Asymmetric 5-column ═══ */}
        {active && (
          <div key={active.id}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6">
              {/* ═══ LEFT: Featured Card (3 cols) ═══ */}
              <div className="reveal reveal-fade-left md:col-span-1 lg:col-span-3">
                <div
                  ref={cardRef}
                  onMouseMove={handleMouseMove}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = hexToRgba(active.accentColor, 0.45);
                    e.currentTarget.style.boxShadow = `0 0 40px ${hexToRgba(active.accentColor, 0.15)}, 0 20px 60px rgba(0,0,0,0.4)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = hexToRgba(active.accentColor, 0.2);
                    e.currentTarget.style.boxShadow = 'none';
                    handleMouseLeave();
                  }}
                  className="perspective-card relative rounded-2xl overflow-hidden border transition-all duration-500 group/featured cursor-pointer"
                  style={{
                    borderColor: hexToRgba(active.accentColor, 0.2),
                    minHeight: '420px',
                    height: '100%',
                    transition: 'transform 0.15s ease-out, border-color 0.3s, box-shadow 0.3s',
                  }}
                  role={active.player ? 'button' : undefined}
                  tabIndex={active.player ? 0 : undefined}
                  aria-label={active.player ? `View profile: ${active.title}` : undefined}
                  onClick={() => {
                    if (active.player) setSelectedPlayer(active.player);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && active.player) {
                      e.preventDefault();
                      setSelectedPlayer(active.player);
                    }
                  }}
                >
                  {/* Shimmer effect during transition */}
                  <ShimmerOverlay accentColor={active.accentColor} visible={isTransitioning} />

                  {/* Featured Image / Gradient BG */}
                  {active.imageUrl ? (
                    <Image
                      src={active.imageUrl}
                      alt={active.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover object-top transition-transform duration-700 group-hover/featured:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `
                          linear-gradient(135deg, ${hexToRgba(active.accentColor, 0.12)} 0%, #0d0d1a 30%, ${hexToRgba(active.accentColor, 0.06)} 60%, #0d0d1a 100%)
                        `,
                      }}
                    />
                  )}

                  {/* Multi-layer overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d1a]/50 via-transparent to-transparent" />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 80% 70%, ${hexToRgba(active.accentColor, 0.1)}, transparent 60%)`,
                    }}
                  />

                  {/* Gold grid texture overlay on card */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.025]"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(212,168,83,0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(212,168,83,0.5) 1px, transparent 1px)
                      `,
                      backgroundSize: '30px 30px',
                    }}
                  />

                  {/* Badge overlay — top right */}
                  <div className="absolute top-4 right-4 z-20">
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: hexToRgba(active.accentColor, 0.35),
                        borderColor: hexToRgba(active.accentColor, 0.4),
                      }}
                    >
                      {getBadgeIcon(active.type, active.accentLight)}
                      <span
                        className="text-[10px] font-black uppercase tracking-wider"
                        style={{ color: active.accentLight }}
                      >
                        {active.badge}
                      </span>
                    </div>
                  </div>

                  {/* Club Logo — for rank1-club type */}
                  {isClubType(active.type) && active.clubName && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                      <div
                        className="w-36 h-36 sm:w-48 sm:h-48 rounded-3xl overflow-hidden opacity-10 group-hover/featured:opacity-15 transition-opacity duration-500"
                        style={{
                          filter: `drop-shadow(0 0 40px ${hexToRgba(active.accentColor, 0.3)})`,
                        }}
                      >
                        <ClubLogoImage
                          clubName={active.clubName}
                          dbLogo={active.clubLogo}
                          alt={active.clubName}
                          width={192}
                          height={192}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* MVP Award overlay — CSS float animation */}
                  {(active.type === 'mvp-male' || active.type === 'mvp-female') && (
                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                      <div className="animate-float-subtle">
                        <Award className="w-8 h-8 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]" style={{ color: active.accentLight }} />
                      </div>
                    </div>
                  )}

                  {/* Rank #1 badge overlay for rank1 types — CSS pulse animation */}
                  {(active.type === 'rank1-male' || active.type === 'rank1-female') && (
                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: hexToRgba(active.accentColor, 0.3),
                          border: `1px solid ${hexToRgba(active.accentColor, 0.4)}`,
                          animation: 'pulse-glow 2s ease-in-out infinite',
                        }}
                      >
                        <Medal className="w-4 h-4" style={{ color: active.accentLight }} />
                        <span className="text-[11px] font-black" style={{ color: active.accentLight }}>
                          PERINGKAT #1
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rank #1 Club badge overlay — CSS pulse animation */}
                  {active.type === 'rank1-club' && (
                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: hexToRgba('#d4a853', 0.3),
                          border: '1px solid rgba(212,168,83,0.4)',
                          animation: 'pulse-glow 2s ease-in-out infinite',
                        }}
                      >
                        <Gem className="w-4 h-4 text-idm-gold-warm" />
                        <span className="text-[11px] font-black text-idm-gold-warm">
                          #1 CLUB TARKAM
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Streak fire effects for streak types — CSS animation */}
                  {(active.type.includes('streak')) && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute"
                          style={{
                            left: `${20 + i * 15}%`,
                            bottom: '10%',
                            width: 3,
                            height: 3,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${hexToRgba('#f97316', 0.6)} 0%, transparent 70%)`,
                            animation: `streak-particle ${1.5 + i * 0.3}s ease-out ${i * 0.4}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Large watermark text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
                    <span
                      className="text-6xl sm:text-8xl font-black uppercase tracking-widest select-none"
                      style={{
                        color: 'rgba(212,168,83,0.03)',
                        WebkitTextStroke: '1px rgba(212,168,83,0.05)',
                      }}
                    >
                      {getWatermarkText(active.type)}
                    </span>
                  </div>

                  {/* Bottom info bar on featured card */}
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-7 z-10">
                    <div
                      className="h-px w-full mb-4"
                      style={{
                        background: `linear-gradient(to right, ${hexToRgba(active.accentColor, 0.4)}, transparent 60%)`,
                      }}
                    />
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: hexToRgba(active.accentColor, 0.2),
                          border: `1px solid ${hexToRgba(active.accentColor, 0.3)}`,
                          boxShadow: `0 0 20px ${hexToRgba(active.accentColor, 0.1)}`,
                        }}
                      >
                        {isClubType(active.type) && active.clubName ? (
                          <ClubLogoImage
                            clubName={active.clubName}
                            dbLogo={active.clubLogo}
                            alt={active.clubName}
                            width={48}
                            height={48}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded object-cover"
                          />
                        ) : active.type === 'rank1-male' || active.type === 'rank1-female' ? (
                          <Medal className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: active.accentLight }} />
                        ) : active.type === 'mvp-male' || active.type === 'mvp-female' ? (
                          <Award className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: active.accentLight }} />
                        ) : active.type === 'rank1-club' ? (
                          <Gem className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: active.accentLight }} />
                        ) : active.type.includes('streak') ? (
                          <Flame className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: active.accentLight }} />
                        ) : (
                          <Star className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: active.accentLight }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: active.accentLight }}>
                          {active.subtitle}
                        </p>
                        <h3
                          className="text-2xl sm:text-4xl font-black text-white leading-tight truncate"
                          style={{
                            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
                          }}
                        >
                          {active.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Gold gradient shimmer at bottom edge */}
                  <div className="absolute bottom-0 inset-x-0 h-1 z-20" style={{ background: `linear-gradient(to right, transparent, ${active.accentColor}, transparent)` }} />
                </div>
              </div>

              {/* ═══ RIGHT: Detail Panel (2 cols) ═══ */}
              <div className="reveal reveal-fade-right md:col-span-1 lg:col-span-2">
                <div
                  className="relative rounded-2xl border overflow-hidden h-full flex flex-col"
                  style={{
                    borderColor: hexToRgba(active.accentColor, 0.15),
                    background: 'linear-gradient(180deg, rgba(13,13,26,0.95) 0%, rgba(10,10,20,0.98) 100%)',
                    minHeight: '420px',
                  }}
                >
                  {/* Panel top accent line */}
                  <div
                    className="h-1 shrink-0"
                    style={{
                      background: `linear-gradient(to right, transparent, ${active.accentColor}, transparent)`,
                    }}
                  />

                  <div className="relative z-10 p-5 sm:p-7 flex flex-col flex-1">
                    {/* Gold label with decorative lines */}
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="h-px flex-1"
                        style={{
                          background: `linear-gradient(to right, transparent, ${hexToRgba(active.accentColor, 0.3)})`,
                        }}
                      />
                      <div
                        className="flex items-center gap-2 px-3 py-1 rounded-full border"
                        style={{
                          backgroundColor: hexToRgba(active.accentColor, 0.08),
                          borderColor: hexToRgba(active.accentColor, 0.2),
                        }}
                      >
                        <Crown className="w-3 h-3 text-idm-gold-warm" />
                        <span className="text-[10px] font-bold text-idm-gold-warm uppercase tracking-[0.2em]">Tarkam IDM</span>
                      </div>
                      <div
                        className="h-px flex-1"
                        style={{
                          background: `linear-gradient(to left, transparent, ${hexToRgba(active.accentColor, 0.3)})`,
                        }}
                      />
                    </div>

                    {/* Title in gold gradient text */}
                    <h3
                      className="text-2xl sm:text-3xl font-black leading-tight mb-1"
                      style={{
                        background: `linear-gradient(135deg, #f5e6c8 0%, ${active.accentColor} 40%, #f5d77a 70%, ${active.accentColor} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {active.title}
                    </h3>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-5"
                      style={{ color: active.accentLight }}
                    >
                      {active.subtitle}
                    </p>

                    {/* Metadata rows */}
                    <div className="space-y-3 mb-5">
                      {active.metadata.map((meta, i) => {
                        const MetaIcon = meta.icon;
                        return (
                          <div
                            key={`${meta.label}-${i}`}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-200 hover:bg-white/[0.03]"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.015)',
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: hexToRgba(active.accentColor, 0.12),
                              }}
                            >
                              <MetaIcon className="w-3.5 h-3.5" style={{ color: active.accentColor }} />
                            </div>
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                              {meta.label}
                            </span>
                            <span className="ml-auto text-sm font-bold text-white">
                              {meta.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Separator */}
                    <div
                      className="h-px mb-5"
                      style={{
                        background: `linear-gradient(to right, transparent, ${hexToRgba(active.accentColor, 0.2)}, transparent)`,
                      }}
                    />

                    {/* Description */}
                    <p className="text-[13px] text-[#a09880] leading-relaxed mb-6 flex-1">
                      {active.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-auto">
                      {active.player && !active.isEmpty && (
                        <button
                          onClick={() => setSelectedPlayer(active.player)}
                          className="tap-scale flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                          style={{
                            backgroundColor: hexToRgba(active.accentColor, 0.15),
                            color: active.accentLight,
                            border: `1px solid ${hexToRgba(active.accentColor, 0.3)}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = hexToRgba(active.accentColor, 0.25);
                            e.currentTarget.style.boxShadow = `0 0 20px ${hexToRgba(active.accentColor, 0.15)}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = hexToRgba(active.accentColor, 0.15);
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          <span>Lihat Detail</span>
                        </button>
                      )}
                      {onVideoPlay && highlightsVideoUrl && (
                        <button
                          onClick={() => {
                            onVideoPlay(
                              highlightsVideoUrl,
                              `${active.title} — Tarkam IDM Highlight`
                            );
                          }}
                          className="tap-scale flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: '#f5f0e8',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = hexToRgba(active.accentColor, 0.3);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          }}
                        >
                          <Play className="w-4 h-4" />
                          <span>Tonton Video</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Thumbnail Selector Row (BELOW the featured card) ═══ */}
        {highlights.length > 1 && (
          <div className="mt-6 sm:mt-8">
            {/* Section label + counter */}
            <div className="flex items-center gap-3 mb-4">
              <ChevronRight className="w-4 h-4 text-idm-gold-warm/60" />
              <span className="text-[11px] font-bold text-idm-gold-warm/60 uppercase tracking-widest">
                Pilih Highlight
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-idm-gold-warm/10 to-transparent" />
              <span className="text-[11px] font-medium text-muted-foreground/40 tabular-nums">
                {activeIdx + 1} / {highlights.length}
              </span>
            </div>

            {/* Scrollable thumbnails with nav arrows */}
            <div className="relative group/scroll">
              {/* Left arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollThumbs('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0d0d1a]/90 border border-idm-gold-warm/20 flex items-center justify-center transition-all duration-200 hover:bg-[#0d0d1a] hover:border-idm-gold-warm/40 cursor-pointer opacity-0 group-hover/scroll:opacity-100"
                  aria-label="Scroll thumbnails left"
                >
                  <ChevronLeft className="w-4 h-4 text-idm-gold-warm" />
                </button>
              )}

              {/* Right arrow */}
              {canScrollRight && (
                <button
                  onClick={() => scrollThumbs('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0d0d1a]/90 border border-idm-gold-warm/20 flex items-center justify-center transition-all duration-200 hover:bg-[#0d0d1a] hover:border-idm-gold-warm/40 cursor-pointer opacity-0 group-hover/scroll:opacity-100"
                  aria-label="Scroll thumbnails right"
                >
                  <ChevronRight className="w-4 h-4 text-idm-gold-warm" />
                </button>
              )}

              {/* Left fade mask */}
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 z-10 pointer-events-none bg-gradient-to-r from-[#0d0d1a] to-transparent" />
              )}

              {/* Right fade mask */}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 z-10 pointer-events-none bg-gradient-to-l from-[#0d0d1a] to-transparent" />
              )}

              {/* Scrollable container */}
              <div
                ref={thumbScrollRef}
                className="flex items-start gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {highlights.map((item, idx) => (
                  <ThumbnailCard
                    key={item.id}
                    item={item}
                    isActive={idx === activeIdx}
                    onClick={() => handleThumbClick(idx)}
                    index={idx}
                  />
                ))}
              </div>
            </div>

            {/* Progress dots (mobile) */}
            <div className="flex items-center justify-center gap-1.5 mt-3 sm:hidden">
              {highlights.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbClick(idx)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeIdx ? 'w-6 h-1.5' : 'w-1.5 h-1.5'
                  }`}
                  style={{
                    backgroundColor:
                      idx === activeIdx
                        ? highlights[activeIdx].accentColor
                        : 'rgba(255,255,255,0.15)',
                  }}
                  aria-label={`Go to highlight ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Decorative ambient particles — CSS-only animation ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${10 + i * 12}%`,
              bottom: '0%',
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              background: `radial-gradient(circle, ${hexToRgba('#d4a853', 0.3)} 0%, transparent 70%)`,
              animation: `ambient-particle ${10 + i * 3}s linear ${i * 1.5}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ═══ Corner accents ═══ */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-6 left-6 w-12 h-12 border-l border-t rounded-tl-lg" style={{ borderColor: hexToRgba('#d4a853', 0.1) }} />
        <div className="absolute top-6 right-6 w-12 h-12 border-r border-t rounded-tr-lg" style={{ borderColor: hexToRgba('#d4a853', 0.1) }} />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-l border-b rounded-bl-lg" style={{ borderColor: hexToRgba('#d4a853', 0.1) }} />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-r border-b rounded-br-lg" style={{ borderColor: hexToRgba('#d4a853', 0.1) }} />
      </div>
    </section>
  );
}
