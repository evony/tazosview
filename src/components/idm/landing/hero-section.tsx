'use client';

import { motion } from 'framer-motion';
import { type MotionValue } from 'framer-motion';
import Image from 'next/image';
import { Crown, Users, Shield, Wallet, Swords, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { MarqueeTicker } from '../marquee-ticker';
import { StatCard, stagger, scaleIn, fadeUp } from './shared';
import { formatCurrency } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

/**
 * Extracts YouTube video ID and start time from various URL formats
 */
function parseYouTubeUrl(url: string): { id: string; startTime: number } | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  let id: string | null = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) { id = match[1]; break; }
  }
  if (!id) return null;

  let startTime = 0;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const t = urlObj.searchParams.get('t');
    if (t) {
      const seconds = parseInt(t.replace(/s$/, ''), 10);
      if (!isNaN(seconds)) startTime = seconds;
    }
  } catch {
    const tMatch = url.match(/[?&]t=(\d+)s?/);
    if (tMatch) startTime = parseInt(tMatch[1], 10);
  }

  return { id, startTime };
}

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLElement | null>;
  heroY: MotionValue<string>;
  heroScale: MotionValue<number>;
  heroOpacity: MotionValue<number>;
  contentY: MotionValue<string>;
  heroMidY: MotionValue<string>;
  cmsLogo: string;
  cmsSiteTitle: string;
  cmsHeroTitle: string;
  cmsHeroSubtitle: string;
  cmsHeroTagline: string;
  cmsHeroBgDesktop: string;
  cmsHeroBgMobile: string;
  cmsHeroBgVideo?: string;
  cmsSections: Record<string, any>;
  leagueData: any;
  nextSeason: number;
  maleData: StatsData | undefined;
  onRegister: () => void;
  onVideoPlay?: (url: string, title: string) => void;
  onViewBracket: (division: 'male' | 'female') => void;
}

export function HeroSection({
  heroRef, heroY, heroScale, heroOpacity, contentY, heroMidY,
  cmsSiteTitle, cmsHeroTitle, cmsHeroSubtitle, cmsHeroTagline,
  cmsHeroBgDesktop, cmsHeroBgMobile, cmsHeroBgVideo, cmsSections, leagueData,
  nextSeason, maleData, onRegister, onVideoPlay, onViewBracket
}: HeroSectionProps) {
  return (
    <>
      {/* ========== HERO SECTION — Cinematic Parallax ========== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background — Video OR Image OR gradient dark (CMS is source of truth) */}
        {cmsHeroBgVideo ? (() => {
          const ytInfo = parseYouTubeUrl(cmsHeroBgVideo);
          const ytId = ytInfo?.id ?? null;
          return ytId ? (
            /* YouTube embed — cinematic background */
            <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${ytInfo?.startTime ? `&start=${ytInfo.startTime}` : ''}`}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260%] sm:w-[120%] h-[260%] sm:h-[120%] min-w-full min-h-full border-0 pointer-events-none"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  aria-hidden="true"
                  title="Hero background video"
                />
              </div>
              <div className="absolute inset-0 bg-black/55" />
            </motion.div>
          ) : (
            /* Cloudinary / direct MP4 — autoplay background */
            <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
              <video
                src={cmsHeroBgVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-black/55" />
            </motion.div>
          );
        })() : cmsHeroBgDesktop || cmsHeroBgMobile ? (
          /* Static image background */
          <>
            {cmsHeroBgDesktop && (
              <motion.div className="absolute inset-0 hidden sm:block" style={{ y: heroY, scale: heroScale }}>
                <Image src={cmsHeroBgDesktop} alt="" fill priority sizes="100vw" className="object-cover" aria-hidden="true" />
                <div className="absolute inset-0 bg-black/55" />
              </motion.div>
            )}
            {cmsHeroBgMobile && (
              <motion.div className="absolute inset-0 sm:hidden" style={{ y: heroY, scale: heroScale }}>
                <Image src={cmsHeroBgMobile} alt="" fill priority sizes="100vw" className="object-cover object-top" aria-hidden="true" />
                <div className="absolute inset-0 bg-black/55" />
              </motion.div>
            )}
          </>
        ) : null /* No CMS media set — gradient dark background from overlay layers serves as cinematic base */}

        {/* Layer 2: Mid-depth gold haze */}
        <motion.div
          className="absolute inset-0"
          style={{
            y: heroMidY,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(212,168,83,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Vignette Effect — darkens edges for cinematic depth */}
        <div className="hero-vignette absolute inset-0 pointer-events-none" aria-hidden="true" />

        {/* CRT Scanline Overlay — esports vibe */}
        <div className="hero-scanline" aria-hidden="true" />

        {/* Hero Content */}
        <motion.div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto w-full" style={{ opacity: heroOpacity, y: contentY }}>
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            {/* Decorative top accent line */}
            <motion.div variants={scaleIn} className="mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-idm-gold-warm/60" />
                <div className="w-2 h-2 rounded-full bg-idm-gold-warm/70 shadow-[0_0_8px_rgba(212,168,83,0.4)]" />
                <div className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-idm-gold-warm/60" />
              </div>
            </motion.div>

            {/* Brand Label */}
            <motion.div variants={fadeUp}>
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.5em' }}
                animate={{ opacity: 1, letterSpacing: '0.25em' }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-sm text-idm-gold-warm/60 font-bold tracking-widest uppercase"
              >
                {cmsSiteTitle}
              </motion.p>
            </motion.div>

            {/* Main Title — with parallax offset + breathing glow */}
            <motion.div variants={fadeUp} className="hero-title-parallax relative">
              {/* Breathing/pulsing glow behind title */}
              <div className="hero-title-glow" aria-hidden="true" />
              <motion.h1
                initial={{ opacity: 0, letterSpacing: '0.05em' }}
                animate={{ opacity: 1, letterSpacing: '-0.02em' }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 text-3xl sm:text-5xl lg:text-6xl text-gradient-fury font-bold tracking-tight uppercase mt-2"
              >
                {cmsHeroTitle}
              </motion.h1>
              {/* Animated underline below title */}
              <span className="hero-animated-underline" aria-hidden="true" />
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.3em' }}
                animate={{ opacity: 1, letterSpacing: '0.15em' }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg sm:text-2xl lg:text-3xl text-[#e8d5a3] font-light tracking-widest uppercase mt-1"
              >
                {cmsHeroSubtitle}
              </motion.p>
            </motion.div>

            {/* Animated Badges — Dynamic status badges */}
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2.5 mt-6 flex-wrap">
              {(cmsSections.hero?.cards?.length > 0
                ? cmsSections.hero.cards.filter((c: { isActive: boolean }) => c.isActive).map((c: { title: string; order: number }) => ({ text: c.title, glow: c.order === 1 }))
                : [
                    { text: leagueData?.ligaChampion ? `Season ${leagueData.ligaChampion.seasonNumber} — Completed` : 'Liga IDM', glow: true },
                    { text: 'Weekly Tournament', glow: false },
                    { text: leagueData?.ligaChampion ? `Liga IDM — S${nextSeason} Menunggu Dana` : leagueData?.preSeason ? 'Liga IDM — Pre-Season' : leagueData?.hasData ? 'Liga IDM' : 'Liga IDM — Segera', glow: false },
                  ]
              ).map((badge: { text: string; glow: boolean }, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.3 }}
                >
                  <Badge className={`bg-idm-gold-warm/10 text-idm-gold-warm text-xs border border-idm-gold-warm/20 px-4 py-2 ${badge.glow ? 'glow-pulse' : ''}`}>
                    {badge.text}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>

            {/* Champion Badge — Season Winner */}
            {leagueData?.ligaChampion && (
              <motion.div
                variants={fadeUp}
                className="flex items-center justify-center mt-3"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/5">
                  <Crown className="w-3.5 h-3.5 text-idm-gold-warm" />
                  <span className="text-[10px] font-bold text-idm-gold-warm/80">S{leagueData.ligaChampion.seasonNumber} Champion:</span>
                  {leagueData.ligaChampion.logo ? (
                    <img src={leagueData.ligaChampion.logo} alt="" className="w-4 h-4 rounded object-cover" />
                  ) : null}
                  <span className="text-[10px] font-black text-white">{leagueData.ligaChampion.name}</span>
                </div>
              </motion.div>
            )}

            {/* Tagline */}
            <motion.p variants={fadeUp} className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-10 mt-8 leading-relaxed">
              {cmsHeroTagline}
            </motion.p>

            {/* Hero CTA — Register Button + Lihat Bracket */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {/* Primary CTA: Daftar Sekarang */}
              <motion.button
                onClick={onRegister}
                aria-label="Register now for IDM League"
                className="group relative cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient border + shimmer behind button */}
                <div className="hero-btn-glow absolute inset-0 rounded-sm" aria-hidden="true" />
                <div className="hero-btn-gradient-border">
                <div className="relative px-5 py-3 sm:px-10 sm:py-5 border-2 border-idm-gold-warm/60 rounded-sm transform -rotate-3 transition-all duration-300 group-hover:rotate-0 group-hover:scale-105 group-hover:border-idm-gold-warm/80">
                  <div className="absolute inset-0 bg-idm-gold-warm/5 group-hover:bg-idm-gold-warm/10 transition-colors duration-300" />
                  <div className="relative z-10">
                    <span className="font-bold text-base sm:text-xl tracking-wider sm:tracking-widest text-idm-gold-warm group-hover:text-[#f0c674] transition-colors">
                      DAFTAR SEKARANG
                    </span>
                    <div className="flex items-center justify-center gap-2 mt-1 sm:mt-1.5">
                      <div className="h-px flex-1 bg-idm-gold-warm/30" />
                      <span className="text-[10px] sm:text-[10px] text-idm-gold-warm/50 tracking-widest">GABUNG IDM LEAGUE</span>
                      <div className="h-px flex-1 bg-idm-gold-warm/30" />
                    </div>
                  </div>
                  {/* Corner brackets */}
                  <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-idm-gold-warm/40 group-hover:border-idm-gold-warm/60 transition-colors" />
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-idm-gold-warm/40 group-hover:border-idm-gold-warm/60 transition-colors" />
                  <div className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-idm-gold-warm/40 group-hover:border-idm-gold-warm/60 transition-colors" />
                  <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-idm-gold-warm/40 group-hover:border-idm-gold-warm/60 transition-colors" />
                </div>
                </div>
              </motion.button>

              {/* Secondary CTA: Lihat Bracket — Popover with Male/Female */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="View bracket"
                    className="group relative cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="relative px-5 py-3 sm:px-8 sm:py-5 border-2 border-white/20 rounded-sm transform rotate-1.5 transition-all duration-300 group-hover:rotate-0 group-hover:border-white/40 bg-white/[0.04] group-hover:bg-white/[0.08]">
                      <div className="relative z-10 flex items-center gap-2">
                        <span className="font-bold text-base sm:text-xl tracking-wider sm:tracking-widest text-white/80 group-hover:text-white transition-colors">
                          LIHAT BRACKET
                        </span>
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-hover:text-white/80 transition-all group-hover:translate-y-0.5" />
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-1 sm:mt-1.5">
                        <div className="h-px flex-1 bg-white/15" />
                        <span className="text-[10px] sm:text-[10px] text-white/30 tracking-widest">MALE & FEMALE</span>
                        <div className="h-px flex-1 bg-white/15" />
                      </div>
                      {/* Corner brackets — subtle */}
                      <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-white/15 group-hover:border-white/30 transition-colors" />
                      <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-white/15 group-hover:border-white/30 transition-colors" />
                      <div className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-white/15 group-hover:border-white/30 transition-colors" />
                      <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-white/15 group-hover:border-white/30 transition-colors" />
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  sideOffset={8}
                  className="w-56 p-2 bg-background/95 backdrop-blur-xl border border-idm-gold-warm/20 rounded-lg shadow-2xl"
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-2 py-1.5">Pilih Divisi</p>
                  <button
                    onClick={() => onViewBracket('male')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-idm-male/10 transition-all duration-200 cursor-pointer group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-idm-male/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">🕺</span>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-foreground">Male Division</span>
                      <span className="block text-[10px] text-muted-foreground">Bracket Male</span>
                    </div>
                  </button>
                  <button
                    onClick={() => onViewBracket('female')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-idm-female/10 transition-all duration-200 cursor-pointer group mt-0.5"
                  >
                    <span className="w-8 h-8 rounded-lg bg-idm-female/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">💃</span>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-foreground">Female Division</span>
                      <span className="block text-[10px] text-muted-foreground">Bracket Female</span>
                    </div>
                  </button>
                </PopoverContent>
              </Popover>
            </motion.div>

            {/* Quick Stats — Animated Counters */}
            <motion.div variants={fadeUp} className="mt-8 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
              <StatCard icon={Users} value={`${maleData?.totalPlayers || 0}`} label="Players" delay={0} />
              <StatCard icon={Shield} value={`${leagueData?.stats?.totalClubs || maleData?.clubs?.length || 0}`} label="Club" delay={0.1} />
              <StatCard icon={Wallet} value={formatCurrency(maleData?.totalPrizePool || 0)} label="Prize Pool" delay={0.2} />
              <StatCard icon={Swords} value={leagueData?.ligaChampion ? `S${leagueData.ligaChampion.seasonNumber} Done` : leagueData?.preSeason ? 'Pre-Season' : `${maleData?.seasonProgress?.completedWeeks || 0} Week`} label={leagueData?.ligaChampion ? 'Liga IDM' : leagueData?.preSeason ? 'Liga IDM' : 'Weekly'} delay={0.3} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-10"
          aria-hidden="true"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] text-idm-gold-warm/50 uppercase tracking-widest font-semibold">Jelajahi</span>
            <div className="w-6 h-10 rounded-full border-2 border-idm-gold-warm/20 flex items-start justify-center p-1.5">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full bg-idm-gold-warm/60"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== UNIFIED MARQUEE — Stats + Live Feed ========== */}
      <div className="relative z-40 py-2.5 bg-background/90 border-y border-idm-gold-warm/10">
        <MarqueeTicker maleData={maleData} femaleData={undefined} leagueData={leagueData} />
      </div>
    </>
  );
}
