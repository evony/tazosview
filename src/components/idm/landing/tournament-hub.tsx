'use client';

import { Swords, Music, Shield, Crown, Users, Building2, Gamepad2, ArrowRight, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection, SectionHeader } from './shared';
import { formatCurrency } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

interface TournamentHubProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
}

/* ────────────────────────── Division Config ────────────────────────── */
const DIVISION = {
  male: {
    key: 'male' as const,
    title: 'Male Tarkam',
    icon: Music,
    color: '#06b6d4',
    colorLight: '#22d3ee',
    colorRgb: '6,182,212',
    gradient: 'from-cyan-600/40 via-cyan-800/30 to-[#0d0d1a]',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/25',
    iconBg: 'bg-cyan-500/10 border-cyan-500/25',
    ctaBg: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20',
    statBg: 'bg-cyan-500/[0.06] border-cyan-500/10',
    hoverBorder: 'rgba(6,182,212,0.3)',
    hoverShadow: '0 8px 40px rgba(6,182,212,0.15)',
    patternOpacity: 'opacity-[0.04]',
  },
  female: {
    key: 'female' as const,
    title: 'Female Tarkam',
    icon: Shield,
    color: '#a855f7',
    colorLight: '#c084fc',
    colorRgb: '168,85,247',
    gradient: 'from-purple-600/40 via-purple-800/30 to-[#0d0d1a]',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/25',
    iconBg: 'bg-purple-500/10 border-purple-500/25',
    ctaBg: 'bg-purple-500/10 border-purple-500/25 text-purple-400 hover:bg-purple-500/20',
    statBg: 'bg-purple-500/[0.06] border-purple-500/10',
    hoverBorder: 'rgba(168,85,247,0.3)',
    hoverShadow: '0 8px 40px rgba(168,85,247,0.15)',
    patternOpacity: 'opacity-[0.04]',
  },
} as const;

/* ────────────────────────── Tournament Card ────────────────────────── */
function TournamentCard({
  division,
  data,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onVideoPlay,
}: {
  division: typeof DIVISION.male | typeof DIVISION.female;
  data: StatsData | undefined;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
}) {
  const Icon = division.icon;
  const weeklyCount = data?.seasonProgress?.completedWeeks || 0;
  const totalPlayers = data?.totalPlayers || 0;
  const totalClubs = data?.clubs?.length || 0;
  const totalMatches = data?.recentMatches?.length || 0;
  const prizePool = data?.totalPrizePool || 0;

  // CMS text fields with fallbacks
  const cardTitle = cmsSettings?.[`kompetisi_${division.key}_title`] || division.title;
  const cardBadge = cmsSettings?.[`kompetisi_${division.key}_badge`] || 'Weekly Tournament';
  const cardFormat = cmsSettings?.[`kompetisi_${division.key}_format`] || 'Bracket elimination — 1 tim, 3 pemain';
  const cardDescription = cmsSettings?.[`kompetisi_${division.key}_description`] ||
    `Turnamen mingguan dengan format bracket elimination. Peserta tarkam ${division.key === 'male' ? 'putra' : 'putri'} bertanding setiap minggu. Juara weekly berhak atas prize pool dan gelar champion.`;

  // Video URL extraction
  const videoUrl =
    cmsSettings?.[`kompetisi_${division.key}_video_url`] ||
    cmsSections.kompetisi?.cards?.find(
      (c: { division?: string; videoUrl?: string }) => c.division === division.key && c.videoUrl
    )?.videoUrl;

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-[#0d0d1a] border border-[rgba(212,168,83,0.1)] hover:border-[rgba(var(--hover-border-rgb),0.3)] transition-all duration-500 hover:scale-[1.02]"
      style={
        {
          '--hover-border-rgb': division.colorRgb,
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = division.hoverBorder;
        el.style.boxShadow = division.hoverShadow;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'rgba(212,168,83,0.1)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* ── Image Area ── */}
      <div className={`relative h-48 bg-gradient-to-br ${division.gradient} overflow-hidden`}>
        {/* Pattern overlay */}
        <div
          className={`absolute inset-0 ${division.patternOpacity}`}
          style={{
            backgroundImage: `radial-gradient(circle, ${division.color} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Large watermark icon */}
        <Icon
          className="absolute -right-6 -bottom-6 w-40 h-40 text-white/[0.04]"
          strokeWidth={0.5}
        />

        {/* Decorative grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${division.color} 1px, transparent 1px), linear-gradient(90deg, ${division.color} 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Badge overlay — top left */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${division.badgeBg} border ${division.badgeBorder}`}
          >
            <Swords className="w-3 h-3 text-[#d4a853]" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${division.badgeText}`}>
              {cardBadge}
            </span>
          </div>
        </div>

        {/* Tournament count — top right */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/[0.06]">
            <Gamepad2 className="w-3 h-3 text-[#d4a853]" />
            <span className="text-[10px] font-bold text-white/80">
              {weeklyCount} Week{weeklyCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Video play button — premium pulsing design */}
        {videoUrl && onVideoPlay && (
          <button
            onClick={() => onVideoPlay(videoUrl, cardTitle)}
            className="absolute bottom-4 right-4 z-10 group/play cursor-pointer"
            aria-label={`Play ${division.title} video`}
          >
            {/* Outer pulsing ring */}
            <span className="absolute inset-0 rounded-full play-btn-pulse-ring" style={{ background: `rgba(${division.colorRgb},0.25)` }} />
            {/* Mid glow */}
            <span className="absolute -inset-1.5 rounded-full play-btn-pulse-glow" style={{ background: `radial-gradient(circle, rgba(${division.colorRgb},0.2) 0%, transparent 70%)` }} />
            {/* Button body */}
            <span className="relative flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-sm border transition-all duration-300 group-hover/play:scale-110 group-hover/play:border-[rgba(212,168,83,0.5)]"
              style={{
                background: `linear-gradient(135deg, rgba(${division.colorRgb},0.25) 0%, rgba(0,0,0,0.7) 100%)`,
                borderColor: `rgba(${division.colorRgb},0.35)`,
                boxShadow: `0 0 20px rgba(${division.colorRgb},0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              <Play className="w-4 h-4 text-white fill-white ml-0.5 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
            </span>
            {/* Label tooltip on hover */}
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider text-white/80 bg-black/70 px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/play:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              Watch Video
            </span>
          </button>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d1a] to-transparent" />

        {/* Subtle shine sweep on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(105deg, transparent 40%, rgba(${division.colorRgb},0.05) 45%, rgba(${division.colorRgb},0.1) 50%, rgba(${division.colorRgb},0.05) 55%, transparent 60%)`,
              transform: 'translateX(-100%)',
              animation: 'card-shine-sweep 1.5s ease-in-out forwards',
            }}
          />
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="p-5">
        {/* Icon + Title row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-lg ${division.iconBg} flex items-center justify-center shrink-0`}
            style={{ boxShadow: `0 0 20px rgba(${division.colorRgb},0.1)` }}
          >
            <Icon className="w-5 h-5 tournament-icon-pulse" style={{ color: division.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{cardTitle}</h3>
            <p className="text-[11px] text-[#a09880]">{cardFormat}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#a09880] leading-relaxed mb-4">
          {cardDescription}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className={`p-2.5 rounded-lg ${division.statBg} border text-center`}>
            <p className="text-base font-bold" style={{ color: division.color }}>
              {totalPlayers}
            </p>
            <p className="text-[10px] text-[#a09880] flex items-center justify-center gap-1">
              <Users className="w-2.5 h-2.5" />
              Pemain
            </p>
          </div>
          <div className={`p-2.5 rounded-lg ${division.statBg} border text-center`}>
            <p className="text-base font-bold" style={{ color: division.color }}>
              {totalClubs}
            </p>
            <p className="text-[10px] text-[#a09880] flex items-center justify-center gap-1">
              <Building2 className="w-2.5 h-2.5" />
              Club
            </p>
          </div>
          <div className={`p-2.5 rounded-lg ${division.statBg} border text-center`}>
            <p className="text-base font-bold" style={{ color: division.color }}>
              {weeklyCount}
            </p>
            <p className="text-[10px] text-[#a09880] flex items-center justify-center gap-1">
              <Gamepad2 className="w-2.5 h-2.5" />
              Match
            </p>
          </div>
        </div>

        {/* Prize pool highlight */}
        {prizePool > 0 && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)]">
            <Crown className="w-3.5 h-3.5 text-[#d4a853]" />
            <span className="text-[11px] text-[#a09880]">Prize Pool</span>
            <span className="text-sm font-bold text-gradient-champion ml-auto">
              {formatCurrency(prizePool)}
            </span>
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={() => onEnterApp(division.key)}
          className={`w-full py-3 rounded-xl border text-sm font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${division.ctaBg}`}
        >
          <span>Masuk {cardTitle}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────── Main Component ────────────────────────── */
export function TournamentHub({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onVideoPlay,
}: TournamentHubProps) {
  // CMS text fields with fallbacks
  const sectionLabel = cmsSettings?.kompetisi_label || 'Kompetisi';
  const sectionTitle = cmsSettings?.kompetisi_title || 'Tarkam Arena';
  const sectionSubtitle = cmsSettings?.kompetisi_subtitle || 'Weekly tournament setiap minggu — pilih tarkammu dan langsung bertanding di arena kompetisi IDM';
  const bridgeTitle = cmsSettings?.kompetisi_bridge_title || 'Dua Tarkam, Satu Arena';
  const bridgeDescription = cmsSettings?.kompetisi_bridge_description ||
    'Male Tarkam dan Female Tarkam berjalan secara paralel setiap minggu — keduanya terhubung dalam satu ekosistem Tarkam IDM. Setiap kemenangan di tarkam berkontribusi pada peringkat musim ini.';

  return (
    <section
      id="kompetisi"
      role="region"
      aria-label={sectionLabel}
      className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0d0d1a]"
    >
      {/* ── Top edge glow — section boundary ── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.3)] to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[rgba(212,168,83,0.03)] to-transparent pointer-events-none" aria-hidden="true" />

      {/* ── Background ── */}
      {/* Gold dot pattern overlay — parallax section bg */}
      <div
        className="absolute inset-0 opacity-[0.025] parallax-section-bg"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4a853 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Subtle radial glow at center top — parallax section bg */}
      <div
        className="absolute inset-0 parallax-section-bg"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.04) 0%, transparent 60%)',
        }}
      />
      {/* Bilateral division atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(168,85,247,0.03) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ── Section Header ── */}
        <AnimatedSection>
          <SectionHeader
            icon={Swords}
            label={sectionLabel}
            title={sectionTitle}
            subtitle={sectionSubtitle}
          />
        </AnimatedSection>

        {/* ── Tournament Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Male Tarkam */}
          <AnimatedSection variant="fadeLeft">
            <TournamentCard
              division={DIVISION.male}
              data={maleData}
              cmsSections={cmsSections}
              cmsSettings={cmsSettings}
              onEnterApp={onEnterApp}
              onVideoPlay={onVideoPlay}
            />
          </AnimatedSection>

          {/* Female Tarkam */}
          <AnimatedSection variant="fadeRight">
            <TournamentCard
              division={DIVISION.female}
              data={femaleData}
              cmsSections={cmsSections}
              cmsSettings={cmsSettings}
              onEnterApp={onEnterApp}
              onVideoPlay={onVideoPlay}
            />
          </AnimatedSection>
        </div>

        {/* ── Bridge Section: Tarkam IDM ── */}
        <AnimatedSection variant="fadeUp">
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-xl relative rounded-xl overflow-hidden border border-[rgba(212,168,83,0.15)] bg-[#0d0d1a] hover:border-[rgba(212,168,83,0.3)] transition-all duration-500 group">
              {/* Subtle background pattern */}
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage:
                    'linear-gradient(#d4a853 1px, transparent 1px), linear-gradient(90deg, #d4a853 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              {/* Gold glow */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 30%, rgba(212,168,83,0.06) 0%, transparent 60%)',
                }}
              />

              <div className="relative z-10 p-5 sm:p-6 text-center">
                {/* Crown icon */}
                <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-[#d4a853] tournament-icon-pulse" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gradient-champion mb-1">
                  {bridgeTitle}
                </h3>

                {/* Subtitle */}
                <p className="text-sm text-[#a09880] leading-relaxed max-w-md mx-auto">
                  {bridgeDescription.includes('Tarkam IDM') ? (
                    <>
                      {bridgeDescription.split('Tarkam IDM').map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="text-[#d4a853] font-semibold">Tarkam IDM</span>
                          )}
                        </span>
                      ))}
                    </>
                  ) : bridgeDescription}
                </p>

                {/* Decorative divider */}
                <div className="flex items-center justify-center gap-3 mt-4 mb-3">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4a853]/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4a853]/40" />
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4a853]/30" />
                </div>

                {/* Combined stats */}
                <div className="flex items-center justify-center gap-6 text-[11px] text-[#a09880]">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-cyan-400" />
                    {(maleData?.totalPlayers || 0) + (femaleData?.totalPlayers || 0)} Pemain
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-purple-400" />
                    {(maleData?.clubs?.length || 0) + (femaleData?.clubs?.length || 0)} Club
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gamepad2 className="w-3 h-3 text-[#d4a853]" />
                    {(maleData?.seasonProgress?.completedWeeks || 0) + (femaleData?.seasonProgress?.completedWeeks || 0)}{' '}
                    Match Week
                  </span>
                </div>

                {/* Learn more link */}
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#d4a853] hover:text-[#e5be4a] transition-colors cursor-pointer group/link"
                >
                  <span>Pelajari Tarkam IDM</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* ── Inline keyframes ── */}
      <style jsx>{`
        @keyframes card-shine-sweep {
          from { transform: translateX(-100%); }
          to { transform: translateX(200%); }
        }
        @keyframes play-pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes play-pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .play-btn-pulse-ring {
          animation: play-pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .play-btn-pulse-glow {
          animation: play-pulse-glow 2.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
