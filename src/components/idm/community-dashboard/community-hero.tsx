'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Users, Radio, Trophy, Zap, ArrowRight, UserPlus, Eye, Gift } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useBackgroundImages } from '@/hooks/use-background-images';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   Floating Particle System — Premium animated background
   ═══════════════════════════════════════════════════════ */
interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function useParticles(count: number): Particle[] {
  return useMemo(
    () =>
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

/* ═══════════════════════════════════════════════════════
   Animated Number — count-up with ease-out cubic
   ═══════════════════════════════════════════════════════ */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    const startTime = performance.now();
    const diff = end - start;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    ref.current = value;
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display.toLocaleString('id-ID')}</>;
}

/* ═══════════════════════════════════════════════════════
   COMMUNITY HERO — Immersive esports-grade banner
   ═══════════════════════════════════════════════════════ */
interface CommunityHeroProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  leagueData?: {
    stats?: {
      totalClubs: number;
      totalMatches: number;
      completedMatches: number;
      liveMatches: number;
    };
  };
  onSawer?: () => void;
}

export function CommunityHero({ maleData, femaleData, leagueData, onSawer }: CommunityHeroProps) {
  const { setCurrentView, setDivision, setInitialDashboardTab } = useAppStore();
  const malePlayers = maleData?.totalPlayers || 0;
  const femalePlayers = femaleData?.totalPlayers || 0;
  const hasLive =
    maleData?.activeTournament?.status === 'live' || femaleData?.activeTournament?.status === 'live';
  const activeTournaments = [maleData?.activeTournament, femaleData?.activeTournament].filter(
    Boolean
  ).length;
  const { heroBannerDashboard } = useBackgroundImages();
  const particles = useParticles(18);

  // Season progress — use male data as reference (both divisions share the same season)
  const seasonProgress = maleData?.seasonProgress || femaleData?.seasonProgress;
  const currentWeek = seasonProgress?.completedWeeks || 0;
  const totalWeeks = seasonProgress?.totalWeeks || 10;

  // Combined prize pool from both divisions
  const combinedPrizePool = (maleData?.totalPrizePool || 0) + (femaleData?.totalPrizePool || 0);

  // Check if registration is open in any division
  const isRegistrationOpen =
    maleData?.activeTournament?.status === 'registration' ||
    femaleData?.activeTournament?.status === 'registration';

  // Check if there are any brackets (live or completed tournaments)
  const hasBrackets =
    maleData?.activeTournament?.status === 'live' ||
    maleData?.activeTournament?.status === 'completed' ||
    femaleData?.activeTournament?.status === 'live' ||
    femaleData?.activeTournament?.status === 'completed';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-idm-gold-warm/20">
      {/* ═══ Background Layers ═══ */}
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #0a0a14 0%, #0d0d1a 40%, #0c0a06 100%)`,
        }}
      />

      {/* Hero banner background image (from CMS) — object-contain so text in image is fully visible */}
      {heroBannerDashboard && (
        <img
          src={heroBannerDashboard}
          alt=""
          className="absolute inset-0 w-full h-full object-contain object-center opacity-40 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Dark scrim — ensures text readability over background image */}
      {heroBannerDashboard && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,10,20,0.3) 0%, rgba(10,10,20,0.55) 40%, rgba(10,10,20,0.75) 100%)',
          }}
        />
      )}

      {/* Gold radial haze */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(212,168,83,0.08) 0%, transparent 65%)',
        }}
      />

      {/* Male glow — top-left */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 30%, rgba(6,182,212,0.05) 0%, transparent 50%)',
        }}
      />

      {/* Female glow — bottom-right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.05) 0%, transparent 50%)',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ═══ Floating Particles ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, rgba(212,168,83,${p.opacity}) 0%, rgba(212,168,83,${p.opacity * 0.3}) 60%, transparent 100%)`,
              boxShadow: `0 0 ${p.size * 3}px rgba(212,168,83,${p.opacity * 0.3})`,
            }}
            animate={{
              y: ['100%', '-10%'],
              opacity: [0, p.opacity, p.opacity, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* ═══ Content ═══ */}
      <div className="relative z-10 p-6 sm:p-8 pb-16 sm:pb-16">
        {/* Live badge */}
        {hasLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 border border-red-500/30 mb-5"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-black text-red-400 uppercase tracking-[0.2em]">
              LIVE NOW
            </span>
            <Radio className="w-3.5 h-3.5 text-red-400" />
          </motion.div>
        )}

        {/* Decorative top accent */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-idm-gold-warm/50" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/[0.06]">
            <Zap className="w-3 h-3 text-idm-gold-warm/80" />
            <span className="text-[10px] text-idm-gold-warm font-bold tracking-[0.15em] uppercase">
              IDM TARKAM
            </span>
          </div>
          <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-idm-gold-warm/50" />
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-3xl sm:text-5xl font-black tracking-tight mb-2"
          style={{
            background:
              'linear-gradient(135deg, #f5e6c8 0%, #d4a853 30%, #e5be4a 50%, #f5d77a 70%, #d4a853 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 12px rgba(212,168,83,0.4)) drop-shadow(0 0 30px rgba(212,168,83,0.2))',
          }}
        >
          KOMUNITAS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.3em' }}
          animate={{ opacity: 1, letterSpacing: '0.12em' }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-sm sm:text-base text-idm-gold-warm/85 uppercase tracking-widest mb-1"
        >
          Komunitas Idol Meta
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-xs sm:text-sm text-muted-foreground/80 max-w-md mb-6"
        >
          Tempat pemain terbaik dari seluruh kota berkompetisi. Sawer untuk menambah prize pool dan dapatkan skin eksklusif!
        </motion.p>

        {/* Animated underline */}
        <motion.div
          className="h-[1.5px] rounded-full mb-5"
          style={{
            background: 'linear-gradient(90deg, transparent, #d4a853, transparent)',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '50%', opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        />

        {/* ═══ CTA Buttons — Pendaftaran + Lihat Bracket ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          {/* Pendaftaran button — shown when registration is open */}
          {isRegistrationOpen && (
            <button
              onClick={() => setCurrentView('register')}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-400 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Pendaftaran</span>
              <span className="relative flex items-center justify-center ml-0.5">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          )}

          {/* Lihat Bracket button — shown when brackets exist */}
          {hasBrackets && (
            <button
              onClick={() => {
                setDivision('male');
                setInitialDashboardTab('matches');
                setCurrentView('dashboard');
              }}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:shadow-[0_0_20px_rgba(229,190,74,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Lihat Bracket</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Sawer CTA button — always visible */}
          {onSawer && (
            <button
              onClick={onSawer}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:shadow-[0_0_20px_rgba(229,190,74,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>Sawer</span>
            </button>
          )}

          {/* If neither is available, show a subtle info */}
          {!isRegistrationOpen && !hasBrackets && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-idm-gold-warm/50" />
              <span>Turnamen segera dimulai</span>
            </div>
          )}
        </motion.div>

        {/* Quick stats row — dynamic & unique from stats section below */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-wrap items-center gap-4 sm:gap-6"
        >
          {/* Prize Pool — MOST PROMINENT stat */}
          {combinedPrizePool > 0 && (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-idm-gold-warm" />
                </div>
                <div>
                  <p
                    className="text-xl sm:text-2xl font-black text-idm-gold-warm"
                    style={{
                      textShadow: '0 0 20px rgba(212,168,83,0.4), 0 0 40px rgba(212,168,83,0.15)',
                    }}
                  >
                    <AnimatedNumber value={combinedPrizePool} duration={1800} />
                  </p>
                  <p className="text-[9px] text-idm-gold-warm/70 uppercase tracking-wider font-semibold">
                    Prize Pool
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-border/30" />
            </>
          )}

          {/* Male Players */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-cyan-400">
                <AnimatedNumber value={malePlayers} />
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                Male
              </p>
            </div>
          </div>

          <div className="w-px h-8 bg-border/30" />

          {/* Female Players */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-purple-400">
                <AnimatedNumber value={femalePlayers} />
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                Female
              </p>
            </div>
          </div>

          <div className="w-px h-8 bg-border/30" />

          {/* Season Progress — current week / total weeks */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black">
                <span className="text-emerald-400"><AnimatedNumber value={currentWeek} /></span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-muted-foreground/70">{totalWeeks}</span>
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                Season Week
              </p>
            </div>
          </div>

          <div className="w-px h-8 bg-border/30 hidden sm:block" />

          {/* Turnamen Aktif */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-idm-gold-warm" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-idm-gold-warm">{activeTournaments}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                Turnamen Aktif
              </p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
