'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Zap, Star, UserPlus, Eye, ArrowRight } from 'lucide-react';
import { MarqueeTicker } from '../marquee-ticker';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — TARKAM ARENA HERO
   International esports tournament aesthetic
   Inspired by Valorant Champions / LoL Worlds / BLAST Premier
   ═══════════════════════════════════════════════════════════════ */

interface HeroSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onEnterCommunity: () => void;
  onRegister: () => void;
  onViewBracket: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
}

/* ─── Floating Particle System ─── */
interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function useParticles(count: number): Particle[] {
  return useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 6,
      opacity: 0.15 + Math.random() * 0.35,
    })),
    [count]
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HERO SECTION
   ═══════════════════════════════════════════════════════════════ */

export function HeroSection({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onEnterCommunity,
  onRegister,
  onViewBracket,
  onVideoPlay,
}: HeroSectionProps) {
  /* ─── Extract CMS content ─── */
  const siteTitle = cmsSettings.site_title || 'TARKAM IDM';
  const heroTitle = cmsSettings.hero_title || 'TARKAM ARENA';
  const heroSubtitle = cmsSettings.hero_subtitle || 'Idol Meta · Fan Made Edition';
  const heroTagline = cmsSettings.hero_tagline || 'Tempat dancer terbaik berkompetisi. Tournament mingguan, kompetisi profesional, dan podium yang menunggu.';
  const heroBgDesktop = cmsSettings.hero_bg_desktop || '';
  const heroBgMobile = cmsSettings.hero_bg_mobile || '';
  const heroBgVideo = cmsSettings.hero_bg_video || '';

  /* ─── Bracket picker state ─── */
  const [showBracketPicker, setShowBracketPicker] = useState(false);

  /* ─── Compute stats ─── */
  const malePlayers = maleData?.totalPlayers || 0;
  const femalePlayers = femaleData?.totalPlayers || 0;

  /* ─── Particles ─── */
  const particles = useParticles(28);

  return (
    <>
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        aria-label="Tarkam IDM Hero"
      >
        {/* ── Background Layers ── */}

        {/* Base: Deep dark gradient — parallax slow layer */}
        <div
          className="absolute inset-0 parallax-hero-bg"
          style={{
            background: `linear-gradient(180deg, #0a0a14 0%, #0d0d1a 40%, #0c0a06 100%)`,
          }}
        />

        {/* CMS Video Background — takes priority over images when set */}
        {heroBgVideo ? (
          (() => {
            // Detect YouTube URL and extract video ID + optional start time
            const ytMatch = heroBgVideo.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            const startTimeMatch = heroBgVideo.match(/[?&]t=(\d+)/);
            const startTime = startTimeMatch ? `&start=${startTimeMatch[1]}` : '';

            if (ytMatch) {
              // YouTube embed — autoplay, muted, loop, no controls
              return (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0" style={{ width: '177.78vh', height: '56.25vw', minWidth: '100%', minHeight: '100%', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3${startTime}`}
                      title="Hero background video"
                      allow="autoplay; encrypted-media"
                      className="w-full h-full"
                      style={{ border: 'none', opacity: 0.3 }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            }
            // Direct video URL (MP4, WebM, etc.)
            return (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                  aria-hidden="true"
                >
                  <source src={heroBgVideo} type="video/mp4" />
                  <source src={heroBgVideo} type="video/webm" />
                </video>
              </div>
            );
          })()
        ) : (
          /* Fallback: CMS Background Images (only shown when no video) */
          (heroBgDesktop || heroBgMobile) ? (
            <>
              {heroBgDesktop && (
                <div className="absolute inset-0 hidden sm:block">
                  <Image src={heroBgDesktop} alt="" fill priority sizes="100vw" className="object-cover opacity-30" aria-hidden="true" />
                </div>
              )}
              {heroBgMobile && (
                <div className="absolute inset-0 sm:hidden">
                  <Image src={heroBgMobile} alt="" fill priority sizes="100vw" className="object-cover object-top opacity-30" aria-hidden="true" />
                </div>
              )}
            </>
          ) : null
        )}

        {/* Mid-depth radial gold haze — parallax mid layer */}
        {!heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none parallax-hero-mid"
            style={{
              background: 'radial-gradient(ellipse at 50% 45%, rgba(212,168,83,0.07) 0%, transparent 65%)',
            }}
          />
        )}

        {/* Top-left cyan glow (Male) — parallax slow layer */}
        {!heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none parallax-hero-slow"
            style={{
              background: 'radial-gradient(ellipse at 15% 30%, rgba(6,182,212,0.04) 0%, transparent 50%)',
            }}
          />
        )}

        {/* Bottom-right purple glow (Female) — parallax slow layer */}
        {!heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none parallax-hero-slow"
            style={{
              background: 'radial-gradient(ellipse at 85% 70%, rgba(168,85,247,0.04) 0%, transparent 50%)',
            }}
          />
        )}

        {/* Vignette overlay — ALWAYS visible (keeps text readable over video/images) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: heroBgVideo
              ? 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)'
              : 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* Grid overlay — subtle esports tech feel — only when no video */}
        {!heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        )}

        {/* ── Floating Particles — parallax fastest layer ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden parallax-particles" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full hero-particle"
              style={{
                left: `${p.x}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(212,168,83,${p.opacity}) 0%, rgba(212,168,83,${p.opacity * 0.3}) 60%, transparent 100%)`,
                boxShadow: `0 0 ${p.size * 3}px rgba(212,168,83,${p.opacity * 0.3})`,
                '--duration': `${p.duration}s`,
                '--delay': `${p.delay}s`,
                '--p-opacity': p.opacity,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* ═══════════════ HERO CONTENT ═══════════════ */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-center py-20 sm:py-24">

          {/* ── Decorative top accent ── */}
          <div className="hero-enter-1 mb-5 sm:mb-7">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-idm-gold-warm/50" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/[0.06]">
                <Star className="w-3 h-3 text-idm-gold-warm/80" />
                <span className="text-[10px] sm:text-[11px] text-idm-gold-warm/80 font-bold tracking-[0.2em] uppercase">
                  {siteTitle}
                </span>
                <Star className="w-3 h-3 text-idm-gold-warm/80" />
              </div>
              <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-idm-gold-warm/50" />
            </div>
          </div>

          {/* ── Main Title — Gold gradient ── */}
          <div className="hero-enter-2 relative mb-3 sm:mb-4">
            {/* Breathing glow behind title */}
            <div
              className="absolute inset-0 -top-8 -bottom-8 pointer-events-none animate-pulse"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.08) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            <h1
              className="relative text-5xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase leading-[1.05]"
              style={{
                background: 'linear-gradient(135deg, #f5e6c8 0%, #d4a853 30%, #e5be4a 50%, #f5d77a 70%, #d4a853 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 12px rgba(212,168,83,0.15))',
              }}
            >
              {heroTitle}
            </h1>

            {/* Animated underline */}
            <div className="hero-underline mx-auto mt-3 sm:mt-4 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #d4a853, transparent)' }} />
          </div>

          {/* ── Subtitle ── */}
          <p className="hero-enter-3 text-base sm:text-xl lg:text-2xl text-[#e8d5a3]/80 font-light tracking-widest uppercase mb-2">
            {heroSubtitle}
          </p>

          {/* ── Tagline ── */}
          <p className="hero-enter-4 text-sm sm:text-base text-muted-foreground/70 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            {heroTagline}
          </p>

          {/* ═══════════════ CTA BUTTONS ═══════════════ */}
          <div className="hero-enter-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-lg mx-auto mb-8 sm:mb-10">
            {/* Pendaftaran — Primary CTA → Registration */}
            <button
              onClick={onRegister}
              className="btn-press group relative w-full sm:w-auto cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a14]"
            >
              {/* Glow background */}
              <div className="absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-500" style={{ background: 'rgba(16,185,129,0.25)' }} />
              <div className="relative flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide uppercase transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <UserPlus className="w-4 h-4" />
                Pendaftaran
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Lihat Bracket — Secondary CTA → Bracket Picker */}
            <button
              onClick={() => setShowBracketPicker(true)}
              className="btn-press group relative w-full sm:w-auto cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-idm-gold-warm/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a14]"
            >
              {/* Glow on hover */}
              <div className="absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500" style={{ background: 'rgba(212,168,83,0.15)' }} />
              <div className="relative flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide uppercase border transition-all duration-300"
                style={{
                  background: 'rgba(212,168,83,0.08)',
                  borderColor: 'rgba(212,168,83,0.3)',
                  color: '#d4a853',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(212,168,83,0.1)',
                }}
              >
                <Eye className="w-4 h-4" />
                Lihat Bracket
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* ═══════════════ BRACKET DIVISION PICKER ═══════════════ */}
          {showBracketPicker && (
            <div className="w-full max-w-sm mx-auto mb-8 sm:mb-10" style={{ animation: 'reveal-fade-up 0.25s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div className="relative rounded-2xl border border-idm-gold-warm/20 bg-[#0d0d1a]/95 p-4 shadow-2xl">
                  {/* Close hint */}
                  <button
                    onClick={() => setShowBracketPicker(false)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close picker"
                  >
                    ✕
                  </button>

                  <p className="text-xs text-idm-gold-warm/70 uppercase tracking-wider font-bold text-center mb-3">Pilih Divisi</p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Male */}
                    <button
                      onClick={() => { setShowBracketPicker(false); onViewBracket('male'); }}
                      className="btn-press group relative flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all duration-300"
                      style={{
                        background: 'rgba(6,182,212,0.06)',
                        borderColor: 'rgba(6,182,212,0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(6,182,212,0.5)';
                        e.currentTarget.style.background = 'rgba(6,182,212,0.12)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(6,182,212,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(6,182,212,0.2)';
                        e.currentTarget.style.background = 'rgba(6,182,212,0.06)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                        <Zap className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-cyan-400">Male</span>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{malePlayers} Players</p>
                      </div>
                    </button>

                    {/* Female */}
                    <button
                      onClick={() => { setShowBracketPicker(false); onViewBracket('female'); }}
                      className="btn-press group relative flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all duration-300"
                      style={{
                        background: 'rgba(168,85,247,0.06)',
                        borderColor: 'rgba(168,85,247,0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)';
                        e.currentTarget.style.background = 'rgba(168,85,247,0.12)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(168,85,247,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)';
                        e.currentTarget.style.background = 'rgba(168,85,247,0.06)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
                        <Star className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-purple-400">Female</span>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{femalePlayers} Players</p>
                      </div>
                    </button>
                  </div>
              </div>
            </div>
          )}


        </div>

        {/* ── Scroll Indicator ── */}
        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10" style={{ animation: 'reveal-fade-up 0.5s 2s cubic-bezier(0.16,1,0.3,1) both' }} aria-hidden="true">
          <div className="scroll-bounce flex flex-col items-center gap-2">
            <span className="text-[10px] text-idm-gold-warm/40 uppercase tracking-[0.2em] font-semibold">Explore</span>
            <div className="w-6 h-10 rounded-full border-2 border-idm-gold-warm/15 flex items-start justify-center p-1.5">
              <div className="scroll-dot w-1.5 h-1.5 rounded-full bg-idm-gold-warm/50" />
            </div>
          </div>
        </div>

        {/* Bottom fade gradient to next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to top, #0c0a06, transparent)',
          }}
        />
      </section>

      {/* ═══════════════ MARQUEE TICKER ═══════════════ */}
      <div className="relative z-40 py-2.5 bg-background/90 border-y border-idm-gold-warm/10">
        <MarqueeTicker maleData={maleData} femaleData={femaleData} leagueData={leagueData} />
      </div>
    </>
  );
}
