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
import type { StatsData, TopPlayer, SeasonInfo, MvpHallOfFameEntry, WeeklyPerformer } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — HIGHLIGHTS SECTION (PUNCAK PRESTASI)
   Duo Champion Card Layout — Male + Female in one card
   
   5 Highlight Categories:
   1. Juwara #1 — #1 Tarkam Male + Female (duo avatar)
   2. Performa Terbaik — Weekly Top Performer Male + Female (duo avatar)
   3. Klub Terkuat — #1 Club Tarkam (solo)
   4. MVP Terbaru — Male + Female MVP (duo avatar)
   5. Streak Terpanjang — Male + Female streak (duo avatar)
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

/* ─── Duo Player Data ─── */
interface DuoPlayer {
  gamertag: string;
  imageUrl?: string;
  tier?: string;
  points: number;
  totalWins: number;
  streak: number;
  totalMvp?: number;
  mvpWeek?: number;
  weeklyPointsGained?: number;
  player: TopPlayer & { division?: string };
  isEmpty?: boolean;
}

/* ─── Highlight Item Type ─── */
interface HighlightItem {
  id: string;
  type: 'rank1' | 'performance' | 'rank1-club' | 'streak' | 'mvp';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  /** Short 2-3 word label for thumbnail */
  thumbLabel: string;
  /** Primary accent color */
  accentColor: string;
  accentLight: string;
  /** Duo player data (for rank1, streak, mvp) */
  isDuo?: boolean;
  male?: DuoPlayer;
  female?: DuoPlayer;
  maleAccent: string;
  femaleAccent: string;
  maleAccentLight: string;
  femaleAccentLight: string;
  /** Solo data (for club) */
  imageUrl?: string;
  clubName?: string;
  clubLogo?: string | null;
  /** Shared metadata rows for detail panel */
  metadata: { icon: typeof Calendar; label: string; value: string }[];
  /** Whether both sides are empty */
  isEmpty?: boolean;
  /** MVP week number */
  mvpWeek?: number;
  mvpCount?: number;
  /** Performance week number */
  weekNumber?: number;
  /** Weekly points gained (for performance tab) */
  weeklyPointsGained?: number;
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
     5 DUO/SOLO HIGHLIGHT CATEGORIES:
     1. Juwara #1 — Male #1 + Female #1 (duo)
     2. Performa Terbaik — Weekly Top Performer Male + Female (duo)
     3. Klub Terkuat — #1 Club (solo)
     4. MVP Terbaru — Male + Female MVP (duo)
     5. Streak Terpanjang — Male + Female streak (duo)
     ═══════════════════════════════════════════════════════════ */

  // ─── 1. Juwara #1 — Male #1 + Female #1 ───
  const topMale = maleData?.topPlayers?.[0];
  const topFemale = femaleData?.topPlayers?.[0];
  const rank1IsEmpty = !topMale && !topFemale;

  items.push({
    id: 'rank1',
    type: 'rank1',
    title: topMale && topFemale ? `${topMale.gamertag} & ${topFemale.gamertag}` : topMale ? topMale.gamertag : topFemale ? topFemale.gamertag : 'Belum Ada Data',
    subtitle: 'Juwara #1 Tarkam',
    description: topMale && topFemale
      ? `Pemimpin klasemen tarkam dari kedua divisi! ${topMale.gamertag} mendominasi divisi male dengan ${topMale.points} poin, sementara ${topFemale.gamertag} memimpin divisi female dengan ${topFemale.points} poin. Dua pemain terbaik Tarkam IDM saat ini.`
      : topMale
        ? `Pemimpin klasemen tarkam divisi male dengan ${topMale.points} poin dan ${topMale.totalWins} kemenangan.`
        : topFemale
          ? `Pemimpin klasemen tarkam divisi female dengan ${topFemale.points} poin dan ${topFemale.totalWins} kemenangan.`
          : 'Pemimpin klasemen akan muncul di sini setelah pertandingan dimulai.',
    badge: '#1 TARKAM',
    thumbLabel: '#1 Tarkam',
    accentColor: '#06b6d4',
    accentLight: '#22d3ee',
    isDuo: true,
    male: topMale ? {
      gamertag: topMale.gamertag,
      imageUrl: getAvatarUrl(topMale.gamertag, 'male', topMale.avatar),
      tier: topMale.tier,
      points: topMale.points,
      totalWins: topMale.totalWins,
      streak: topMale.streak,
      player: { ...topMale, division: 'male' },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    female: topFemale ? {
      gamertag: topFemale.gamertag,
      imageUrl: getAvatarUrl(topFemale.gamertag, 'female', topFemale.avatar),
      tier: topFemale.tier,
      points: topFemale.points,
      totalWins: topFemale.totalWins,
      streak: topFemale.streak,
      player: { ...topFemale, division: 'female' },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    maleAccent: '#06b6d4',
    femaleAccent: '#a855f7',
    maleAccentLight: '#22d3ee',
    femaleAccentLight: '#c084fc',
    isEmpty: rank1IsEmpty,
    metadata: [
      ...(topMale ? [{ icon: Medal, label: 'Tier ♂', value: topMale.tier || '—' }] : []),
      ...(topMale ? [{ icon: Trophy, label: 'Points ♂', value: `${topMale.points}` }] : []),
      ...(topFemale ? [{ icon: Medal, label: 'Tier ♀', value: topFemale.tier || '—' }] : []),
      ...(topFemale ? [{ icon: Trophy, label: 'Points ♀', value: `${topFemale.points}` }] : []),
    ],
  });

  // ─── 2. Performa Terbaik — Weekly Top Performer Male + Female ───
  const topMalePerformer: WeeklyPerformer | undefined = maleData?.weeklyTopPerformers?.[0];
  const topFemalePerformer: WeeklyPerformer | undefined = femaleData?.weeklyTopPerformers?.[0];
  const performanceIsEmpty = !topMalePerformer && !topFemalePerformer;

  items.push({
    id: 'performance',
    type: 'performance',
    title: topMalePerformer && topFemalePerformer
      ? `${topMalePerformer.gamertag} & ${topFemalePerformer.gamertag}`
      : topMalePerformer ? topMalePerformer.gamertag
      : topFemalePerformer ? topFemalePerformer.gamertag
      : 'Belum Ada Data',
    subtitle: 'Performa Terbaik Minggu Ini',
    description: topMalePerformer && topFemalePerformer
      ? `Bintang minggu ini! ${topMalePerformer.gamertag} (♂) mencetak +${topMalePerformer.weeklyPointsGained} poin minggu ini dengan composite score ${topMalePerformer.compositeScore}, sementara ${topFemalePerformer.gamertag} (♀) mencetak +${topFemalePerformer.weeklyPointsGained} poin dengan composite score ${topFemalePerformer.compositeScore}. Tier: ${topMalePerformer.tier} & ${topFemalePerformer.tier}.`
      : topMalePerformer
        ? `Bintang minggu ini divisi male! ${topMalePerformer.gamertag} mencetak +${topMalePerformer.weeklyPointsGained} poin minggu ini dengan composite score ${topMalePerformer.compositeScore}. Tier: ${topMalePerformer.tier}.`
        : topFemalePerformer
          ? `Bintang minggu ini divisi female! ${topFemalePerformer.gamertag} mencetak +${topFemalePerformer.weeklyPointsGained} poin minggu ini dengan composite score ${topFemalePerformer.compositeScore}. Tier: ${topFemalePerformer.tier}.`
          : 'Pemain dengan performa terbaik minggu ini akan muncul di sini setelah pertandingan selesai.',
    badge: 'BINTANG MINGGU INI',
    thumbLabel: 'Performa',
    accentColor: '#eab308',
    accentLight: '#facc15',
    isDuo: true,
    male: topMalePerformer ? {
      gamertag: topMalePerformer.gamertag,
      imageUrl: getAvatarUrl(topMalePerformer.gamertag, 'male', topMalePerformer.avatar),
      tier: topMalePerformer.tier,
      points: topMalePerformer.points,
      totalWins: topMalePerformer.weeklyWins,
      streak: topMalePerformer.streak,
      weeklyPointsGained: topMalePerformer.weeklyPointsGained,
      player: { ...topMalePerformer, division: 'male', name: topMalePerformer.gamertag, totalWins: topMalePerformer.weeklyWins, totalMvp: 0, maxStreak: topMalePerformer.streak, matches: topMalePerformer.weeklyMatches } as TopPlayer & { division?: string },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    female: topFemalePerformer ? {
      gamertag: topFemalePerformer.gamertag,
      imageUrl: getAvatarUrl(topFemalePerformer.gamertag, 'female', topFemalePerformer.avatar),
      tier: topFemalePerformer.tier,
      points: topFemalePerformer.points,
      totalWins: topFemalePerformer.weeklyWins,
      streak: topFemalePerformer.streak,
      weeklyPointsGained: topFemalePerformer.weeklyPointsGained,
      player: { ...topFemalePerformer, division: 'female', name: topFemalePerformer.gamertag, totalWins: topFemalePerformer.weeklyWins, totalMvp: 0, maxStreak: topFemalePerformer.streak, matches: topFemalePerformer.weeklyMatches } as TopPlayer & { division?: string },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    maleAccent: '#eab308',
    femaleAccent: '#f97316',
    maleAccentLight: '#facc15',
    femaleAccentLight: '#fb923c',
    isEmpty: performanceIsEmpty,
    weekNumber: topMalePerformer?.weekNumber || topFemalePerformer?.weekNumber,
    metadata: [
      ...(topMalePerformer || topFemalePerformer ? [{ icon: BarChart3, label: 'Composite Score', value: `${topMalePerformer?.compositeScore ?? topFemalePerformer?.compositeScore ?? 0}` }] : []),
      ...(topMalePerformer ? [{ icon: TrendingUp, label: 'Weekly Pts ♂', value: `+${topMalePerformer.weeklyPointsGained}` }] : []),
      ...(topFemalePerformer ? [{ icon: TrendingUp, label: 'Weekly Pts ♀', value: `+${topFemalePerformer.weeklyPointsGained}` }] : []),
      ...(topMalePerformer ? [{ icon: Flame, label: 'Streak ♂', value: `${topMalePerformer.streak}W` }] : []),
      ...(topFemalePerformer ? [{ icon: Flame, label: 'Streak ♀', value: `${topFemalePerformer.streak}W` }] : []),
    ],
  });

  // ─── 3. Klub Terkuat — #1 Club ───
  let topClub = leagueData?.stats?.topClub || null;
  if (!topClub && leagueData?.clubs?.length > 0) {
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
    const combinedTarkamPoints = topClub.members?.reduce(
      (sum: number, m: any) => sum + (m.tarkamPoints || m.points || 0), 0
    ) || topClub.combinedPoints || topClub.points || 0;

    items.push({
      id: 'rank1-club',
      type: 'rank1-club',
      title: topClub.name,
      subtitle: '#1 Club Tarkam',
      description: `Klub terkuat di Tarkam IDM dengan ${totalClubMembers} anggota (${maleCount} male, ${femaleCount} female) dan ${combinedTarkamPoints.toLocaleString()} combined tarkam points.`,
      badge: '#1 CLUB TARKAM',
      thumbLabel: '#1 Club',
      accentColor: '#d4a853',
      accentLight: '#f5d77a',
      maleAccent: '#d4a853',
      femaleAccent: '#d4a853',
      maleAccentLight: '#f5d77a',
      femaleAccentLight: '#f5d77a',
      clubName: topClub.name,
      clubLogo: topClub.logo,
      metadata: [
        { icon: Users, label: 'Members', value: `${totalClubMembers}` },
        { icon: Trophy, label: 'Combined Pts', value: `${combinedTarkamPoints.toLocaleString()}` },
        { icon: Eye, label: 'Wins', value: `${topClub.wins || 0}` },
      ],
    });
  } else {
    items.push({
      id: 'rank1-club-empty',
      type: 'rank1-club',
      title: 'Belum Ada Data',
      subtitle: '#1 Club Tarkam',
      description: 'Klub terkuat akan muncul di sini setelah ada klub yang berkompetisi.',
      badge: '#1 CLUB',
      thumbLabel: '#1 Club',
      accentColor: '#d4a853',
      accentLight: '#f5d77a',
      maleAccent: '#d4a853',
      femaleAccent: '#d4a853',
      maleAccentLight: '#f5d77a',
      femaleAccentLight: '#f5d77a',
      isEmpty: true,
      metadata: [],
    });
  }

  // ─── 4. MVP Terbaru — Male + Female ───
  const maleMvpList = maleData?.mvpHallOfFame || [];
  const latestMaleMvp = maleMvpList.length > 0 ? maleMvpList[maleMvpList.length - 1] : null;
  const maleMvpFallback = !latestMaleMvp
    ? [...(maleData?.topPlayers || [])].filter(p => p.totalMvp > 0).sort((a, b) => b.totalMvp - a.totalMvp || b.points - a.points)[0] || null
    : null;
  const maleMvpSource = latestMaleMvp || maleMvpFallback;

  const femaleMvpList = femaleData?.mvpHallOfFame || [];
  const latestFemaleMvp = femaleMvpList.length > 0 ? femaleMvpList[femaleMvpList.length - 1] : null;
  const femaleMvpFallback = !latestFemaleMvp
    ? [...(femaleData?.topPlayers || [])].filter(p => p.totalMvp > 0).sort((a, b) => b.totalMvp - a.totalMvp || b.points - a.points)[0] || null
    : null;
  const femaleMvpSource = latestFemaleMvp || femaleMvpFallback;

  const isMaleMvpFromHall = !!latestMaleMvp;
  const isFemaleMvpFromHall = !!latestFemaleMvp;
  const maleMvpWeek = isMaleMvpFromHall ? (maleMvpSource as MvpHallOfFameEntry).weekNumber : undefined;
  const femaleMvpWeek = isFemaleMvpFromHall ? (femaleMvpSource as MvpHallOfFameEntry).weekNumber : undefined;
  const mvpIsEmpty = !maleMvpSource && !femaleMvpSource;

  items.push({
    id: 'mvp',
    type: 'mvp',
    title: maleMvpSource && femaleMvpSource ? `${maleMvpSource.gamertag} & ${femaleMvpSource.gamertag}` : maleMvpSource ? maleMvpSource.gamertag : femaleMvpSource ? femaleMvpSource.gamertag : 'Belum Ada MVP',
    subtitle: 'MVP Terbaru',
    description: maleMvpSource && femaleMvpSource
      ? `MVP terbaru kedua divisi! ${maleMvpSource.gamertag} (♂${isMaleMvpFromHall ? ` W${maleMvpWeek}` : ''}, ${maleMvpSource.totalMvp}x MVP) dan ${femaleMvpSource.gamertag} (♀${isFemaleMvpFromHall ? ` W${femaleMvpWeek}` : ''}, ${femaleMvpSource.totalMvp}x MVP) — performa luar biasa!`
      : maleMvpSource
        ? `MVP terbaru divisi male: ${maleMvpSource.gamertag} dengan ${maleMvpSource.totalMvp}x MVP.`
        : femaleMvpSource
          ? `MVP terbaru divisi female: ${femaleMvpSource.gamertag} dengan ${femaleMvpSource.totalMvp}x MVP.`
          : 'MVP pekan ini akan muncul setelah pertandingan selesai dan pemain terbaik dinobatkan.',
    badge: 'MVP',
    thumbLabel: 'MVP',
    accentColor: '#22c55e',
    accentLight: '#4ade80',
    isDuo: true,
    male: maleMvpSource ? {
      gamertag: maleMvpSource.gamertag,
      imageUrl: getAvatarUrl(maleMvpSource.gamertag, 'male', maleMvpSource.avatar),
      tier: maleMvpSource.tier,
      points: maleMvpSource.points,
      totalWins: maleMvpSource.totalWins,
      streak: maleMvpSource.streak,
      totalMvp: maleMvpSource.totalMvp,
      mvpWeek: maleMvpWeek,
      player: (maleData?.topPlayers?.find(p => p.gamertag === maleMvpSource.gamertag) || maleMvpFallback || maleMvpSource) as TopPlayer & { division?: string },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    female: femaleMvpSource ? {
      gamertag: femaleMvpSource.gamertag,
      imageUrl: getAvatarUrl(femaleMvpSource.gamertag, 'female', femaleMvpSource.avatar),
      tier: femaleMvpSource.tier,
      points: femaleMvpSource.points,
      totalWins: femaleMvpSource.totalWins,
      streak: femaleMvpSource.streak,
      totalMvp: femaleMvpSource.totalMvp,
      mvpWeek: femaleMvpWeek,
      player: (femaleData?.topPlayers?.find(p => p.gamertag === femaleMvpSource.gamertag) || femaleMvpFallback || femaleMvpSource) as TopPlayer & { division?: string },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    maleAccent: '#22c55e',
    femaleAccent: '#ec4899',
    maleAccentLight: '#4ade80',
    femaleAccentLight: '#f472b6',
    isEmpty: mvpIsEmpty,
    mvpWeek: maleMvpWeek || femaleMvpWeek,
    mvpCount: (maleMvpSource?.totalMvp || 0) + (femaleMvpSource?.totalMvp || 0),
    metadata: [
      ...(maleMvpSource ? [{ icon: Award, label: 'MVP ♂', value: `${maleMvpSource.totalMvp}x` }] : []),
      ...(maleMvpSource ? [{ icon: Trophy, label: 'Points ♂', value: `${maleMvpSource.points}` }] : []),
      ...(femaleMvpSource ? [{ icon: Award, label: 'MVP ♀', value: `${femaleMvpSource.totalMvp}x` }] : []),
      ...(femaleMvpSource ? [{ icon: Trophy, label: 'Points ♀', value: `${femaleMvpSource.points}` }] : []),
    ],
  });

  // ─── 5. Streak Terpanjang — Male + Female ───
  const malePlayers = maleData?.topPlayers || [];
  const femalePlayers = femaleData?.topPlayers || [];
  const maleStreakKing = [...malePlayers].sort((a, b) => b.streak - a.streak)[0];
  const femaleStreakKing = [...femalePlayers].sort((a, b) => b.streak - a.streak)[0];
  const hasMaleStreak = maleStreakKing && maleStreakKing.streak >= 2;
  const hasFemaleStreak = femaleStreakKing && femaleStreakKing.streak >= 2;
  const streakIsEmpty = !hasMaleStreak && !hasFemaleStreak;

  items.push({
    id: 'streak',
    type: 'streak',
    title: hasMaleStreak && hasFemaleStreak ? `${maleStreakKing.gamertag} & ${femaleStreakKing.gamertag}` : hasMaleStreak ? maleStreakKing.gamertag : hasFemaleStreak ? femaleStreakKing.gamertag : 'Belum Ada Streak',
    subtitle: 'Streak Terpanjang',
    description: hasMaleStreak && hasFemaleStreak
      ? `Streak ${maleStreakKing.streak}W (${maleStreakKing.gamertag}, ♂) dan ${femaleStreakKing.streak}W (${femaleStreakKing.gamertag}, ♀) — konsistensi luar biasa di kedua divisi!`
      : hasMaleStreak
        ? `Streak ${maleStreakKing.streak} kemenangan berturut-turut di divisi male oleh ${maleStreakKing.gamertag}!`
        : hasFemaleStreak
          ? `Streak ${femaleStreakKing.streak} kemenangan berturut-turut di divisi female oleh ${femaleStreakKing.gamertag}!`
          : 'Pemain dengan streak kemenangan berturut-turut akan muncul di sini. Menangkan 2+ pertandingan berturut-turut untuk memulai streak!',
    badge: 'STREAK',
    thumbLabel: 'Streak',
    accentColor: '#f97316',
    accentLight: '#fb923c',
    isDuo: true,
    male: hasMaleStreak ? {
      gamertag: maleStreakKing.gamertag,
      imageUrl: getAvatarUrl(maleStreakKing.gamertag, 'male', maleStreakKing.avatar),
      tier: maleStreakKing.tier,
      points: maleStreakKing.points,
      totalWins: maleStreakKing.totalWins,
      streak: maleStreakKing.streak,
      player: { ...maleStreakKing, division: 'male' },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    female: hasFemaleStreak ? {
      gamertag: femaleStreakKing.gamertag,
      imageUrl: getAvatarUrl(femaleStreakKing.gamertag, 'female', femaleStreakKing.avatar),
      tier: femaleStreakKing.tier,
      points: femaleStreakKing.points,
      totalWins: femaleStreakKing.totalWins,
      streak: femaleStreakKing.streak,
      player: { ...femaleStreakKing, division: 'female' },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    maleAccent: '#f97316',
    femaleAccent: '#ef4444',
    maleAccentLight: '#fb923c',
    femaleAccentLight: '#f87171',
    isEmpty: streakIsEmpty,
    metadata: [
      ...(hasMaleStreak ? [{ icon: Flame, label: 'Streak ♂', value: `${maleStreakKing.streak}W` }] : []),
      ...(hasMaleStreak ? [{ icon: Trophy, label: 'Points ♂', value: `${maleStreakKing.points}` }] : []),
      ...(hasFemaleStreak ? [{ icon: Flame, label: 'Streak ♀', value: `${femaleStreakKing.streak}W` }] : []),
      ...(hasFemaleStreak ? [{ icon: Trophy, label: 'Points ♀', value: `${femaleStreakKing.points}` }] : []),
    ],
  });

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
    case 'mvp':
      return <Award className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    case 'rank1':
      return <Medal className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    case 'performance':
      return <TrendingUp className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    case 'rank1-club':
      return <Gem className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    case 'streak':
      return <Flame className="w-3.5 h-3.5" style={{ color: accentLight }} />;
    default:
      return <Star className="w-3.5 h-3.5" style={{ color: accentLight }} />;
  }
}

/* ─── Determine watermark text for featured card ─── */
function getWatermarkText(type: HighlightItem['type']): string {
  switch (type) {
    case 'mvp': return 'MVP';
    case 'rank1': return '#1 TARKAM';
    case 'performance': return 'BINTANG';
    case 'rank1-club': return '#1 CLUB';
    case 'streak': return 'STREAK';
    default: return 'TARKAM';
  }
}

/* ─── Determine if this type should show a club logo watermark ─── */
function isClubType(type: HighlightItem['type']): boolean {
  return type === 'rank1-club';
}

/* ─── Duo Avatar Half — Full-bleed cover for one side of duo card ─── */
function DuoAvatarHalf({
  player,
  accent,
  accentLight,
  side,
  type,
}: {
  player: DuoPlayer;
  accent: string;
  accentLight: string;
  side: 'left' | 'right';
  type: HighlightItem['type'];
}) {
  const isEmpty = player.isEmpty;
  const divisionIcon = side === 'left' ? '♂' : '♀';
  const divisionLabel = side === 'left' ? 'Male' : 'Female';

  return (
    <div className="relative flex-1 h-full overflow-hidden">
      {/* Full-bleed avatar — object-cover fills space completely */}
      {player.imageUrl && !isEmpty ? (
        <Image
          src={player.imageUrl}
          alt={player.gamertag}
          fill
          sizes="30vw"
          className="object-cover object-top transition-transform duration-700 group-hover/featured:scale-105"
          style={{
            transform: side === 'left' ? 'scale(1.0) translateX(2%)' : 'scale(1.0) translateX(-2%)',
          }}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(${side === 'left' ? '135' : '225'}deg, ${hexToRgba(accent, 0.2)} 0%, rgba(13,13,26,0.95) 70%)`,
          }}
        >
          <div className="flex flex-col items-center gap-3 opacity-30">
            {type === 'rank1' ? <Medal className="w-14 h-14" style={{ color: accent }} /> :
             type === 'performance' ? <TrendingUp className="w-14 h-14" style={{ color: accent }} /> :
             type === 'streak' ? <Flame className="w-14 h-14" style={{ color: accent }} /> :
             type === 'mvp' ? <Award className="w-14 h-14" style={{ color: accent }} /> :
             <Star className="w-14 h-14" style={{ color: accent }} />}
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: accent }}>
              {divisionLabel}
            </span>
          </div>
        </div>
      )}

      {/* ═══ Multi-layer dramatic overlays ═══ */}
      {/* Heavy bottom fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/30 to-transparent" />
      {/* Strong fade toward center divider */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: side === 'left'
            ? 'linear-gradient(to left, rgba(13,13,26,0.8) 0%, transparent 30%)'
            : 'linear-gradient(to right, rgba(13,13,26,0.8) 0%, transparent 30%)',
        }}
      />
      {/* Top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d1a]/50 via-transparent to-transparent" />
      {/* Colored accent glow — dramatic */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: side === 'left'
            ? `radial-gradient(ellipse at 25% 60%, ${hexToRgba(accent, 0.12)}, transparent 55%)`
            : `radial-gradient(ellipse at 75% 60%, ${hexToRgba(accent, 0.12)}, transparent 55%)`,
        }}
      />

      {/* ═══ Player info at bottom ═══ */}
      {!isEmpty && (
        <div className="absolute bottom-0 inset-x-0 px-4 pb-4 pt-14 z-10" style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.97) 0%, rgba(13,13,26,0.7) 50%, transparent 100%)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: hexToRgba(accent, 0.25), border: `1px solid ${hexToRgba(accent, 0.4)}` }}
            >
              <span className="text-[11px] font-black" style={{ color: accentLight }}>{divisionIcon}</span>
            </div>
            <span className="text-lg sm:text-xl font-black text-white truncate max-w-[150px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              {player.gamertag}
            </span>
          </div>
          <div className="flex items-center gap-3 ml-8">
            <span className="text-[12px] font-bold" style={{ color: accentLight }}>
              {type === 'performance' && player.weeklyPointsGained ? `${player.points}pts (+${player.weeklyPointsGained}W)` : `${player.points}pts`}
            </span>
            <span className="text-[12px] font-bold text-green-400">
              {player.totalWins}W
            </span>
            {player.streak >= 2 && (
              <span className="text-[12px] font-bold text-orange-400 flex items-center gap-0.5">
                <Flame className="w-3.5 h-3.5" />{player.streak}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  const isEmpty = item.isEmpty || false;

  return (
    <button
      onClick={onClick}
      className={`reveal reveal-fade-up reveal-delay-${Math.min(index, 4)} group/thumb relative shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
        isActive ? 'scale-105' : isEmpty ? 'opacity-40 hover:opacity-70' : 'opacity-60 hover:opacity-100'
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
        {item.isDuo ? (
          /* Duo thumbnail: split left/right with different colors */
          <div className="absolute inset-0 flex">
            {/* Male side */}
            <div className="relative w-1/2 h-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${hexToRgba(item.maleAccent, 0.25)} 0%, rgba(13,13,26,0.9) 70%)` }}>
              {item.male?.imageUrl && !item.male.isEmpty ? (
                <Image
                  src={item.male.imageUrl}
                  alt={item.male.gamertag}
                  fill
                  sizes="56px"
                  className="object-cover object-top"
                  style={{ opacity: isActive ? 0.8 : 0.35 }}
                />
              ) : null}
              {/* Dark overlay for inactive */}
              {!isActive && <div className="absolute inset-0 bg-[#0d0d1a]/50" />}
            </div>
            {/* Female side */}
            <div className="relative w-1/2 h-full overflow-hidden" style={{ background: `linear-gradient(225deg, ${hexToRgba(item.femaleAccent, 0.25)} 0%, rgba(13,13,26,0.9) 70%)` }}>
              {item.female?.imageUrl && !item.female.isEmpty ? (
                <Image
                  src={item.female.imageUrl}
                  alt={item.female.gamertag}
                  fill
                  sizes="56px"
                  className="object-cover object-top"
                  style={{ opacity: isActive ? 0.8 : 0.35 }}
                />
              ) : null}
              {!isActive && <div className="absolute inset-0 bg-[#0d0d1a]/50" />}
            </div>
            {/* Center divider line */}
            <div className="absolute top-2 bottom-2 left-1/2 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${hexToRgba('#d4a853', isActive ? 0.4 : 0.15)}, transparent)` }} />
            {/* Division symbols */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] font-black" style={{ color: isActive ? item.maleAccentLight : 'rgba(255,255,255,0.3)', textShadow: `0 0 4px ${hexToRgba(item.maleAccent, 0.3)}` }}>♂</span>
                <span className="text-[8px] font-black" style={{ color: isActive ? item.femaleAccentLight : 'rgba(255,255,255,0.3)', textShadow: `0 0 4px ${hexToRgba(item.femaleAccent, 0.3)}` }}>♀</span>
              </div>
            </div>
          </div>
        ) : item.clubName ? (
          /* Club thumbnail */
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
          /* Empty/gradient thumbnail */
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(item.accentColor, 0.25)} 0%, ${hexToRgba(item.accentColor, 0.05)} 50%, rgba(13,13,26,0.9) 100%)`,
            }}
          />
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a]/80 via-transparent to-transparent" />

        {/* Center icon overlay for non-duo */}
        {!item.isDuo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: hexToRgba(item.accentColor, isActive ? 0.25 : 0.1),
                border: `1px solid ${hexToRgba(item.accentColor, isActive ? 0.5 : 0.2)}`,
                boxShadow: isActive ? `0 0 20px ${hexToRgba(item.accentColor, 0.2)}` : 'none',
              }}
            >
              {item.type === 'rank1-club' ? (
                <Gem className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: isActive ? item.accentLight : item.accentColor }} />
              ) : (
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: isActive ? item.accentLight : item.accentColor }} />
              )}
            </div>
          </div>
        )}

        {/* Active ring glow animation */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 1px ${hexToRgba(item.accentColor, 0.4)}`,
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
        )}

        {/* Streak fire effect */}
        {item.type === 'streak' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-bounce">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
          </div>
        )}

        {/* Rank #1 overlay */}
        {item.type === 'rank1' && (
          <div className="absolute top-1.5 right-1.5 pointer-events-none">
            <span className="text-[9px] font-black" style={{ color: item.accentLight, textShadow: `0 0 8px ${hexToRgba(item.accentColor, 0.5)}` }}>
              #1
            </span>
          </div>
        )}
        {item.type === 'rank1-club' && (
          <div className="absolute top-1.5 right-1.5 pointer-events-none">
            <span className="text-[9px] font-black" style={{ color: item.accentLight, textShadow: `0 0 8px ${hexToRgba(item.accentColor, 0.5)}` }}>
              #1
            </span>
          </div>
        )}

        {/* MVP star icon overlay */}
        {item.type === 'mvp' && (
          <div className="absolute top-1.5 right-1.5 pointer-events-none">
            <Award className="w-3.5 h-3.5" style={{ color: item.accentLight, filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.5))' }} />
          </div>
        )}

        {/* Performance star/sparkle overlay */}
        {item.type === 'performance' && (
          <div className="absolute top-1.5 right-1.5 pointer-events-none">
            <Star className="w-3.5 h-3.5" style={{ color: item.accentLight, filter: 'drop-shadow(0 0 4px rgba(234,179,8,0.5))' }} />
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

  /* ─── Auto-Rotation State ─── */
  const AUTO_ROTATE_INTERVAL = 5000;
  const RESUME_DELAY = 3000;
  const [autoRotateMode, setAutoRotateMode] = useState<'running' | 'paused' | 'resuming'>(highlights.length > 1 ? 'running' : 'paused');

  // Auto-rotation timer
  useEffect(() => {
    if (highlights.length <= 1 || autoRotateMode !== 'running') return;
    const timer = setTimeout(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % highlights.length;
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 800);
        return next;
      });
    }, AUTO_ROTATE_INTERVAL);
    return () => clearTimeout(timer);
  }, [highlights.length, autoRotateMode, activeIdx]);

  // Resume delay timer
  useEffect(() => {
    if (autoRotateMode !== 'resuming') return;
    const timer = setTimeout(() => setAutoRotateMode('running'), RESUME_DELAY);
    return () => clearTimeout(timer);
  }, [autoRotateMode]);

  /* ─── Touch/Swipe State ─── */
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  /* ─── Handle thumbnail click with transition ─── */
  const handleThumbClick = useCallback((idx: number) => {
    setActiveIdx(prev => {
      if (prev === idx) return prev;
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 800);
      return idx;
    });
    setAutoRotateMode('resuming');
  }, []);

  /* ─── 3D tilt hook for featured card ─── */
  const { cardRef, handleMouseMove, handleMouseLeave } = use3DTilt(8);

  /* ─── Section ref ─── */
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
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  }, []);

  /* ─── Touch/Swipe Handlers ─── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;
    setTouchStart(null);
    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return;
    setAutoRotateMode('resuming');
    if (deltaX < 0) {
      setActiveIdx(prev => {
        const next = (prev + 1) % highlights.length;
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 800);
        return next;
      });
    } else {
      setActiveIdx(prev => {
        const prevIdx = (prev - 1 + highlights.length) % highlights.length;
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 800);
        return prevIdx;
      });
    }
  }, [touchStart, highlights.length]);

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

  return (
    <section
      id="highlights"
      ref={sectionRef}
      role="region"
      aria-label="Highlights"
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
      onMouseEnter={() => setAutoRotateMode('paused')}
      onMouseLeave={() => setAutoRotateMode('resuming')}
    >
      {/* ═══ Background Layers ═══ */}
      <div className="absolute inset-0 bg-[#0d0d1a]" />
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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.08) 0%, transparent 55%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 15% 50%, ${hexToRgba(active?.accentColor || '#06b6d4', 0.05)} 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, ${hexToRgba(active?.femaleAccent || '#a855f7', 0.05)} 0%, transparent 45%)`,
        }}
      />
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
                  className="perspective-card relative rounded-2xl overflow-hidden border transition-all duration-500 group/featured"
                  style={{
                    borderColor: hexToRgba(active.accentColor, 0.2),
                    minHeight: '480px',
                    height: '100%',
                    transition: 'transform 0.15s ease-out, border-color 0.3s, box-shadow 0.3s',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Shimmer effect during transition */}
                  <ShimmerOverlay accentColor={active.accentColor} visible={isTransitioning} />

                  {active.isDuo ? (
                    /* ═══ DUO FEATURED CARD ═══ */
                    <>
                      {/* Dual background gradient — subtle base behind avatars */}
                      <div className="absolute inset-0">
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(active.maleAccent, 0.08)} 0%, rgba(13,13,26,0.95) 50%)` }} />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(225deg, ${hexToRgba(active.femaleAccent, 0.08)} 0%, rgba(13,13,26,0.95) 50%)` }} />
                      </div>

                      {/* Gold grid texture overlay */}
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

                      {/* Large watermark text */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
                        <span
                          className="text-5xl sm:text-7xl font-black uppercase tracking-widest select-none"
                          style={{ color: 'rgba(212,168,83,0.03)', WebkitTextStroke: '1px rgba(212,168,83,0.05)' }}
                        >
                          {getWatermarkText(active.type)}
                        </span>
                      </div>

                      {/* ═══ DUO AVATAR LAYOUT — Full-bleed cover each side ═══ */}
                      <div className="absolute inset-0 z-10 flex">
                        {/* Male side — full-bleed avatar */}
                        <DuoAvatarHalf
                          player={active.male!}
                          accent={active.maleAccent}
                          accentLight={active.maleAccentLight}
                          side="left"
                          type={active.type}
                        />

                        {/* ═══ Center Divider — Bold gold line ═══ */}
                        <div className="relative flex flex-col items-center justify-center shrink-0 z-20" style={{ width: '3px' }}>
                          {/* Full-height gold line */}
                          <div className="absolute inset-0" style={{
                            background: `linear-gradient(to bottom, transparent 5%, ${hexToRgba('#d4a853', 0.6)} 20%, #d4a853 50%, ${hexToRgba('#d4a853', 0.6)} 80%, transparent 95%)`,
                            boxShadow: `0 0 12px ${hexToRgba('#d4a853', 0.4)}, 0 0 24px ${hexToRgba('#d4a853', 0.15)}`,
                          }} />
                          {/* Center Crown ornament */}
                          <div
                            className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10"
                            style={{
                              backgroundColor: '#0d0d1a',
                              border: '2px solid #d4a853',
                              boxShadow: `0 0 20px ${hexToRgba('#d4a853', 0.4)}, inset 0 0 8px ${hexToRgba('#d4a853', 0.1)}`,
                            }}
                          >
                            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a853]" />
                          </div>
                          {/* Accent dots above and below crown */}
                          <div className="absolute top-[22%] w-2.5 h-2.5 rounded-full z-10" style={{ backgroundColor: active.maleAccent, boxShadow: `0 0 8px ${hexToRgba(active.maleAccent, 0.6)}` }} />
                          <div className="absolute bottom-[22%] w-2.5 h-2.5 rounded-full z-10" style={{ backgroundColor: active.femaleAccent, boxShadow: `0 0 8px ${hexToRgba(active.femaleAccent, 0.6)}` }} />
                        </div>

                        {/* Female side — full-bleed avatar */}
                        <DuoAvatarHalf
                          player={active.female!}
                          accent={active.femaleAccent}
                          accentLight={active.femaleAccentLight}
                          side="right"
                          type={active.type}
                        />
                      </div>

                      {/* Badge overlay — top right */}
                      <div className="absolute top-4 right-4 z-20">
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                          style={{
                            background: `linear-gradient(135deg, ${hexToRgba(active.maleAccent, 0.3)}, ${hexToRgba(active.femaleAccent, 0.3)})`,
                            borderColor: hexToRgba(active.accentColor, 0.4),
                          }}
                        >
                          {getBadgeIcon(active.type, active.accentLight)}
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: active.accentLight }}>
                            {active.badge}
                          </span>
                        </div>
                      </div>

                      {/* Rank #1 / Performance / MVP / Streak badge overlay — top left */}
                      <div className="absolute top-4 left-4 z-20 pointer-events-none">
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, ${hexToRgba(active.maleAccent, 0.25)}, ${hexToRgba(active.femaleAccent, 0.25)})`,
                            border: `1px solid ${hexToRgba('#d4a853', 0.3)}`,
                            animation: 'pulse-glow 2s ease-in-out infinite',
                          }}
                        >
                          {active.type === 'rank1' && <Medal className="w-4 h-4 text-[#d4a853]" />}
                          {active.type === 'performance' && <TrendingUp className="w-4 h-4 text-[#d4a853]" />}
                          {active.type === 'streak' && <Flame className="w-4 h-4 text-[#d4a853]" />}
                          {active.type === 'mvp' && <Award className="w-4 h-4 text-[#d4a853]" />}
                          <span className="text-[11px] font-black text-[#d4a853]">
                            {active.type === 'rank1' ? 'PERINGKAT #1' : active.type === 'performance' ? 'PERFORMA TERBAIK' : active.type === 'streak' ? 'STREAK TERPANJANG' : 'MVP TERBARU'}
                          </span>
                        </div>
                      </div>

                      {/* Streak fire effects */}
                      {active.type === 'streak' && (
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

                      {/* Bottom info bar */}
                      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-7 z-10">
                        <div
                          className="h-px w-full mb-3"
                          style={{ background: `linear-gradient(to right, ${hexToRgba(active.maleAccent, 0.3)}, ${hexToRgba('#d4a853', 0.2)}, ${hexToRgba(active.femaleAccent, 0.3)})` }}
                        />
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${hexToRgba(active.maleAccent, 0.2)}, ${hexToRgba(active.femaleAccent, 0.2)})`,
                              border: `1px solid ${hexToRgba('#d4a853', 0.25)}`,
                              boxShadow: `0 0 20px ${hexToRgba('#d4a853', 0.1)}`,
                            }}
                          >
                            {active.type === 'rank1' ? <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a853]" /> :
                             active.type === 'performance' ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a853]" /> :
                             active.type === 'streak' ? <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a853]" /> :
                             active.type === 'mvp' ? <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a853]" /> :
                             <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a853]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#d4a853]">
                              {active.subtitle}
                            </p>
                            <h3
                              className="text-xl sm:text-2xl font-black text-white leading-tight truncate"
                              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
                            >
                              {active.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ═══ SOLO FEATURED CARD (Club) ═══ */
                    <>
                      {/* Featured Image / Gradient BG */}
                      {active.imageUrl ? (
                        <Image
                          src={active.imageUrl}
                          alt={active.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          className="object-contain object-center transition-transform duration-700 group-hover/featured:scale-105 bg-[#0d0d1a]"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${hexToRgba(active.accentColor, 0.12)} 0%, #0d0d1a 30%, ${hexToRgba(active.accentColor, 0.06)} 60%, #0d0d1a 100%)`,
                          }}
                        />
                      )}

                      {/* Multi-layer overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d1a]/50 via-transparent to-transparent" />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: `radial-gradient(ellipse at 80% 70%, ${hexToRgba(active.accentColor, 0.1)}, transparent 60%)` }}
                      />

                      {/* Gold grid texture overlay */}
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
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: active.accentLight }}>
                            {active.badge}
                          </span>
                        </div>
                      </div>

                      {/* Club Logo watermark */}
                      {isClubType(active.type) && active.clubName && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                          <div
                            className="w-36 h-36 sm:w-48 sm:h-48 rounded-3xl overflow-hidden opacity-10 group-hover/featured:opacity-15 transition-opacity duration-500"
                            style={{ filter: `drop-shadow(0 0 40px ${hexToRgba(active.accentColor, 0.3)})` }}
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

                      {/* #1 Club badge overlay */}
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
                            <span className="text-[11px] font-black text-idm-gold-warm">#1 CLUB TARKAM</span>
                          </div>
                        </div>
                      )}

                      {/* Large watermark text */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
                        <span
                          className="text-6xl sm:text-8xl font-black uppercase tracking-widest select-none"
                          style={{ color: 'rgba(212,168,83,0.03)', WebkitTextStroke: '1px rgba(212,168,83,0.05)' }}
                        >
                          {getWatermarkText(active.type)}
                        </span>
                      </div>

                      {/* Bottom info bar on featured card */}
                      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-7 z-10">
                        <div
                          className="h-px w-full mb-4"
                          style={{ background: `linear-gradient(to right, ${hexToRgba(active.accentColor, 0.4)}, transparent 60%)` }}
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
                              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
                            >
                              {active.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ═══ Swipe Navigation Arrows ═══ */}
                  {highlights.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIdx(prev => {
                            const prevIdx = (prev - 1 + highlights.length) % highlights.length;
                            setIsTransitioning(true);
                            setTimeout(() => setIsTransitioning(false), 800);
                            return prevIdx;
                          });
                          setAutoRotateMode('resuming');
                        }}
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer md:opacity-0 md:group-hover/featured:opacity-100 swipe-arrow-left"
                        style={{
                          backgroundColor: hexToRgba(active.accentColor, 0.25),
                          border: `1px solid ${hexToRgba(active.accentColor, 0.35)}`,
                          backdropFilter: 'blur(8px)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = hexToRgba(active.accentColor, 0.4);
                          e.currentTarget.style.boxShadow = `0 0 16px ${hexToRgba(active.accentColor, 0.3)}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = hexToRgba(active.accentColor, 0.25);
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        aria-label="Previous highlight"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: active.accentLight }} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIdx(prev => {
                            const next = (prev + 1) % highlights.length;
                            setIsTransitioning(true);
                            setTimeout(() => setIsTransitioning(false), 800);
                            return next;
                          });
                          setAutoRotateMode('resuming');
                        }}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer md:opacity-0 md:group-hover/featured:opacity-100 swipe-arrow-right"
                        style={{
                          backgroundColor: hexToRgba(active.accentColor, 0.25),
                          border: `1px solid ${hexToRgba(active.accentColor, 0.35)}`,
                          backdropFilter: 'blur(8px)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = hexToRgba(active.accentColor, 0.4);
                          e.currentTarget.style.boxShadow = `0 0 16px ${hexToRgba(active.accentColor, 0.3)}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = hexToRgba(active.accentColor, 0.25);
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        aria-label="Next highlight"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: active.accentLight }} />
                      </button>

                      {/* Mobile swipe hint */}
                      <div
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 md:hidden swipe-hint-text"
                        aria-hidden="true"
                      >
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                          style={{
                            backgroundColor: hexToRgba(active.accentColor, 0.15),
                            border: `1px solid ${hexToRgba(active.accentColor, 0.2)}`,
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          <ChevronLeft className="w-3 h-3" style={{ color: active.accentLight, animation: 'swipe-hint-left 1.5s ease-in-out infinite' }} />
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: active.accentLight }}>Geser</span>
                          <ChevronRight className="w-3 h-3" style={{ color: active.accentLight, animation: 'swipe-hint-right 1.5s ease-in-out infinite' }} />
                        </div>
                      </div>
                    </>
                  )}

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
                      background: active.isDuo
                        ? `linear-gradient(to right, ${active.maleAccent}, ${hexToRgba('#d4a853', 0.5)}, ${active.femaleAccent})`
                        : `linear-gradient(to right, transparent, ${active.accentColor}, transparent)`,
                    }}
                  />

                  <div className="relative z-10 p-5 sm:p-7 flex flex-col flex-1">
                    {/* Gold label with decorative lines */}
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="h-px flex-1"
                        style={{ background: `linear-gradient(to right, transparent, ${hexToRgba(active.accentColor, 0.3)})` }}
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
                        style={{ background: `linear-gradient(to left, transparent, ${hexToRgba(active.accentColor, 0.3)})` }}
                      />
                    </div>

                    {/* Title in gold gradient text */}
                    <h3
                      className={`text-2xl sm:text-3xl font-black leading-tight mb-1 ${active.isEmpty ? 'opacity-50' : ''}`}
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

                    {/* Metadata — empty state or data */}
                    {active.isEmpty ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                          style={{ backgroundColor: hexToRgba(active.accentColor, 0.1), border: `1px solid ${hexToRgba(active.accentColor, 0.15)}` }}
                        >
                          {active.type === 'streak' ? (
                            <Flame className="w-7 h-7" style={{ color: active.accentColor, opacity: 0.4 }} />
                          ) : active.type === 'mvp' ? (
                            <Award className="w-7 h-7" style={{ color: active.accentColor, opacity: 0.4 }} />
                          ) : active.type === 'performance' ? (
                            <TrendingUp className="w-7 h-7" style={{ color: active.accentColor, opacity: 0.4 }} />
                          ) : (
                            <Medal className="w-7 h-7" style={{ color: active.accentColor, opacity: 0.4 }} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground/60 mb-1">Belum ada data</p>
                        <p className="text-xs text-muted-foreground/40 max-w-[200px]">{active.description}</p>
                      </div>
                    ) : (
                    <>
                      {/* Duo stats layout — two columns for male/female */}
                      {active.isDuo && !active.isEmpty ? (
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          {/* Male stats column */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: hexToRgba(active.maleAccent, 0.15) }}>
                                <span className="text-[9px] font-black" style={{ color: active.maleAccentLight }}>♂</span>
                              </div>
                              <span className="text-[11px] font-bold text-white truncate">{active.male?.gamertag || '—'}</span>
                            </div>
                            <div className="space-y-2">
                              {active.male && !active.male.isEmpty && (
                                <>
                                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tier</span>
                                    <span className="text-[11px] font-bold text-white">{active.male.tier || '—'}</span>
                                  </div>
                                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</span>
                                    <span className="text-[11px] font-bold" style={{ color: active.maleAccentLight }}>{active.male.points}</span>
                                  </div>
                                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Wins</span>
                                    <span className="text-[11px] font-bold text-white">{active.male.totalWins}</span>
                                  </div>
                                  {active.type === 'performance' && active.male.weeklyPointsGained != null && (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Weekly Pts</span>
                                      <span className="text-[11px] font-bold" style={{ color: active.maleAccentLight }}>+{active.male.weeklyPointsGained}</span>
                                    </div>
                                  )}
                                  {active.type === 'streak' && active.male.streak >= 2 && (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</span>
                                      <span className="text-[11px] font-bold text-orange-400">{active.male.streak}W</span>
                                    </div>
                                  )}
                                  {active.type === 'mvp' && active.male.totalMvp && (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">MVP</span>
                                      <span className="text-[11px] font-bold" style={{ color: active.maleAccentLight }}>{active.male.totalMvp}x</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Female stats column */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: hexToRgba(active.femaleAccent, 0.15) }}>
                                <span className="text-[9px] font-black" style={{ color: active.femaleAccentLight }}>♀</span>
                              </div>
                              <span className="text-[11px] font-bold text-white truncate">{active.female?.gamertag || '—'}</span>
                            </div>
                            <div className="space-y-2">
                              {active.female && !active.female.isEmpty && (
                                <>
                                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tier</span>
                                    <span className="text-[11px] font-bold text-white">{active.female.tier || '—'}</span>
                                  </div>
                                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</span>
                                    <span className="text-[11px] font-bold" style={{ color: active.femaleAccentLight }}>{active.female.points}</span>
                                  </div>
                                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Wins</span>
                                    <span className="text-[11px] font-bold text-white">{active.female.totalWins}</span>
                                  </div>
                                  {active.type === 'performance' && active.female.weeklyPointsGained != null && (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Weekly Pts</span>
                                      <span className="text-[11px] font-bold" style={{ color: active.femaleAccentLight }}>+{active.female.weeklyPointsGained}</span>
                                    </div>
                                  )}
                                  {active.type === 'streak' && active.female.streak >= 2 && (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</span>
                                      <span className="text-[11px] font-bold text-orange-400">{active.female.streak}W</span>
                                    </div>
                                  )}
                                  {active.type === 'mvp' && active.female.totalMvp && (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">MVP</span>
                                      <span className="text-[11px] font-bold" style={{ color: active.femaleAccentLight }}>{active.female.totalMvp}x</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Solo stats layout (for club) */
                        <div className="space-y-3 mb-5">
                          {active.metadata.map((meta, i) => {
                            const MetaIcon = meta.icon;
                            return (
                              <div
                                key={`${meta.label}-${i}`}
                                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-200 hover:bg-white/[0.03]"
                                style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
                              >
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: hexToRgba(active.accentColor, 0.12) }}
                                >
                                  <MetaIcon className="w-3.5 h-3.5" style={{ color: active.accentColor }} />
                                </div>
                                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{meta.label}</span>
                                <span className="ml-auto text-sm font-bold text-white">{meta.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Separator */}
                      <div
                        className="h-px mb-5"
                        style={{ background: `linear-gradient(to right, transparent, ${hexToRgba(active.accentColor, 0.2)}, transparent)` }}
                      />

                      {/* Description */}
                      <p className="text-[13px] text-[#a09880] leading-relaxed mb-6 flex-1">
                        {active.description}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-auto">
                        {active.isDuo && !active.isEmpty && (
                          <>
                            {active.male && !active.male.isEmpty && active.male.player?.gamertag && (
                              <button
                                onClick={() => {
                                  if (active.male?.player?.gamertag) setSelectedPlayer({ ...active.male.player, division: 'male' });
                                }}
                                className="tap-scale flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                                style={{
                                  backgroundColor: hexToRgba(active.maleAccent, 0.15),
                                  color: active.maleAccentLight,
                                  border: `1px solid ${hexToRgba(active.maleAccent, 0.3)}`,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = hexToRgba(active.maleAccent, 0.25);
                                  e.currentTarget.style.boxShadow = `0 0 20px ${hexToRgba(active.maleAccent, 0.15)}`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = hexToRgba(active.maleAccent, 0.15);
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>♂ Detail</span>
                              </button>
                            )}
                            {active.female && !active.female.isEmpty && active.female.player?.gamertag && (
                              <button
                                onClick={() => {
                                  if (active.female?.player?.gamertag) setSelectedPlayer({ ...active.female.player, division: 'female' });
                                }}
                                className="tap-scale flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                                style={{
                                  backgroundColor: hexToRgba(active.femaleAccent, 0.15),
                                  color: active.femaleAccentLight,
                                  border: `1px solid ${hexToRgba(active.femaleAccent, 0.3)}`,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = hexToRgba(active.femaleAccent, 0.25);
                                  e.currentTarget.style.boxShadow = `0 0 20px ${hexToRgba(active.femaleAccent, 0.15)}`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = hexToRgba(active.femaleAccent, 0.15);
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>♀ Detail</span>
                              </button>
                            )}
                          </>
                        )}
                        {!active.isDuo && onVideoPlay && highlightsVideoUrl && (
                          <button
                            onClick={() => {
                              onVideoPlay(highlightsVideoUrl, `${active.title} — Tarkam IDM Highlight`);
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
                    </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Thumbnail Selector Row ═══ */}
        {highlights.length > 1 && (
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center gap-3 mb-4">
              <ChevronRight className="w-4 h-4 text-idm-gold-warm/60" />
              <span className="text-[11px] font-bold text-idm-gold-warm/60 uppercase tracking-widest">Pilih Highlight</span>
              <div className="h-px flex-1 bg-gradient-to-r from-idm-gold-warm/10 to-transparent" />
              <span className="text-[11px] font-medium text-muted-foreground/40 tabular-nums">{activeIdx + 1} / {highlights.length}</span>
            </div>

            <div className="relative group/scroll">
              {canScrollLeft && (
                <button
                  onClick={() => scrollThumbs('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0d0d1a]/90 border border-idm-gold-warm/20 flex items-center justify-center transition-all duration-200 hover:bg-[#0d0d1a] hover:border-idm-gold-warm/40 cursor-pointer opacity-0 group-hover/scroll:opacity-100"
                  aria-label="Scroll thumbnails left"
                >
                  <ChevronLeft className="w-4 h-4 text-idm-gold-warm" />
                </button>
              )}
              {canScrollRight && (
                <button
                  onClick={() => scrollThumbs('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0d0d1a]/90 border border-idm-gold-warm/20 flex items-center justify-center transition-all duration-200 hover:bg-[#0d0d1a] hover:border-idm-gold-warm/40 cursor-pointer opacity-0 group-hover/scroll:opacity-100"
                  aria-label="Scroll thumbnails right"
                >
                  <ChevronRight className="w-4 h-4 text-idm-gold-warm" />
                </button>
              )}
              {canScrollLeft && <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 z-10 pointer-events-none bg-gradient-to-r from-[#0d0d1a] to-transparent" />}
              {canScrollRight && <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 z-10 pointer-events-none bg-gradient-to-l from-[#0d0d1a] to-transparent" />}

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

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {highlights.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleThumbClick(idx)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${idx === activeIdx ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5 hover:w-2 hover:h-2'}`}
                  style={{
                    backgroundColor: idx === activeIdx ? item.accentColor : 'rgba(255,255,255,0.25)',
                    boxShadow: idx === activeIdx ? `0 0 8px ${hexToRgba(item.accentColor, 0.5)}` : 'none',
                  }}
                  aria-label={`Go to highlight ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Decorative ambient particles ═══ */}
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
