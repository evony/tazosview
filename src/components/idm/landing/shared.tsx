'use client';

import { motion, useInView, type Variants } from 'framer-motion';
import { useRef, useEffect, type ReactNode } from 'react';
import { fadeUp, fadeLeft, fadeRight, scaleIn } from './variants';

export { fadeUp, fadeLeft, fadeRight, scaleIn };
export { stagger } from './variants';

/* ========== Swipe Navigation Hook (DISABLED — removed auto-snap for natural scrolling) ========== */
export function useSwipeNavigation() {
  // Intentionally empty — previous implementation forced scrollIntoView on swipe,
  // which caused sections to be skipped on mobile (especially "Cerita Kami").
  // Users can now scroll freely; bottom nav still provides quick section navigation.
}

/* ========== Scroll-triggered Section Wrapper ========== */
export function AnimatedSection({ children, className = '', variant = 'fadeUp' }: {
  children: ReactNode;
  className?: string;
  variant?: 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'scaleIn';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const variants: Record<string, Variants> = { fadeUp, fadeLeft, fadeRight, scaleIn };
  const selected = variants[variant] || fadeUp;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={selected}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ========== Section Header Component ========== */
export function SectionHeader({ icon: Icon, label, title, subtitle }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-14">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-idm-gold-warm" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/5">
          <Icon className="w-4 h-4 text-idm-gold-warm" />
          <span className="text-[11px] font-bold text-idm-gold-warm uppercase tracking-widest">{label}</span>
        </div>
        <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-idm-gold-warm" />
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gradient-champion">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed">{subtitle}</p>}
    </motion.div>
  );
}

/* ========== Parallax Stats Counter ========== */
export function StatCard({ icon: Icon, value, label, delay }: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  delay: number;
}) {
  // Extract numeric part for count-up animation
  const numericMatch = value.match(/^(\d+)/);
  const numericValue = numericMatch ? parseInt(numericMatch[1], 10) : 0;
  const suffix = numericMatch ? value.slice(numericMatch[0].length) : value;
  const isNumeric = numericMatch !== null && numericValue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-idm-gold-warm/10 bg-white/[0.06] text-center transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,168,83,0.15)] hover:border-idm-gold-warm/20">
        {/* Glassmorphism shine effect */}
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent" />
        </div>
        <div className="relative z-10">
          <div className="w-7 h-7 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-3 rounded-lg sm:rounded-xl bg-idm-gold-warm/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-idm-gold-warm" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-gradient-fury">
            {isNumeric ? (
              <span
                className="stat-count-up inline-block"
                style={{ '--count-target': numericValue } as React.CSSProperties}
                data-suffix={suffix}
              >
                {numericValue}{suffix}
              </span>
            ) : (
              value
            )}
          </p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}
