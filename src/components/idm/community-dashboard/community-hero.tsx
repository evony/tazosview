'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Users,
  Swords,
  Building2,
  Radio,
  UserPlus,
  Eye,
  Gift,
  ArrowRight,
  Calendar,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useBackgroundImages } from '@/hooks/use-background-images';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

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
   Status Badge — Challonge-style tournament status indicator
   ═══════════════════════════════════════════════════════ */
type TournamentStatus = 'live' | 'registration' | 'completed' | 'offseason';

interface StatusBadgeConfig {
  label: string;
  dotClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: typeof Radio;
}

const STATUS_CONFIG: Record<TournamentStatus, StatusBadgeConfig> = {
  live: {
    label: 'LIVE NOW',
    dotClass: 'bg-red-500',
    bgClass: 'bg-red-500/12',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-400',
    icon: Radio,
  },
  registration: {
    label: 'REGISTRATION',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-500/12',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-400',
    icon: UserPlus,
  },
  completed: {
    label: 'COMPLETED',
    dotClass: 'bg-emerald-500',
    bgClass: 'bg-emerald-500/12',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-400',
    icon: Trophy,
  },
  offseason: {
    label: 'OFFSEASON',
    dotClass: 'bg-gray-500',
    bgClass: 'bg-gray-500/12',
    borderClass: 'border-gray-500/30',
    textClass: 'text-gray-400',
    icon: Calendar,
  },
};

function StatusBadge({ status }: { status: TournamentStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isLive = status === 'live';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bgClass} ${config.borderClass}`}
    >
      <span className="relative flex h-2 w-2">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotClass}`} />
      </span>
      <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] ${config.textClass}`}>
        {config.label}
      </span>
      <Icon className={`w-3 h-3 ${config.textClass}`} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Season Progress Bar — Visual week X/Y indicator
   ═══════════════════════════════════════════════════════ */
function SeasonProgressBar({
  completedWeeks,
  totalWeeks,
  seasonName,
}: {
  completedWeeks: number;
  totalWeeks: number;
  seasonName?: string;
}) {
  const percentage = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {seasonName || 'Season Progress'}
        </span>
        <span className="text-[10px] sm:text-xs font-bold text-idm-gold-warm">
          {completedWeeks}/{totalWeeks} Weeks · {percentage}%
        </span>
      </div>
      <div className="h-1.5 sm:h-2 rounded-full bg-idm-gold-warm/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            background:
              percentage > 0
                ? 'linear-gradient(90deg, #d4a853, #e5be4a, #f5d77a)'
                : undefined,
            boxShadow: percentage > 0 ? '0 0 8px rgba(212,168,83,0.3)' : undefined,
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Stat Pill — Compact stat display in badge/card style
   ═══════════════════════════════════════════════════════ */
function StatPill({
  icon: Icon,
  value,
  label,
  colorClass,
  bgColorClass,
}: {
  icon: typeof Trophy;
  value: number;
  label: string;
  colorClass: string;
  bgColorClass: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-border/50 ${bgColorClass} min-w-[72px] sm:min-w-[88px]`}
    >
      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} />
      <span className={`text-base sm:text-lg font-black tabular-nums ${colorClass}`}>
        <AnimatedNumber value={value} />
      </span>
      <span className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Division Card — Per-division tournament status card
   ═══════════════════════════════════════════════════════ */
function DivisionCard({
  division,
  data,
  onAction,
}: {
  division: 'male' | 'female';
  data?: StatsData;
  onAction: () => void;
}) {
  const isMale = division === 'male';
  const accentText = isMale ? 'text-cyan-400' : 'text-purple-400';
  const accentBg = isMale ? 'bg-cyan-500/8' : 'bg-purple-500/8';
  const accentBorder = isMale ? 'border-cyan-500/20' : 'border-purple-500/20';
  const accentGlow = isMale ? 'rgba(34,211,238,0.15)' : 'rgba(192,132,252,0.15)';
  const accentCtaBg = isMale ? 'bg-cyan-500/20' : 'bg-purple-500/20';
  const accentCtaBorder = isMale ? 'border-cyan-500/30' : 'border-purple-500/30';
  const accentCtaHover = isMale ? 'hover:bg-cyan-500/30' : 'hover:bg-purple-500/30';
  const divisionLabel = isMale ? 'MALE DIVISION' : 'FEMALE DIVISION';

  const tournament = data?.activeTournament;
  const status: TournamentStatus = tournament
    ? (tournament.status as TournamentStatus)
    : 'offseason';
  const players = data?.totalPlayers || 0;
  const prizePool = data?.totalPrizePool || 0;

  // Determine CTA label based on status
  const ctaConfig = (() => {
    switch (status) {
      case 'registration':
        return { label: 'Daftar Sekarang', icon: UserPlus, variant: 'gold' as const };
      case 'live':
        return { label: 'Lihat Match', icon: Eye, variant: 'accent' as const };
      case 'completed':
        return { label: 'Lihat Hasil', icon: Trophy, variant: 'muted' as const };
      default:
        return { label: 'Daftar Tarkam', icon: UserPlus, variant: 'muted' as const };
    }
  })();

  const CtaIcon = ctaConfig.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${accentBorder} ${accentBg} p-3 sm:p-4 transition-all duration-200 hover:border-opacity-40`}
      style={{
        boxShadow: status === 'live' ? `0 0 20px ${accentGlow}` : undefined,
      }}
    >
      {/* Division header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Swords className={`w-3.5 h-3.5 ${accentText}`} />
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${accentText}`}>
            {divisionLabel}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Tournament info */}
      <div className="mb-3">
        <h3 className="text-sm sm:text-base font-bold text-foreground/90 truncate">
          {tournament?.name || 'Belum ada turnamen'}
        </h3>
        {tournament?.weekNumber && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            <Zap className="w-3 h-3 inline mr-0.5" />
            Week {tournament.weekNumber}
          </p>
        )}
      </div>

      {/* Mini stats row */}
      <div className="flex items-center gap-3 mb-3 text-[10px] sm:text-xs">
        {players > 0 && (
          <span className={`flex items-center gap-1 ${accentText} font-semibold`}>
            <Users className="w-3 h-3" />
            {players}
          </span>
        )}
        {prizePool > 0 && (
          <span className="flex items-center gap-1 text-idm-gold-warm font-semibold">
            <Trophy className="w-3 h-3" />
            {prizePool.toLocaleString('id-ID')}
          </span>
        )}
      </div>

      {/* CTA button */}
      <button
        onClick={onAction}
        className={`group w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
          ctaConfig.variant === 'gold'
            ? 'bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:shadow-[0_0_16px_rgba(229,190,74,0.3)]'
            : ctaConfig.variant === 'accent'
              ? `${accentCtaBg} border ${accentCtaBorder} ${accentText} ${accentCtaHover}`
              : 'bg-white/5 border border-border/50 text-muted-foreground hover:bg-white/10 hover:text-foreground'
        }`}
      >
        <CtaIcon className="w-3.5 h-3.5" />
        <span>{ctaConfig.label}</span>
        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMMUNITY HERO — Challonge-style tournament-centric banner
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
  const { heroBannerDashboard } = useBackgroundImages();

  // Extract data
  const malePlayers = maleData?.totalPlayers || 0;
  const femalePlayers = femaleData?.totalPlayers || 0;
  const combinedPrizePool = (maleData?.totalPrizePool || 0) + (femaleData?.totalPrizePool || 0);
  const totalClubs = leagueData?.stats?.totalClubs || 0;
  const totalMatches = leagueData?.stats?.totalMatches || 0;

  // Season progress (use male data as reference — both divisions share the same season)
  const seasonProgress = maleData?.seasonProgress || femaleData?.seasonProgress;
  const completedWeeks = seasonProgress?.completedWeeks || 0;
  const totalWeeks = seasonProgress?.totalWeeks || 10;
  const seasonName =
    maleData?.season?.name?.replace(/\s*[-–]\s*(Male|Female)\s*$/i, '') ||
    femaleData?.season?.name?.replace(/\s*[-–]\s*(Male|Female)\s*$/i, '');

  // Determine overall status — pick the most "active" status
  const overallStatus: TournamentStatus = (() => {
    const statuses = [maleData?.activeTournament?.status, femaleData?.activeTournament?.status];
    if (statuses.includes('live')) return 'live';
    if (statuses.includes('registration')) return 'registration';
    if (statuses.includes('completed')) return 'completed';
    return 'offseason';
  })();

  const hasLive = overallStatus === 'live';
  const isRegistrationOpen = overallStatus === 'registration';
  const isOffseason = overallStatus === 'offseason';

  // Store action helpers
  const goToMaleMatches = () => {
    setDivision('male');
    setInitialDashboardTab('matches');
    setCurrentView('dashboard');
  };

  const goToFemaleMatches = () => {
    setDivision('female');
    setInitialDashboardTab('matches');
    setCurrentView('dashboard');
  };

  const goToRegister = () => {
    setCurrentView('register');
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-idm-gold-warm/15"
      aria-label="Community tournament banner"
    >
      {/* ═══ Background Layers ═══ */}
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, #0a0a14 0%, #0d0d1a 35%, #0c0a06 70%, #0a0a14 100%)`,
        }}
      />

      {/* Subtle background image from CMS — very low opacity, just texture */}
      {heroBannerDashboard && (
        <Image
          src={getOptimizedCloudinaryUrl(heroBannerDashboard, 1200)}
          alt=""
          fill
          sizes="100vw"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-15 pointer-events-none"
          aria-hidden="true"
          priority={false}
          unoptimized
        />
      )}

      {/* Dark overlay to ensure text readability over image */}
      {heroBannerDashboard && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,10,20,0.6) 0%, rgba(10,10,20,0.75) 50%, rgba(10,10,20,0.85) 100%)',
          }}
        />
      )}

      {/* Gold radial haze — subtle premium glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(212,168,83,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Male glow — left side */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 15% 40%, rgba(34,211,238,0.04) 0%, transparent 50%)',
        }}
      />

      {/* Female glow — right side */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 85% 40%, rgba(192,132,252,0.04) 0%, transparent 50%)',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ═══ Content ═══ */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* ── Top Row: Status Badge + Season Name + Week ── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <StatusBadge status={overallStatus} />

          <span className="hidden sm:inline text-border/40">·</span>

          {/* Season name */}
          <h2
            className="text-xs sm:text-sm font-black uppercase tracking-wider"
            style={{
              background:
                'linear-gradient(135deg, #f5e6c8 0%, #d4a853 50%, #f5d77a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {seasonName || 'IDM TARKAM'}
          </h2>

          <span className="hidden sm:inline text-border/40">·</span>

          {/* Week indicator */}
          <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">
            Week {completedWeeks}/{totalWeeks}
          </span>

          {/* Live matches indicator */}
          {hasLive && leagueData?.stats?.liveMatches ? (
            <>
              <span className="hidden sm:inline text-border/40">·</span>
              <span className="text-[10px] sm:text-xs text-red-400 font-bold flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                {leagueData.stats.liveMatches} Live Match{leagueData.stats.liveMatches > 1 ? 'es' : ''}
              </span>
            </>
          ) : null}
        </div>

        {/* ── Divider ── */}
        <div
          className="h-px mb-4 sm:mb-5"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.2), transparent)',
          }}
        />

        {/* ── Two-Column Layout: Division Cards + Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-6 mb-4 sm:mb-5">
          {/* Left column: Division cards */}
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <DivisionCard
                division="male"
                data={maleData}
                onAction={
                  maleData?.activeTournament?.status === 'registration'
                    ? goToRegister
                    : goToMaleMatches
                }
              />
              <DivisionCard
                division="female"
                data={femaleData}
                onAction={
                  femaleData?.activeTournament?.status === 'registration'
                    ? goToRegister
                    : goToFemaleMatches
                }
              />
            </div>
          </div>

          {/* Right column: Quick stats grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-1 lg:grid-rows-5 gap-2 sm:gap-2.5">
            <StatPill
              icon={Trophy}
              value={combinedPrizePool}
              label="Prize"
              colorClass="text-idm-gold-warm"
              bgColorClass="bg-idm-gold-warm/[0.04]"
            />
            <StatPill
              icon={Users}
              value={malePlayers}
              label="Male"
              colorClass="text-cyan-400"
              bgColorClass="bg-cyan-500/[0.04]"
            />
            <StatPill
              icon={Users}
              value={femalePlayers}
              label="Female"
              colorClass="text-purple-400"
              bgColorClass="bg-purple-500/[0.04]"
            />
            <StatPill
              icon={Building2}
              value={totalClubs}
              label="Clubs"
              colorClass="text-emerald-400"
              bgColorClass="bg-emerald-500/[0.04]"
            />
            <StatPill
              icon={Swords}
              value={totalMatches}
              label="Matches"
              colorClass="text-idm-gold-warm/80"
              bgColorClass="bg-idm-gold-warm/[0.03]"
            />
          </div>
        </div>

        {/* ── Season Progress Bar ── */}
        <div className="mb-4 sm:mb-5">
          <SeasonProgressBar
            completedWeeks={completedWeeks}
            totalWeeks={totalWeeks}
            seasonName={seasonName}
          />
        </div>

        {/* ── Divider ── */}
        <div
          className="h-px mb-4 sm:mb-5"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.15), transparent)',
          }}
        />

        {/* ── CTA Row ── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Primary CTA — context-aware */}
          {isRegistrationOpen && (
            <button
              onClick={goToRegister}
              className="group flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:shadow-[0_0_24px_rgba(229,190,74,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {hasLive && (
            <button
              onClick={() => {
                setDivision('male');
                setInitialDashboardTab('matches');
                setCurrentView('dashboard');
              }}
              className="group flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:shadow-[0_0_16px_rgba(239,68,68,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Lihat Match</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {overallStatus === 'completed' && (
            <button
              onClick={() => {
                setDivision('male');
                setInitialDashboardTab('matches');
                setCurrentView('dashboard');
              }}
              className="group flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Lihat Hasil</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {isOffseason && !onSawer && (
            <button
              onClick={goToRegister}
              className="group flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white/5 border border-border/50 text-muted-foreground hover:bg-white/10 hover:text-foreground hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Tarkam</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Sawer CTA — always visible when callback provided */}
          {onSawer && (
            <button
              onClick={onSawer}
              className="group flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-idm-gold-warm/10 border border-idm-gold-warm/20 text-idm-gold-warm hover:bg-idm-gold-warm/20 hover:shadow-[0_0_16px_rgba(212,168,83,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>Sawer Prize Pool</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
