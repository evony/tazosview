'use client';

import { Flame, UserPlus, Shield, Users, Trophy } from 'lucide-react';

/* ── Default Trust Badges ── */
const DEFAULT_BADGES = [
  { icon: Shield, value: '12+', label: 'Club Terdaftar' },
  { icon: Users, value: '120+', label: 'Pemain Aktif' },
  { icon: Trophy, value: '2', label: 'Season' },
] as const;

/* ── Trust Badge ── */
function TrustBadge({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,83,0.08)] flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#d4a853]/70" />
      </div>
      <span className="text-[#f5f0e8] text-sm font-bold">{value}</span>
      <span className="text-[#a09880] text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CTA Section — Call to Action before footer
   Premium redesign with gradient border, pulsing glow, gold trail
   ═══════════════════════════════════════════════════════════════ */
export function CTASection({
  onEnterCommunity,
  onRegister,
  cmsSettings,
}: {
  onEnterCommunity: () => void;
  onRegister: () => void;
  cmsSettings?: Record<string, string>;
}) {
  // Merge CMS settings with defaults
  const title = cmsSettings?.cta_title || 'Siap Menjadi Champion?';
  const description = cmsSettings?.cta_description || 'Bergabung sekarang dan tunjukkan skill-mu di arena Tarkam IDM. Ribuan pemain sudah menunggu!';
  const primaryButtonText = cmsSettings?.cta_button_primary_text || 'Masuk Arena';
  const secondaryButtonText = cmsSettings?.cta_button_secondary_text || 'Daftar Sekarang';

  // Build trust badges from CMS or defaults
  const badges = DEFAULT_BADGES.map((badge, i) => ({
    ...badge,
    value: cmsSettings?.[`cta_badge_${i + 1}_value`] || badge.value,
    label: cmsSettings?.[`cta_badge_${i + 1}_label`] || badge.label,
  }));

  return (
    <section id="cta" aria-label="Call to Action" className="cta-section relative py-16 sm:py-28 px-4 overflow-hidden bg-[#0a0a14]">
      {/* Top gold border glow line */}
      <div className="absolute top-0 left-0 right-0 h-px" aria-hidden="true">
        <div className="w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.4), rgba(245,230,200,0.2), rgba(212,168,83,0.4), transparent)' }} />
      </div>

      {/* Radial gold glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.08) 0%, transparent 50%)' }} />

      {/* Bilateral cyan+purple atmosphere */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(6,182,212,0.04) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(168,85,247,0.04) 0%, transparent 45%)' }} />

      {/* Bottom edge glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* ── CTA Card with dramatic gradient border ── */}
        <div className="cta-card-wrapper relative rounded-3xl p-[1.5px] mx-auto max-w-2xl">
          {/* Gradient border — animated shimmer */}
          <div className="cta-gradient-border absolute inset-0 rounded-3xl" aria-hidden="true" />

          {/* Card content */}
          <div className="relative rounded-3xl bg-[#0d0d1a]/95 px-6 sm:px-10 py-10 sm:py-14">
            {/* Gold particle trail — CSS pseudo-element */}
            <div className="cta-gold-trail absolute top-0 left-0 right-0 h-1 rounded-t-3xl overflow-hidden" aria-hidden="true" />

            {/* Heading */}
            <h2 className="reveal reveal-fade-up text-3xl sm:text-5xl font-black text-gradient-champion mb-4">
              {title}
            </h2>

            {/* Subtitle */}
            <p className="reveal reveal-fade-up reveal-delay-1 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="reveal reveal-fade-up reveal-delay-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Masuk Arena — Primary Gold Button with pulsing glow */}
              <button
                onClick={onEnterCommunity}
                className="btn-press cta-btn-pulse group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-[#d4a853] to-[#e8d5a3] text-[#0d0d1a] font-bold text-sm tracking-wider cursor-pointer overflow-hidden"
              >
                {/* Shimmer sweep on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                <Flame className="w-4 h-4 inline mr-2 relative z-10" />
                <span className="relative z-10">{primaryButtonText}</span>
              </button>

              {/* Daftar Sekarang — Outline Button */}
              <button
                onClick={onRegister}
                className="btn-press group relative px-8 py-4 rounded-2xl border-2 border-[rgba(212,168,83,0.3)] text-[#d4a853] font-bold text-sm tracking-wider bg-transparent hover:bg-[rgba(212,168,83,0.05)] hover:border-[rgba(212,168,83,0.5)] transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                <span>{secondaryButtonText}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="reveal reveal-fade-up reveal-delay-3 mt-12 flex items-center justify-center gap-8 sm:gap-12">
          {badges.map((badge, i) => (
            <span key={i} className="contents">
              {i > 0 && <div className="h-8 w-px bg-[rgba(212,168,83,0.1)]" aria-hidden="true" />}
              <TrustBadge icon={badge.icon} value={badge.value} label={badge.label} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
