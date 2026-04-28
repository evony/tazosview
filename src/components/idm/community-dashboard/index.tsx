'use client';

import { useQuery } from '@tanstack/react-query';
import type { StatsData, TopPlayer } from '@/types/stats';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Swords, Trophy, Crown, Medal,
  Flame, Radio, Star,
  Gamepad2, Target, Calendar,
  Clock, Gift,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import React, { useState } from 'react';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { clubToString } from '@/lib/utils';
import { PlayerProfile } from '../player-profile';
import { ClubProfile } from '../club-profile';

// Import modular components — original
import { CommunityHero } from './community-hero';
import { CommunityStats } from './community-stats';
import { CommunityChampions } from './community-champions';
import { CommunityLeaderboard } from './community-leaderboard';

import { CommunityMatches } from './community-matches';

// Import modular components — new features
import { QuickSearch } from './quick-search';
import { SeasonProgressTracker } from './season-progress';
import { MvpSpotlight } from './mvp-spotlight';

import { UpcomingMatches } from './upcoming-matches';
import { CommunityStreaks } from './community-streaks';
import { CommunityDonors } from './community-donors';
// CommunityActivityMarquee removed — too noisy for community dashboard
import { SeasonComparison } from './season-comparison';
import { DonationModal } from '../donation-modal';


/* ═══════════════════════════════════════════
   Internal Tab Bar — reusable within sections
   ═══════════════════════════════════════════ */
function SectionTabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: T; label: string; icon?: typeof Trophy }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/10">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? 'bg-idm-gold-warm/15 text-idm-gold-warm shadow-sm border border-idm-gold-warm/20'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Champion Section — Tabbed (Juara | MVP | Streak)
   ═══════════════════════════════════════════ */
type ChampionsTab = 'champions' | 'mvp' | 'streak';

function ChampionsMvpSection({
  maleData,
  femaleData,
  onPlayerClick,
}: {
  maleData?: StatsData;
  femaleData?: StatsData;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const [activeTab, setActiveTab] = useState<ChampionsTab>('champions');
  const dt = useCommunityTheme();

  const tabs: { id: ChampionsTab; label: string; icon: typeof Trophy }[] = [
    { id: 'champions', label: 'Juara', icon: Crown },
    { id: 'mvp', label: 'MVP', icon: Star },
    { id: 'streak', label: 'Streak', icon: Flame },
  ];

  return (
    <div className="space-y-4">
      {/* Header with tabs */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <Crown className={`w-3 h-3 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider shrink-0">Champion</h3>
        <div className="ml-auto">
          <SectionTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Tab content — child components render their own Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'champions' && (
            <CommunityChampions maleData={maleData} femaleData={femaleData} onPlayerClick={onPlayerClick} />
          )}
          {activeTab === 'mvp' && (
            <MvpSpotlight maleData={maleData} femaleData={femaleData} onPlayerClick={onPlayerClick} />
          )}
          {activeTab === 'streak' && (
            <CommunityStreaks />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Matches Section — Tabbed (Jadwal / Hasil)
   ═══════════════════════════════════════════ */
type MatchesTab = 'schedule' | 'results';

function MatchesSection({
  maleData,
  femaleData,
}: {
  maleData?: StatsData;
  femaleData?: StatsData;
}) {
  const [activeTab, setActiveTab] = useState<MatchesTab>('schedule');
  const dt = useCommunityTheme();

  const tabs: { id: MatchesTab; label: string; icon: typeof Trophy }[] = [
    { id: 'schedule', label: 'Jadwal', icon: Clock },
    { id: 'results', label: 'Hasil', icon: Swords },
  ];

  return (
    <div className="space-y-4">
      {/* Header with tabs */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <Radio className={`w-3 h-3 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider shrink-0">Pertandingan</h3>
        <div className="ml-auto">
          <SectionTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Tab content — child components render their own Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'schedule' && (
            <UpcomingMatches maleData={maleData} femaleData={femaleData} />
          )}
          {activeTab === 'results' && (
            <CommunityMatches maleData={maleData} femaleData={femaleData} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Season Progress Section — Tabbed (Progress | Perbandingan)
   ═══════════════════════════════════════════ */
type SeasonTab = 'progress' | 'comparison';

function SeasonProgressSection({
  maleData,
  femaleData,
}: {
  maleData?: StatsData;
  femaleData?: StatsData;
}) {
  const [activeTab, setActiveTab] = useState<SeasonTab>('progress');
  const dt = useCommunityTheme();

  const tabs: { id: SeasonTab; label: string; icon: typeof Trophy }[] = [
    { id: 'progress', label: 'Progress', icon: Calendar },
    { id: 'comparison', label: 'Perbandingan', icon: Gamepad2 },
  ];

  return (
    <div className="space-y-4">
      {/* Header with tabs */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <Calendar className={`w-3 h-3 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider shrink-0">Season</h3>
        <div className="ml-auto">
          <SectionTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Tab content — child components render their own Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'progress' && (
            <SeasonProgressTracker maleData={maleData} femaleData={femaleData} />
          )}
          {activeTab === 'comparison' && (
            <SeasonComparison maleData={maleData} femaleData={femaleData} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}



/* Mobile Pill Navigator removed — cleaner mobile layout with natural scroll */

/* ═══════════════════════════════════════════
   LayoutRow — pairs sections side-by-side on desktop
   ═══════════════════════════════════════════ */
function LayoutRow({ children, cols = '2', className = '' }: { children: React.ReactNode; cols?: '2' | '3-2' | '2-3'; className?: string }) {
  const gridClass = cols === '3-2'
    ? 'lg:grid-cols-5'
    : cols === '2-3'
      ? 'lg:grid-cols-5'
      : 'lg:grid-cols-2';

  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-5 lg:gap-6 ${className}`}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Section wrapper with staggered reveal
   ═══════════════════════════════════════════ */
const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function Section({
  children,
  className = '',
  title,
  icon: Icon,
  iconColor = 'text-idm-gold-warm',
  sectionId,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: typeof Trophy;
  iconColor?: string;
  sectionId?: string;
}) {
  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className={className}
      id={sectionId ? `section-${sectionId}` : undefined}
    >
      {title && Icon && (
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
          <div className="flex-1 h-px bg-border/20" />
        </div>
      )}
      {children}
    </motion.section>
  );
}

/* ═══════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════ */
function CommunityDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-muted/20 border border-border/20 p-8">
        <Skeleton className="h-6 w-20 rounded-full mb-4" />
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="flex gap-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/20 bg-muted/10 p-4">
            <div className="flex justify-between mb-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="w-14 h-5" />
            </div>
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Division skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/20 bg-muted/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-8 w-full rounded-lg mb-2" />
            <Skeleton className="h-8 w-full rounded-lg mb-2" />
            <Skeleton className="h-8 w-full rounded-lg mb-3" />
            <div className="flex justify-end"><Skeleton className="h-9 w-28 rounded-xl" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}



/* ═══════════════════════════════════════════
   Main Community Dashboard — Single Page with Internal Section Tabs
   ═══════════════════════════════════════════ */
export function CommunityDashboard() {
  // Selected player for profile modal
  const [selectedPlayer, setSelectedPlayer] = useState<(TopPlayer & { division?: string }) | null>(null);
  // Selected club for profile modal
  const [selectedClub, setSelectedClub] = useState<StatsData['clubs'][0] | null>(null);
  // Donation modal state
  const [donationOpen, setDonationOpen] = useState(false);

  // CMS settings for donation modal
  const { data: cms } = useQuery<Record<string, string>>({
    queryKey: ['cms-settings'],
    queryFn: async () => {
      const res = await fetch('/api/cms/content');
      if (!res.ok) return {};
      const json = await res.json();
      return json.settings || {};
    },
  });


  // Fetch male stats
  const { data: maleData, isLoading: isMaleLoading } = useQuery<StatsData>({
    queryKey: ['stats', 'male'],
    queryFn: async () => {
      const res = await fetch('/api/stats?division=male');
      return res.json();
    },
    staleTime: 15000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Fetch female stats
  const { data: femaleData, isLoading: isFemaleLoading } = useQuery<StatsData>({
    queryKey: ['stats', 'female'],
    queryFn: async () => {
      const res = await fetch('/api/stats?division=female');
      return res.json();
    },
    staleTime: 15000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Fetch league data (now returns Tarkam data)
  const { data: leagueData, isLoading: isLeagueLoading } = useQuery<{
    hasData: boolean;
    stats?: { totalClubs: number; totalMatches: number; completedMatches: number; liveMatches: number };
    clubs?: Array<{
      id: string;
      name: string;
      logo?: string | null;
      wins: number;
      losses: number;
      points: number;
      malePoints: number;
      femalePoints: number;
      gameDiff: number;
      memberCount: number;
      maleMemberCount: number;
      femaleMemberCount: number;
    }>;
    tarkamChampion?: {
      id: string;
      name: string;
      logo?: string | null;
      seasonNumber: number;
      malePoints: number;
      femalePoints: number;
      totalPoints: number;
    } | null;
  }>({
    queryKey: ['league-community'],
    queryFn: async () => {
      const res = await fetch('/api/league');
      return res.json();
    },
    staleTime: 15000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const isLoading = isMaleLoading || isFemaleLoading || isLeagueLoading;

  // Player click handler — normalize player data for shared PlayerProfile
  const handlePlayerClick = (player: TopPlayer & { division?: string }, division: 'male' | 'female') => {
    setSelectedPlayer({
      ...player,
      division,
      club: clubToString(player.club as Parameters<typeof clubToString>[0]) || undefined,
    });
  };

  if (isLoading) {
    return <CommunityDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ═══ 1. Hero — Full width ═══ */}
      <Section sectionId="hero">
        <CommunityHero maleData={maleData} femaleData={femaleData} leagueData={leagueData} onSawer={() => setDonationOpen(true)} />
      </Section>

      {/* ═══ 2. Quick Search — Full width ═══ */}
      <Section>
        <QuickSearch onPlayerClick={handlePlayerClick} />
      </Section>

      {/* ═══ 3. Stats — Full width (internal 3-col) ═══ */}
      <Section title="Statistik" icon={Target} iconColor="text-idm-gold-warm" sectionId="stats">
        <CommunityStats maleData={maleData} femaleData={femaleData} leagueData={leagueData} />
      </Section>

      {/* ═══ 4. Saweran — MOVED UP (sawer-driven prize pool model) ═══ */}
      <Section title="Saweran Komunitas" icon={Gift} iconColor="text-idm-gold-warm" sectionId="saweran">
        <CommunityDonors maleData={maleData} femaleData={femaleData} onSawer={() => setDonationOpen(true)} />
      </Section>

      {/* ═══ 5. Season — Full width with internal tabs (Progress | Perbandingan) ═══ */}
      <Section sectionId="season">
        <SeasonProgressSection maleData={maleData} femaleData={femaleData} />
      </Section>

      {/* ═══ 6. Champions & MVP — Full width with internal tabs ═══ */}
      <Section sectionId="champions">
        <ChampionsMvpSection
          maleData={maleData}
          femaleData={femaleData}
          onPlayerClick={handlePlayerClick}
        />
      </Section>

      {/* ═══ 7. Rankings + Streak — Full width ═══ */}
      <Section title="Peringkat" icon={Trophy} iconColor="text-idm-gold-warm" sectionId="rankings">
        <CommunityLeaderboard
          maleData={maleData}
          femaleData={femaleData}
          onPlayerClick={handlePlayerClick}
          onClubClick={(club) => setSelectedClub(club)}
        />
      </Section>

      {/* ═══ 8. Matches — Full width with internal tabs ═══ */}
      <Section sectionId="matches">
        <MatchesSection maleData={maleData} femaleData={femaleData} />
      </Section>

      {/* ═══ Donation Modal ═══ */}
      <DonationModal
        open={donationOpen}
        onOpenChange={setDonationOpen}
        defaultType="weekly"
        cmsSettings={cms || {}}
      />

      {/* Player & Club Profile Modals — same as division dashboard */}
      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          skinMap={maleData?.skinMap || femaleData?.skinMap}
        />
      )}
      {selectedClub && (
        <ClubProfile
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
          onPlayerClick={(p) => {
            // Normalize player from ClubProfile roster for PlayerProfile
            setSelectedPlayer({
              id: p.id,
              name: p.name || p.gamertag,
              gamertag: p.gamertag,
              avatar: p.avatar,
              tier: p.tier,
              points: p.points,
              totalWins: 0,
              totalMvp: 0,
              streak: 0,
              maxStreak: 0,
              matches: 0,
              division: p.division,
              city: p.city,
            });
            setSelectedClub(null);
          }}
        />
      )}
    </div>
  );
}
