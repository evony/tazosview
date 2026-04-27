'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { useCrossTabInvalidation } from '@/lib/cross-tab-sync';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { Crown, Users, Swords, BookOpen, Trophy, Radio } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { StatsData } from '@/types/stats';
import { useIsMobile } from '@/hooks/use-mobile';

// Section components
import { HeroSection } from './landing/hero-section';
import { AboutSection } from './landing/about-section';
import { TournamentHub } from './landing/tournament-hub';
import { ClubsSection } from './landing/clubs-section';
import { ClubLeaderboard } from './landing/club-leaderboard';
import { PlayerSpotlight } from './landing/player-spotlight';
import { ChampionsSection } from './landing/champions-section';
import { MvpSection } from './landing/mvp-section';
import { DreamSection } from './landing/dream-section';
import { LandingFooter } from './landing/landing-footer';

// Shared hooks & components
import { useSwipeNavigation } from './landing/shared';

// Modal & utility components
import { PlayerProfile } from './player-profile';
import { ClubProfile } from './club-profile';
import { DonationModal } from './donation-modal';
import { RegistrationModal } from './registration-modal';
import { VideoModal } from './video-modal';
import { BackToTop } from './ui/back-to-top';
import { ScrollProgress } from './ui/scroll-progress';

/* ═══ Premium Section Divider ═══ */
function SectionDivider() {
  return <div className="section-divider-premium max-w-4xl mx-auto" aria-hidden="true" />;
}

export function LandingPage() {
  const { setCurrentView, setDivision, setInitialDashboardTab } = useAppStore();
  const [selectedPlayer, setSelectedPlayer] = useState<StatsData['topPlayers'][0] & { division?: string } | null>(null);
  const [selectedClub, setSelectedClub] = useState<(StatsData['clubs'][0] & { division?: string }) | null>(null);
  const [showAllClubs, setShowAllClubs] = useState(false);
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  /* Donation Modal State */
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationModalType, setDonationModalType] = useState<'weekly' | 'season'>('season');
  const [donationModalAmount, setDonationModalAmount] = useState<number | undefined>(undefined);

  /* Registration Modal State */
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);

  /* Video Modal State */
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalUrl, setVideoModalUrl] = useState('');
  const [videoModalTitle, setVideoModalTitle] = useState('');

  const openVideoModal = useCallback((url: string, title: string) => {
    setVideoModalUrl(url);
    setVideoModalTitle(title);
    setVideoModalOpen(true);
  }, []);

  const openDonationModal = useCallback((type: 'weekly' | 'season', amount?: number) => {
    setDonationModalType(type);
    setDonationModalAmount(amount);
    setDonationModalOpen(true);
  }, []);

  /* Cross-tab cache sync — invalidates when admin updates logo/banner in another tab */
  useCrossTabInvalidation();

  /* Parallax Refs — disabled on mobile for performance */
  const isMobile = useIsMobile();
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(heroScroll, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '25%']);
  const heroScale = useTransform(heroScroll, [0, 1], isMobile ? [1, 1] : [1, 1.05]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], isMobile ? [1, 1] : [1, 0]);
  const contentY = useTransform(heroScroll, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '15%']);
  const heroMidY = useTransform(heroScroll, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '8%']);

  /* Data Queries — 15s polling, CDN-cached */
  const { data: maleData, isLoading: isMaleLoading } = useQuery<StatsData>({
    queryKey: ['stats', 'male'],
    queryFn: async () => { const res = await fetch('/api/stats?division=male'); return res.json(); },
    staleTime: 15000,
    refetchInterval: 30000, // 15s polling — CDN handles most requests
    refetchOnWindowFocus: true,
  });

  const { data: femaleData, isLoading: isFemaleLoading } = useQuery<StatsData>({
    queryKey: ['stats', 'female'],
    queryFn: async () => { const res = await fetch('/api/stats?division=female'); return res.json(); },
    staleTime: 15000,
    refetchInterval: 30000, // 15s polling — CDN handles most requests
    refetchOnWindowFocus: true,
  });

  const isDataLoading = isMaleLoading || isFemaleLoading;

  const { data: cmsData } = useQuery({
    queryKey: ['cms-content'],
    queryFn: async () => { const res = await fetch('/api/cms/content'); if (!res.ok) return { settings: {}, sections: {} }; return res.json(); },
    staleTime: 30000, // CMS changes rarely — 30s is enough
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const { data: leagueData } = useQuery<{ hasData: boolean; preSeason?: boolean; reason?: string; season?: { id: string; name: string }; ligaChampion?: { id: string; name: string; logo: string | null; seasonNumber: number; members: { id: string; gamertag: string; division: string; tier: string; points: number; role: string; avatar?: string | null }[] } | null; stats?: { totalClubs: number; totalMatches: number; completedMatches: number } }>({
    queryKey: ['league-landing'],
    queryFn: async () => {
      const res = await fetch('/api/league');
      if (!res.ok) throw new Error('League API failed');
      return res.json();
    },
    // ── 15s Polling Strategy ──
    // Most requests hit Vercel CDN (s-maxage=10), not the database.
    // 15s is safe for free tier while still feeling responsive:
    //   - CDN caches for 10s → most polls hit CDN, not DB
    //   - Admin updates: revalidateTag purges CDN → next poll gets fresh data
    //   - Admin changes appear within max 15s without manual refresh
    staleTime: 15000, // 15s — data considered fresh for 15s
    gcTime: 300000, // Keep unused data for 5 min in memory
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchInterval: 30000, // 15s polling — safe for free tier, CDN-cached
  });

  const nextSeason = (leagueData?.ligaChampion?.seasonNumber || 1) + 1;
  const completedSeason = leagueData?.ligaChampion?.seasonNumber || 1;

  // CMS helpers
  const cms = cmsData?.settings || {};
  const cmsSections = cmsData?.sections || {};
  const cmsLogo = cms.logo_url || '/logo1.webp';
  const cmsSiteTitle = cms.site_title || 'IDM League';
  const cmsHeroTitle = cms.hero_title || 'Idol Meta';
  const cmsHeroSubtitle = cms.hero_subtitle || 'Fan Made Edition';
  const cmsHeroTagline = cms.hero_tagline || 'Tempat dancer terbaik berkompetisi. Tournament mingguan, liga profesional, dan podium yang menunggu.';
  const cmsHeroBgDesktop = cms.hero_bg_desktop || '';
  const cmsHeroBgMobile = cms.hero_bg_mobile || '';
  const cmsFooterText = cms.footer_text || '© 2025 IDM League — Idol Meta Fan Made Edition. All rights reserved.';
  const cmsFooterTagline = cms.footer_tagline || 'Dance. Compete. Dominate.';

  const enterApp = (division: 'male' | 'female') => {
    setDivision(division);
    setCurrentView('dashboard');
  };

  const enterBracket = (division: 'male' | 'female') => {
    setDivision(division);
    setInitialDashboardTab('matches');
    setCurrentView('dashboard');
  };

  /* Nav scroll state */
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ['about', 'kompetisi', 'champions', 'mvp', 'spotlight', 'clubs', 'leaderboard', 'dream'];
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sectionIds.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  /* Section Reveal — IntersectionObserver for scroll-triggered fade-in animations */
  useEffect(() => {
    const revealSections = document.querySelectorAll('.section-reveal');
    if (!revealSections.length) return;
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-reveal--visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    revealSections.forEach((el) => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, [maleData, femaleData, leagueData, cmsData]);

  useSwipeNavigation();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden landing-scroll pb-24 sm:pb-0">

      {/* ========== FIXED NAVIGATION HEADER ========== */}
      <nav aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/95 border-b border-idm-gold-warm/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] nav-scrolled-glow'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 transition-all duration-500 ${scrolled ? 'nav-logo-glow glow-pulse' : 'glow-pulse'}`}>
              <Image src={cmsLogo} alt="IDM" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className={`text-gradient-fury text-sm font-bold tracking-tight transition-all duration-500 ${scrolled ? 'nav-logo-text-glow' : ''}`}>{cmsSiteTitle}</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { id: 'about', label: 'Cerita Kami' },
              { id: 'kompetisi', label: 'Kompetisi' },
              { id: 'champions', label: 'Champion' },
              { id: 'mvp', label: 'MVP' },
              { id: 'clubs', label: 'Club' },
              { id: 'leaderboard', label: 'Peringkat' },
              { id: 'dream', label: 'Liga IDM' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                aria-label={`Navigate to ${item.label} section`}
                aria-current={activeSection === item.id ? 'true' : undefined}
                className={`relative px-3 py-1.5 text-sm transition-all duration-300 cursor-pointer rounded-md ${
                  activeSection === item.id
                    ? 'text-idm-gold-warm font-semibold'
                    : 'text-muted-foreground hover:text-idm-gold-warm/70'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute bottom-0 left-1 right-1 h-[2px] bg-idm-gold-warm rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Division Switch */}
          <div className="flex items-center bg-muted/80 backdrop-blur-sm rounded-full p-0.5 gap-0.5 border border-idm-gold-warm/15">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => enterApp('male')}
              aria-label="Enter Male Division"
              className="px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 text-muted-foreground hover:bg-idm-male hover:text-white hover:shadow-md division-toggle-shimmer"
            >
              🕺 Male
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => enterApp('female')}
              aria-label="Enter Female Division"
              className="px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 text-muted-foreground hover:bg-idm-female hover:text-white hover:shadow-md division-toggle-shimmer"
            >
              💃 Female
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <nav aria-label="Section navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/98 border-t border-idm-gold-warm/10 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { id: 'about', label: 'Cerita', icon: BookOpen, special: false },
            { id: 'kompetisi', label: 'Kompetisi', icon: Swords, special: false },
            { id: 'champions', label: 'Champion', icon: Crown, special: true },
            { id: 'clubs', label: 'Club', icon: Users, special: false },
            { id: 'leaderboard', label: 'Peringkat', icon: Trophy, special: false },
          ].map(item => {
            const isActive = (activeSection === 'champions' || activeSection === 'mvp') && item.id === 'champions' || activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-300 ${
                  item.special
                    ? isActive
                      ? 'text-idm-gold-warm'
                      : 'text-idm-gold-warm/70'
                    : isActive
                    ? 'text-idm-gold-warm'
                    : 'text-muted-foreground hover:text-idm-gold-warm/70'
                }`}
              >
                {item.special && (
                  <span className="absolute inset-0 rounded-lg bg-idm-gold-warm/[0.04] border border-idm-gold-warm/10" />
                )}
                {item.special && !isActive && (
                  <span className="absolute inset-0 rounded-lg animate-pulse bg-idm-gold-warm/[0.03] shadow-[0_0_8px_rgba(212,168,83,0.08)]" />
                )}
                <item.icon className={`relative z-10 w-5 h-5 ${item.special ? 'drop-shadow-[0_0_4px_rgba(212,168,83,0.3)]' : ''}`} />
                <span className={`relative z-10 text-[11px] font-medium mt-1 ${item.special ? 'font-bold' : ''}`}>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className={`absolute -bottom-0.5 rounded-full transition-colors ${item.special ? 'w-10 h-1 bg-idm-gold-warm shadow-[0_0_8px_rgba(212,168,83,0.5)]' : 'w-8 h-0.5 bg-idm-gold-warm'}`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========== SECTION COMPONENTS ========== */}
      <HeroSection
        heroRef={heroRef}
        heroY={heroY}
        heroScale={heroScale}
        heroOpacity={heroOpacity}
        contentY={contentY}
        heroMidY={heroMidY}
        cmsLogo={cmsLogo}
        cmsSiteTitle={cmsSiteTitle}
        cmsHeroTitle={cmsHeroTitle}
        cmsHeroSubtitle={cmsHeroSubtitle}
        cmsHeroTagline={cmsHeroTagline}
        cmsHeroBgDesktop={cmsHeroBgDesktop}
        cmsHeroBgMobile={cmsHeroBgMobile}
        cmsHeroBgVideo={cms.hero_bg_video}
        cmsSections={cmsSections}
        leagueData={leagueData}
        nextSeason={nextSeason}
        maleData={maleData}
        onRegister={() => setRegistrationModalOpen(true)}
        onVideoPlay={openVideoModal}
        onViewBracket={enterBracket}
      />

      {/* About / Cerita Kami */}
      <div className="section-reveal">
      <AboutSection
        cmsSections={cmsSections}
        cmsSettings={cms}
      />
      </div>

      <SectionDivider />

      {/* Kompetisi */}
      <div className="section-reveal">
      <TournamentHub
        maleData={maleData}
        femaleData={femaleData}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onEnterApp={enterApp}
        onVideoPlay={openVideoModal}
      />
      </div>

      <SectionDivider />

      {/* Champions — shown first for achievement showcase */}
      <div className="section-reveal">
      <ChampionsSection
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        isDataLoading={isDataLoading}
        cmsSections={cmsSections}
        setSelectedPlayer={setSelectedPlayer}
        championVideoUrl={cms.champion_video_url}
        onVideoPlay={openVideoModal}
      />
      </div>

      <SectionDivider />

      {/* MVP */}
      <div className="section-reveal">
      <MvpSection
        maleData={maleData}
        femaleData={femaleData}
        isDataLoading={isDataLoading}
        cmsSections={cmsSections}
        setSelectedPlayer={setSelectedPlayer}
      />
      </div>

      <SectionDivider />

      {/* Player Spotlight — Featured #1 players */}
      <div className="section-reveal">
      <PlayerSpotlight
        maleData={maleData}
        femaleData={femaleData}
        isDataLoading={isDataLoading}
        setSelectedPlayer={setSelectedPlayer}
      />
      </div>

      <SectionDivider />

      {/* Clubs — moved below MVP */}
      <div className="section-reveal">
      <ClubsSection
        maleData={maleData}
        femaleData={femaleData}
        isDataLoading={isDataLoading}
        cmsSections={cmsSections}
        leagueData={leagueData}
        setSelectedClub={setSelectedClub}
        selectedClub={selectedClub}
        setSelectedPlayer={setSelectedPlayer}
        showAllClubs={showAllClubs}
        setShowAllClubs={setShowAllClubs}
        showAllPlayers={showAllPlayers}
        setShowAllPlayers={setShowAllPlayers}
      />
      </div>

      <SectionDivider />

      {/* Leaderboard — Peringkat Klub & Pemain */}
      <div className="section-reveal">
      <ClubLeaderboard
        onClubClick={(club) => setSelectedClub({
          id: club.id,
          name: club.name,
          logo: club.logo,
          wins: club.wins,
          losses: club.losses,
          points: club.points,
          gameDiff: club.gameDiff,
        })}
        onPlayerClick={(player) => {
          const searchDivision = player.division || 'male';
          const data = searchDivision === 'male' ? maleData : femaleData;
          const found = data?.topPlayers?.find(p => p.id === player.id);
          if (found) {
            setSelectedPlayer({ ...found, division: searchDivision });
          } else {
            setSelectedPlayer({
              id: player.id,
              name: player.name || player.gamertag,
              gamertag: player.gamertag,
              avatar: player.avatar,
              tier: player.tier || 'B',
              points: player.points || 0,
              totalWins: player.totalWins || 0,
              streak: player.streak || 0,
              maxStreak: player.maxStreak || 0,
              totalMvp: player.totalMvp || 0,
              matches: player.matches || 0,
              division: searchDivision,
              club: player.club || undefined,
            });
          }
        }}
      />
      </div>

      <SectionDivider />

      {/* Dream / CTA */}
      <div className="section-reveal">
      <DreamSection
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        nextSeason={nextSeason}
        completedSeason={completedSeason}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onEnterApp={enterApp}
        openDonationModal={openDonationModal}
        onVideoPlay={openVideoModal}
      />
      </div>

      <LandingFooter
        cmsFooterText={cmsFooterText}
        cmsFooterTagline={cmsFooterTagline}
        cmsLogo={cmsLogo}
        cmsSiteTitle={cmsSiteTitle}
        cmsHeroTitle={cmsHeroTitle}
        cmsHeroSubtitle={cmsHeroSubtitle}
        cmsSettings={cms}
        scrollToSection={scrollToSection}
      />

      {/* ========== DONATION MODAL (Landing — Donasi only, no Sawer toggle) ========== */}
      <DonationModal
        open={donationModalOpen}
        onOpenChange={setDonationModalOpen}
        defaultType={donationModalType}
        defaultAmount={donationModalAmount}
        hideSawer
        cmsSettings={cms}
      />

      {/* ========== REGISTRATION MODAL ========== */}
      <RegistrationModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
      />

      {/* ========== VIDEO MODAL ========== */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={videoModalUrl}
        title={videoModalTitle}
      />

      {/* ========== SCROLL PROGRESS BAR ========== */}
      <ScrollProgress />

      {/* ========== BACK TO TOP BUTTON ========== */}
      <BackToTop />

      {/* ========== PLAYER PROFILE MODAL ========== */}
      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          rank={((selectedPlayer.division === 'male' ? maleData : femaleData)?.topPlayers?.findIndex(p => p.id === selectedPlayer.id) ?? -1) + 1}
        />
      )}

      {/* ========== CLUB PROFILE MODAL ========== */}
      {selectedClub && (
        <ClubProfile
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
          onPlayerClick={(player) => {
            // Find the player in the appropriate division's top players
            const searchDivision = player.division || 'male';
            const data = searchDivision === 'male' ? maleData : femaleData;
            const found = data?.topPlayers?.find(p => p.id === player.id);
            if (found) {
              setSelectedPlayer({ ...found, division: searchDivision });
            } else {
              // Player not in topPlayers list — create a minimal profile
              setSelectedPlayer({
                id: player.id,
                name: player.name || player.gamertag,
                gamertag: player.gamertag,
                avatar: player.avatar,
                tier: player.tier || 'B',
                points: player.points || 0,
                totalWins: 0,
                streak: 0,
                maxStreak: 0,
                totalMvp: 0,
                matches: 0,
                division: searchDivision,
                city: (player as { city?: string }).city,
              });
            }
          }}
        />
      )}
    </div>
  );
}
