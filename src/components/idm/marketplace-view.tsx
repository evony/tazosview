'use client';

import { ShoppingBag, Zap, TrendingUp, Flame, ShieldCheck, Sparkles } from 'lucide-react';
import { CommunityMarketplace } from './community-dashboard/community-marketplace';

/* ═══════════════════════════════════════════════════════
   ORANGE THEME CONSTANTS
   ═══════════════════════════════════════════════════════ */
const ORANGE = {
  primary: '#f97316',    // orange-500
  light: '#fb923c',     // orange-400
  dark: '#ea580c',      // orange-600
  glow: 'rgba(249,115,22,0.08)',
  glowStrong: 'rgba(249,115,22,0.15)',
};

/* ═══════════════════════════════════════════════════════
   MARKETPLACE VIEW — Standalone full-width page
   Orange-themed marketplace
   ═══════════════════════════════════════════════════════ */
export function MarketplaceView() {
  return (
    <div className="space-y-5">
      {/* ═══ Hero Header — Full Width ═══ */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#0f0804] via-[#120a06] to-[#0a0604]">
        {/* Orange radial haze */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 40%, ${ORANGE.glow} 0%, transparent 65%)` }} />
        {/* Secondary glow bottom-right */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 80% 80%, rgba(249,115,22,0.04) 0%, transparent 50%)` }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: `linear-gradient(${ORANGE.primary}33 1px, transparent 1px), linear-gradient(90deg, ${ORANGE.primary}33 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

        <div className="relative z-10 p-6 sm:p-10">
          {/* Decorative accent */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-orange-400/50" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-orange-500/25 bg-orange-500/[0.08]">
              <ShoppingBag className="w-3 h-3 text-orange-400" />
              <span className="text-[9px] sm:text-[10px] text-orange-400 font-bold tracking-[0.15em] uppercase">MARKETPLACE</span>
            </div>
            <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-orange-400/50" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2" style={{
                background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 25%, #f97316 50%, #ea580c 75%, #fb923c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Marketplace
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground/80 max-w-lg">
                Jual-beli item & jasa game online. Pasang iklanmu dan temukan penawaran terbaik dari komunitas Tarkam IDM!
              </p>
            </div>

            {/* Stats Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/15">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] font-bold text-orange-300">Live Deals</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300">Verified</span>
              </div>
            </div>
          </div>

          {/* Animated underline */}
          <div
            className="h-px sm:h-[1.5px] rounded-full mt-5 animate-width-expand"
            style={{ background: `linear-gradient(90deg, transparent, ${ORANGE.primary}, transparent)`, maxWidth: '60%' }}
          />
        </div>
      </div>

      {/* ═══ Quick Feature Highlights ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, title: 'Jual Cepat', desc: 'Pasang iklan dan temukan pembeli dari komunitas', color: 'text-orange-400' },
          { icon: ShieldCheck, title: 'Penjual Verified', desc: 'Penjual terverifikasi dengan akun gamertag resmi', color: 'text-emerald-400' },
          { icon: Sparkles, title: 'Kategori Lengkap', desc: 'Avatar, jasa GB, joki, item, dan banyak lagi', color: 'text-amber-400' },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/10 bg-gradient-to-br from-orange-500/[0.03] to-transparent hover:border-orange-500/20 transition-all">
            <div className={`w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0`}>
              <f.icon className={`w-4 h-4 ${f.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">{f.title}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Marketplace Content — Full Width ═══ */}
      <CommunityMarketplace />
    </div>
  );
}
