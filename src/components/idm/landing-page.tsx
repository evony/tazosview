'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { useCrossTabInvalidation } from '@/lib/cross-tab-sync';

import Image from 'next/image';
import { Crown, Users, Swords, Sparkles, Play, Flame, ChevronRight, Zap } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { StatsData } from '@/types/stats';

// Section components
import { HeroSection } from './landing/hero-section';
import { HighlightsSection } from './landing/highlights-section';
import { ExperiencesSection } from './landing/experiences-section';
import { TournamentHub } from './landing/tournament-hub';
import { ClubsSection } from './landing/clubs-section';
import { ChampionsSection } from './landing/champions-section';
import { MvpSection } from './landing/mvp-section';
import { HowItWorksSection } from './landing/how-it-works-section';
import { CTASection } from './landing/cta-section';
import { LandingFooter } from './landing/landing-footer';

// Shared hooks & components
import { useSwipeNavigation, useScrollReveal, useParallax } from './landing/shared';

// Modal & utility components
import { PlayerProfile } from './player-profile';
import { ClubProfile } from './club-profile';
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
  const [showAllMalePlayers, setShowAllMalePlayers] = useState(false);
  const [showAllFemalePlayers, setShowAllFemalePlayers] = useState(false);

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

  /* Cross-tab cache sync — invalidates when admin updates logo/banner in another tab */
  useCrossTabInvalidation();

  /* Data Queries — 2min polling, CDN-cached */
  const { data: maleData, isLoading: isMaleLoading } = useQuery<StatsData>({
    queryKey: ['stats', 'male'],
    queryFn: async () => { const res = await fetch('/api/stats?division=male'); return res.json(); },
    staleTime: 60000,
    refetchInterval: 120000, // 2min polling — optimized for mid-range devices
    refetchOnWindowFocus: true,
    gcTime: 300000,
  });

  const { data: femaleData, isLoading: isFemaleLoading } = useQuery<StatsData>({
    queryKey: ['stats', 'female'],
    queryFn: async () => { const res = await fetch('/api/stats?division=female'); return res.json(); },
    staleTime: 60000,
    refetchInterval: 120000, // 2min polling — optimized for mid-range devices
    refetchOnWindowFocus: true,
    gcTime: 300000,
  });

  const isDataLoading = isMaleLoading || isFemaleLoading;

  const { data: cmsData } = useQuery({
    queryKey: ['cms-content'],
    queryFn: async () => { const res = await fetch('/api/cms/content'); if (!res.ok) return { settings: {}, sections: {} }; return res.json(); },
    staleTime: 120000, // CMS changes rarely — 2min stale is fine
    refetchInterval: 300000, // 5min polling — CMS data barely changes
    refetchOnWindowFocus: true,
    gcTime: 300000,
  });

  const { data: leagueData } = useQuery<{ hasData: boolean; preSeason?: boolean; reason?: string; season?: { id: string; name: string; number: number }; tarkamChampion?: { id: string; name: string; logo: string | null; seasonNumber: number; malePoints: number; femalePoints: number; totalPoints: number; members: { id: string; gamertag: string; division: string; tier: string; points: number; role: string; avatar?: string | null }[] } | null; stats?: { totalClubs: number; totalMatches: number; completedMatches: number } }>({
    queryKey: ['league-landing'],
    queryFn: async () => {
      const res = await fetch('/api/league');
      if (!res.ok) throw new Error('League API failed');
      return res.json();
    },
    // ── 2min Polling Strategy ──
    // Most requests hit Vercel CDN (s-maxage=10), not the database.
    // 2min is optimized for mid-range devices while still feeling responsive:
    //   - CDN caches for 10s → most polls hit CDN, not DB
    //   - Admin updates: revalidateTag purges CDN → next poll gets fresh data
    //   - Admin changes appear within max 2min without manual refresh
    staleTime: 120000, // 2min — data considered fresh for 2min
    gcTime: 300000, // Keep unused data for 5 min in memory
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchInterval: 300000, // 5min polling — league data changes rarely
  });

  // CMS helpers
  const cms = cmsData?.settings || {};
  const cmsSections = cmsData?.sections || {};
  const cmsLogo = cms.logo_url || '/logo1.webp';
  const cmsSiteTitle = cms.site_title || 'Tarkam IDM';
  const cmsHeroTitle = cms.hero_title || 'Idol Meta';
  const cmsHeroSubtitle = cms.hero_subtitle || 'Fan Made Edition';
  const cmsFooterText = cms.footer_text || '© 2025 Tarkam IDM — Idol Meta Fan Made Edition. All rights reserved.';
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

  const enterCommunity = () => {
    setCurrentView('community');
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
    const sectionIds = ['kompetisi', 'highlights', 'experiences', 'champions', 'mvp', 'clubs', 'how-it-works'];
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sectionIds.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  /* Section Reveal — IntersectionObserver for scroll-triggered fade-in animations
     Dashboard-crisp: low threshold + generous rootMargin so animation fires early */
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
      { threshold: 0.01, rootMargin: '0px 0px 0px 0px' }
    );
    revealSections.forEach((el) => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, []);

  useSwipeNavigation();
  useScrollReveal();

  /* Parallax — lightweight rAF-based depth layers on scroll */
  useParallax([
    { selector: '.parallax-hero-bg', speed: 0.12 },      // base gradient — slowest
    { selector: '.parallax-hero-mid', speed: 0.08 },      // gold haze — very slow
    { selector: '.parallax-hero-slow', speed: 0.05 },     // cyan/purple glow — slowest
    { selector: '.parallax-section-bg', speed: 0.06 },    // section backgrounds — subtle
    { selector: '.parallax-particles', speed: 0.18 },     // floating particles — fastest
  ]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden landing-scroll pb-24 md:pb-0">

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

          {/* Desktop Nav Links — compact on medium screens */}
          <div className="hidden sm:flex items-center gap-0.5 md:gap-1">
            {[
              { id: 'kompetisi', label: 'Kompetisi', mdLabel: 'Kompetisi' },
              { id: 'highlights', label: 'Highlights', mdLabel: 'Highlight' },
              { id: 'champions', label: 'Champion', mdLabel: 'Champion' },
              { id: 'mvp', label: 'MVP', mdLabel: 'MVP' },
              { id: 'clubs', label: 'Club', mdLabel: 'Club' },
              { id: 'how-it-works', label: 'Cara Main', mdLabel: 'Cara Main' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                aria-label={`Navigate to ${item.label} section`}
                aria-current={activeSection === item.id ? 'true' : undefined}
                className={`relative px-2 md:px-3 py-1.5 text-xs md:text-sm transition-all duration-300 cursor-pointer rounded-md ${
                  activeSection === item.id
                    ? 'text-idm-gold-warm font-semibold'
                    : 'text-muted-foreground hover:text-idm-gold-warm/70'
                }`}
              >
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden">{item.mdLabel}</span>
                {activeSection === item.id && (
                  <div className="nav-indicator absolute bottom-0 left-1 right-1 h-[2px] bg-idm-gold-warm rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Masuk Arena Button */}
          <button
            onClick={enterCommunity}
            aria-label="Masuk Arena"
            className="btn-press relative flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:shadow-[0_0_20px_rgba(229,190,74,0.4)] active:scale-95 cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>Masuk Arena</span>
            {/* Pulsing arrow */}
            <span className="relative flex items-center justify-center">
              <ChevronRight className="w-4 h-4 animate-pulse" />
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
            </span>
          </button>
        </div>
      </nav>

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <nav aria-label="Section navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/98 border-t border-idm-gold-warm/10 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { id: 'kompetisi', label: 'Kompetisi', icon: Swords, special: false },
            { id: 'champions', label: 'Champion', icon: Crown, special: true },
            { id: 'mvp', label: 'MVP', icon: Sparkles, special: false },
            { id: 'clubs', label: 'Club', icon: Users, special: false },
            { id: 'how-it-works', label: 'Cara Main', icon: Zap, special: false },
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
                  <div className={`nav-indicator absolute -bottom-0.5 rounded-full ${item.special ? 'w-10 h-1 bg-idm-gold-warm shadow-[0_0_8px_rgba(212,168,83,0.5)]' : 'w-8 h-0.5 bg-idm-gold-warm'}`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========== SECTION COMPONENTS ========== */}
      <HeroSection
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onEnterApp={enterApp}
        onEnterCommunity={enterCommunity}
        onRegister={() => setRegistrationModalOpen(true)}
        onViewBracket={enterBracket}
        onVideoPlay={openVideoModal}
      />

      {/* Kompetisi — Tarkam Arena (first section after hero) */}
      <div className="section-reveal">
      <TournamentHub
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onEnterApp={enterApp}
        onVideoPlay={openVideoModal}
      />
      </div>

      <SectionDivider />

      {/* Highlights — Momen Terbaik */}
      <div className="section-reveal">
      <HighlightsSection
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onVideoPlay={openVideoModal}
        setSelectedPlayer={setSelectedPlayer}
      />
      </div>

      <SectionDivider />

      {/* Experiences — Video Highlights */}
      <div className="section-reveal">
      <ExperiencesSection
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
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
        isDataLoading={isDataLoading}
        cmsSections={cmsSections}
        setSelectedPlayer={setSelectedPlayer}
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
        showAllMalePlayers={showAllMalePlayers}
        setShowAllMalePlayers={setShowAllMalePlayers}
        showAllFemalePlayers={showAllFemalePlayers}
        setShowAllFemalePlayers={setShowAllFemalePlayers}
      />
      </div>

      <SectionDivider />

      {/* How It Works */}
      <div className="section-reveal">
      <HowItWorksSection cmsSettings={cms} />
      </div>

      <SectionDivider />

      {/* CTA — Call to Action */}
      <div className="section-reveal">
      <CTASection
        onEnterCommunity={enterCommunity}
        onRegister={() => setRegistrationModalOpen(true)}
        cmsSettings={cms}
      />
      </div>

      <LandingFooter
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
