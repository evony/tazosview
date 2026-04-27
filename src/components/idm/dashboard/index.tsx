'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
/* framer-motion removed — using CSS animations for performance */
import Image from 'next/image';
import {
  Heart, MapPin, Users, Trophy, Flame,
  Shield, Music,
  Gift,
  BarChart3, Calendar, Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CasinoHeroSkeleton,
  StatsRowSkeleton,
  MatchRowSkeleton,
  TableSkeleton,
} from '../ui/skeleton';
import { PlayerProfile } from '../player-profile';
import { ClubProfile } from '../club-profile';
import { ParticipantGrid } from '../participant-grid';
import { StatusBadge } from '../status-badge';
import { ShareButton } from '../ui/share-button';
import React, { useState, useMemo } from 'react';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency, formatCurrencyShort, clubToString } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

import { NoSeasonState } from './no-season-state';
import { NoTournamentState } from './no-tournament-state';
import { OverviewTab } from './overview-tab';
import { StandingsTab } from './standings-tab';
import { MatchesTab } from './matches-tab';
import { DonationModal } from '../donation-modal';
import { ActivityFeed } from '../activity-feed';
import { StatsTab } from './stats-tab';
import { QuickStatsBar } from './quick-stats-bar';
import { TopDonorsWidget } from './top-donors-widget';
import { DivisionRivalryWidget } from './division-rivalry-widget';
import { LiveMatchCounter } from './live-match-counter';
import { LiveMatchIndicator } from './live-match-indicator';
import { StreakWidget } from './streak-widget';
import { MatchResultsSummary } from './match-results-summary';
import { TopPlayersSection } from './top-players-section';
import { DanceMatchCard } from '../match-card';

/* ─── Main Dashboard Component ─── */
export function Dashboard() {
  const { division, initialDashboardTab, setInitialDashboardTab } = useAppStore();
  const dt = useDivisionTheme();
  const isMobile = useIsMobile();

  const [selectedPlayer, setSelectedPlayer] = useState<StatsData['topPlayers'][0] | null>(null);

  // Track recently viewed players
  const handleSelectPlayer = (player: any) => {
    // Normalize club to string before setting state & saving
    // (search API returns {id, name, logo} but we need string)
    const normalizedPlayer = {
      ...player,
      club: clubToString(player.club) || undefined,
    };
    setSelectedPlayer(normalizedPlayer);
  };
  const [selectedClub, setSelectedClub] = useState<StatsData['clubs'][0] | null>(null);
  const [donationOpen, setDonationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // If we were navigated here with an initial tab, use it
    return initialDashboardTab || 'overview';
  });

  // Clear the initialDashboardTab once consumed
  React.useEffect(() => {
    if (initialDashboardTab) {
      setActiveTab(initialDashboardTab);
      // Clear after a tick so the tab has time to activate
      const timer = setTimeout(() => setInitialDashboardTab(null), 100);
      return () => clearTimeout(timer);
    }
  }, [initialDashboardTab, setInitialDashboardTab]);

  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ['stats', division],
    queryFn: async () => {
      const res = await fetch(`/api/stats?division=${division}`);
      return res.json();
    },
  });

  // CMS settings for donation modal payment info
  const { data: cms } = useQuery<Record<string, string>>({
    queryKey: ['cms-settings'],
    queryFn: async () => {
      const res = await fetch('/api/cms/content');
      if (!res.ok) return {};
      const json = await res.json();
      return json.settings || {};
    },
  });

  /* Group matches by week for the Matches tab */
  const recentMatches = data?.recentMatches ?? [];
  const upcomingMatches = data?.upcomingMatches ?? [];

  const matchesByWeek = useMemo(() => {
    if (recentMatches.length === 0) return {} as Record<number, StatsData['recentMatches']>;
    return recentMatches.reduce((acc, m) => {
      if (!acc[m.week]) acc[m.week] = [];
      acc[m.week].push(m);
      return acc;
    }, {} as Record<number, StatsData['recentMatches']>);
  }, [recentMatches]);

  const upcomingByWeek = useMemo(() => {
    if (upcomingMatches.length === 0) return {} as Record<number, StatsData['upcomingMatches']>;
    return upcomingMatches.reduce((acc, m) => {
      if (!acc[m.week]) acc[m.week] = [];
      acc[m.week].push(m);
      return acc;
    }, {} as Record<number, StatsData['upcomingMatches']>);
  }, [upcomingMatches]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <CasinoHeroSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="flex items-center justify-center rounded-xl border border-border/50 bg-card/60 p-3">
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
          <div className="p-3 rounded-xl border border-border/50 bg-card/60 space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
        <StatsRowSkeleton count={4} />
        <div className="border-b border-border">
          <div className="flex items-center gap-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-none" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <MatchRowSkeleton count={3} />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card/60 p-3 space-y-2">
                <Skeleton className="h-16 w-16 mx-auto rounded-xl" />
                <Skeleton className="h-3 w-16 mx-auto rounded" />
                <Skeleton className="h-2 w-10 mx-auto rounded" />
              </div>
            ))}
          </div>
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  /* ─── Level 1: No Season at all ─── */
  if (!data?.hasData) {
    return <NoSeasonState division={division} />;
  }

  const t = data.activeTournament;

  /* ─── Level 2: Season exists but no active tournament ─── */
  const hasTournament = !!t;

  if (!hasTournament) {
    return <NoTournamentState data={data} setSelectedPlayer={handleSelectPlayer} />;
  }

  return (
    <>
    <div className="space-y-3 sm:space-y-4">

      {/* ========== HERO BANNER — Premium Desktop + Compact Mobile ========== */}
      <div className={`stagger-item-subtle stagger-d0 relative rounded-xl sm:rounded-2xl overflow-hidden ${dt.casinoCard} min-h-[220px] sm:min-h-[260px] lg:min-h-[340px] ${!isMobile ? 'casino-shimmer' : ''}`}>
        <div className={dt.casinoBar} />
        <div className="absolute inset-0">
          <Image src={division === 'male' ? '/bg-male.jpg' : '/bg-female.jpg'} alt="" fill sizes="100vw" className={`object-cover ${division === 'male' ? 'object-[center_25%]' : ''}`} aria-hidden="true" />
        </div>
        <div className="casino-img-overlay" />
        {/* Decorative blur orbs — hidden on mobile for performance */}
        <div className={`hidden lg:block absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl ${dt.bg} opacity-30 lg:opacity-40`} />
        <div className={`hidden lg:block absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full blur-3xl ${dt.bg} opacity-20`} />
        <div className={`absolute top-3 left-3 ${dt.cornerAccent}`} />
        <div className={`absolute top-3 right-3 rotate-90 ${dt.cornerAccent}`} />
        {/* Bottom corner accents — desktop only */}
        <div className={`hidden lg:block absolute bottom-3 left-3 rotate-180 ${dt.cornerAccent}`} />
        <div className={`hidden lg:block absolute bottom-3 right-3 rotate-270 ${dt.cornerAccent}`} />
        {/* Content — spacious 2-zone layout: Left zone (info) | Right zone (status + prize + sawer) */}
        <div className="absolute inset-0 z-10 flex">
          {/* ─── LEFT ZONE: Badges → Title → Info chips ─── */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 min-w-0">
            {/* Top: Badges (mobile: + Status + Prize) */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Badge className={`${dt.casinoBadge} px-2 py-0.5 text-[9px] sm:text-[10px]`}>
                  🐉 Season {data.season?.number || 1}
                </Badge>
                <Badge className={`${dt.casinoBadge} px-2 py-0.5 text-[9px] sm:text-[10px]`}>
                  {division === 'male' ? '🕺 Male' : '💃 Female'}
                </Badge>
              </div>
              {/* Mobile-only: Status + Share + Prize in top-right */}
              <div className="flex sm:hidden flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <ShareButton
                    title={t?.name || 'IDM League'}
                    description={`Week ${t?.weekNumber || '-'} — ${division === 'male' ? 'Male' : 'Female'} Division`}
                    variant="icon"
                  />
                  <StatusBadge status={t?.status || 'registration'} />
                </div>
                <span className="px-2.5 py-1 rounded bg-black/60 text-xs font-bold text-idm-gold-warm">💰 {formatCurrencyShort(t?.prizePool || data.totalPrizePool)}</span>
              </div>
            </div>

            {/* Title — pushed up close to badges on desktop */}
            <div className="mt-2 sm:mt-3 lg:mt-4">
              <h2 className={`text-lg sm:text-3xl lg:text-5xl font-black ${dt.neonGradient} leading-tight tracking-tight`}>{t?.name || 'IDM League Babak'}</h2>
              <p className="text-[10px] sm:text-xs lg:text-base text-muted-foreground mt-1.5">{data.season?.name}</p>
            </div>

            {/* Bottom info chips — 2-row layout on desktop, flex-wrap on mobile */}
            <div className="mt-auto pt-3 sm:pt-4">
              {/* Row 1: Tournament format — Week, Format, Location */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:gap-3">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-0 sm:py-0 rounded sm:rounded-none bg-black/30 sm:bg-transparent text-[9px] sm:text-xs lg:text-sm text-white/80"><Flame className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${dt.neonText}`} />Week {t?.weekNumber || 5}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-0 sm:py-0 rounded sm:rounded-none bg-black/30 sm:bg-transparent text-[9px] sm:text-xs lg:text-sm text-white/80"><Trophy className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${dt.neonText}`} />{t?.format === 'group_stage' ? 'Group + Playoff' : t?.format === 'double_elimination' ? 'Double Elim.' : 'Single Elim.'}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-0 sm:py-0 rounded sm:rounded-none bg-black/30 sm:bg-transparent text-[9px] sm:text-xs lg:text-sm text-white/80"><MapPin className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${dt.neonText}`} />{t?.location || 'Online'}</span>
              </div>
              {/* Row 2: Schedule — Date, Time, BPM, Match count */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:gap-3 mt-1.5 sm:mt-2">
                {t?.scheduledAt && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-0 sm:py-0 rounded sm:rounded-none bg-black/30 sm:bg-transparent text-[9px] sm:text-xs lg:text-sm text-white/80"><Calendar className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${dt.neonText}`} />{new Date(t.scheduledAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
                {t?.scheduledAt && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-0 sm:py-0 rounded sm:rounded-none bg-black/30 sm:bg-transparent text-[9px] sm:text-xs lg:text-sm text-white/80"><Clock className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${dt.neonText}`} />{new Date(t.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
                {t?.bpm && <span className="hidden sm:inline-flex items-center gap-1 text-xs lg:text-sm text-white/70"><Heart className="w-3 h-3 lg:w-4 lg:h-4 text-red-400 live-dot" />{t.bpm} BPM</span>}
                <span className="hidden sm:inline-flex items-center gap-1 text-xs lg:text-sm text-white/70"><Music className={`w-3 h-3 lg:w-4 lg:h-4 ${dt.neonText}`} />{t?.matches?.length || recentMatches.length} Match</span>
              </div>
            </div>
          </div>

          {/* ─── RIGHT ZONE (Desktop): Status → Prize → Sawer ─── */}
          <div className="hidden sm:flex flex-col items-stretch justify-between w-[150px] lg:w-[220px] shrink-0 border-l border-white/10 p-4 lg:p-6 gap-3">
            {/* Top row: Share + Status — aligned left */}
            <div className="flex items-center gap-2">
              <ShareButton
                title={t?.name || 'IDM League'}
                description={`Week ${t?.weekNumber || '-'} — ${division === 'male' ? 'Male' : 'Female'} Division`}
                variant="icon"
              />
              <StatusBadge status={t?.status || 'registration'} />
            </div>

            {/* Center: Prize Pool — emphasized */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[10px] lg:text-xs text-white/40 uppercase tracking-[0.2em] font-semibold">Prize Pool</p>
              <p className="px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl bg-black/60 text-base lg:text-2xl font-black text-idm-gold-warm drop-shadow-[0_0_16px_rgba(229,190,74,0.45)] whitespace-nowrap">{formatCurrency(t?.prizePool || data.totalPrizePool)}</p>
            </div>

            {/* Bottom: Sawer Button — full width */}
            <button
              onClick={() => setDonationOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(229,190,74,0.3)] active:scale-95 transition-all cursor-pointer min-h-[40px] lg:min-h-[44px]"
            >
              <Gift className="w-4 h-4 lg:w-5 lg:h-5" />
              Sawer
            </button>
          </div>
        </div>

        {/* Mobile-only: Sawer button bottom-right */}
        <div className="sm:hidden absolute bottom-0 right-0 z-20 p-3">
          <button
            onClick={() => setDonationOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:opacity-90 transition-opacity cursor-pointer min-h-[28px]"
          >
            <Gift className="w-3 h-3" />
            Sawer
          </button>
        </div>
      </div>

      {/* ========== TAB BAR — Moved up immediately after hero ========== */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className={`border-b ${dt.border}`}>
            <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
              {[
                { value: 'overview', label: 'Beranda', icon: Trophy },
                { value: 'matches', label: 'Pertandingan', icon: Music },
                { value: 'standings', label: 'Peringkat', icon: Shield },
                { value: 'participants', label: 'Peserta', icon: Users },
                { value: 'stats', label: 'Statistik', icon: BarChart3 },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`relative px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:shadow-none ${division === 'male' ? 'data-[state=active]:text-idm-male' : 'data-[state=active]:text-idm-female'} text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap`}
                >
                  <tab.icon className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* ═══════════════ OVERVIEW TAB — Now includes moved widgets ═══════════════ */}
        <TabsContent value="overview" className="mt-3 sm:mt-4 lg:mt-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Quick Stats Bar */}
          <QuickStatsBar data={data} division={division} />

          {/* Live Match Indicator */}
          <div className="stagger-item-subtle stagger-d0">
            <LiveMatchIndicator />
          </div>

          {/* Live Match Counter */}
          <LiveMatchCounter />

          {/* Top Players — right below match status */}
          <TopPlayersSection data={data} division={division} setSelectedPlayer={handleSelectPlayer} />

          {/* Activity Feed + Top Donors — side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 stagger-item-subtle stagger-d2">
            <ActivityFeed />
            <TopDonorsWidget onDonate={() => setDonationOpen(true)} />
          </div>

          {/* Featured Match — above Division Rivalry */}
          {t?.matches?.filter(m => m.status === 'completed').length ? (
            <div className="stagger-item-subtle stagger-d2">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg ${dt.iconBg} flex items-center justify-center shrink-0`}>
                  <Music className={`w-3.5 h-3.5 ${dt.neonText}`} />
                </div>
                <h3 className="text-sm font-semibold">Match Unggulan</h3>
                <Badge className={`${dt.casinoBadge} ml-auto`}>HASIL</Badge>
              </div>
              {t.matches.filter(m => m.status === 'completed').slice(-1).map(m => (
                <DanceMatchCard
                  key={m.id}
                  team1={m.team1}
                  team2={m.team2}
                  score1={m.score1}
                  score2={m.score2}
                  status={m.status}
                  week={t.weekNumber}
                  mvpPlayer={m.mvpPlayer}
                />
              ))}
            </div>
          ) : null}

          {/* Division Rivalry + Streak Widget — side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 stagger-item-subtle stagger-d2">
            <DivisionRivalryWidget setSelectedPlayer={handleSelectPlayer} />
            <StreakWidget />
          </div>

          {/* Existing Overview Tab Content */}
          <OverviewTab
            data={data}
            division={division}
            setSelectedPlayer={handleSelectPlayer}
            setSelectedClub={setSelectedClub}
          />
        </TabsContent>

        {/* ═══════════════ MATCHES TAB — Bracket + Hasil Match ═══════════════ */}
        <TabsContent value="matches" className="mt-3 sm:mt-4 lg:mt-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Bracket — shown first for quick access from hero landing */}
          <MatchesTab
            data={data}
            recentMatches={recentMatches}
            upcomingMatches={upcomingMatches}
            matchesByWeek={matchesByWeek}
            upcomingByWeek={upcomingByWeek}
            clubs={data.clubs}
          />

          {/* Match Results Summary — below bracket */}
          <div className="stagger-item-subtle stagger-d3">
            <MatchResultsSummary />
          </div>
        </TabsContent>

        {/* ═══════════════ STANDINGS TAB — Toornament Style ═══════════════ */}
        <TabsContent value="standings" className="mt-3 sm:mt-4 lg:mt-6 space-y-3 sm:space-y-4 lg:space-y-6">
          <StandingsTab
            data={data}
            setSelectedPlayer={handleSelectPlayer}
            setSelectedClub={setSelectedClub}
          />
        </TabsContent>

        {/* ═══════════════ PARTICIPANTS TAB — Tournament Poster Grid ═══════════════ */}
        <TabsContent value="participants" className="mt-3 sm:mt-4 lg:mt-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="stagger-item-subtle">
              <ParticipantGrid
                players={(data.topPlayers || []) as any}
                onPlayerClick={(player: any) => handleSelectPlayer(player)}
              />
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════ STATS TAB — Season Statistics Dashboard ═══════════════ */}
        <TabsContent value="stats" className="mt-3 sm:mt-4 lg:mt-6">
          <StatsTab />
        </TabsContent>


      </Tabs>

      {/* Player & Club Profiles */}
      {selectedPlayer && (
        <PlayerProfile player={selectedPlayer} onClose={() => setSelectedPlayer(null)} skinMap={data?.skinMap} />
      )}
      {selectedClub && (
        <ClubProfile club={selectedClub} onClose={() => setSelectedClub(null)} />
      )}

      {/* Donation Modal */}
      <DonationModal
        open={donationOpen}
        onOpenChange={setDonationOpen}
        defaultType="weekly"
        cmsSettings={cms || {}}
      />


    </div>
    </>
  );
}

