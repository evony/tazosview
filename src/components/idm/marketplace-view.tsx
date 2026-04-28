'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Zap } from 'lucide-react';
import { CommunityMarketplace } from './community-dashboard/community-marketplace';

/* ═══════════════════════════════════════════════════════
   MARKETPLACE VIEW — Standalone page for marketplace
   ═══════════════════════════════════════════════════════ */
export function MarketplaceView() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ═══ Hero Header ═══ */}
      <div className="relative overflow-hidden rounded-2xl border border-idm-gold-warm/20 bg-gradient-to-br from-[#0a0a14] via-[#0d0d1a] to-[#0c0a06]">
        {/* Gold radial haze */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(212,168,83,0.08) 0%, transparent 65%)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 p-6 sm:p-10">
          {/* Decorative accent */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-idm-gold-warm/50" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/[0.06]">
              <ShoppingBag className="w-3 h-3 text-idm-gold-warm/80" />
              <span className="text-[9px] sm:text-[10px] text-idm-gold-warm font-bold tracking-[0.15em] uppercase">MARKETPLACE</span>
            </div>
            <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-idm-gold-warm/50" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2" style={{
            background: 'linear-gradient(135deg, #f5e6c8 0%, #d4a853 30%, #e5be4a 50%, #f5d77a 70%, #d4a853 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Marketplace
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground/80 max-w-lg">
            Jual-beli item & jasa game online. Pasang iklanmu dan temukan penawaran terbaik dari komunitas Tarkam IDM!
          </p>

          {/* Animated underline */}
          <motion.div
            className="h-px sm:h-[1.5px] rounded-full mt-4"
            style={{ background: 'linear-gradient(90deg, transparent, #d4a853, transparent)' }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '50%', opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
        </div>
      </div>

      {/* ═══ Marketplace Content ═══ */}
      <CommunityMarketplace />
    </div>
  );
}
