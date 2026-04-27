'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* Auto-dismiss after this duration (ms) — no tap, no audio */
const SPLASH_DURATION = 3500;

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Auto-progress animation loop
  useEffect(() => {
    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const pct = Math.min(elapsed / SPLASH_DURATION, 1);
      setProgress(pct);

      if (pct < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    // Start visual fade-out slightly before splash ends
    timersRef.current.push(
      setTimeout(() => setFadeOut(true), SPLASH_DURATION - 400)
    );

    // Finish splash after duration
    timersRef.current.push(
      setTimeout(() => {
        onFinish();
      }, SPLASH_DURATION)
    );

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      timersRef.current.forEach(clearTimeout);
    };
  }, [onFinish]);

  const handleSkip = useCallback(() => {
    // Allow clicking anywhere to skip
    timersRef.current.forEach(clearTimeout);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setFadeOut(true);
    setTimeout(() => onFinish(), 400);
  }, [onFinish]);

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden cursor-pointer transition-opacity duration-400 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0a06] via-[#120e08] to-[#0c0a06]" />

      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)'
      }} />

      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(229,190,74,0.04) 0%, transparent 50%)',
        }}
      />

      {/* ═══ Main Content ═══ */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Main Logo — cinematic reveal */}
        <div className="mb-8" style={{ animation: 'splash-logo-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}>
          <div className="relative">
            {/* Glow ring */}
            <div
              className="absolute -inset-4 rounded-2xl"
              style={{
                boxShadow: '0 0 18px rgba(184,134,11,0.1), 0 0 45px rgba(245,158,11,0.05)',
                animation: 'splash-glow-breathe 2s ease-in-out infinite',
              }}
            />
            {/* Logo */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50">
              <img src="/logo.webp" alt="Tarkam IDM" className="w-full h-full object-cover" />
            </div>
            {/* Border ring */}
            <div
              className="absolute -inset-1.5 rounded-2xl"
              style={{
                border: '1.5px solid rgba(212,168,83,0.15)',
                animation: 'splash-border-rotate 6s linear infinite',
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div
          className="text-center"
          style={{ animation: 'splash-title-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both' }}
        >
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            <span
              className="text-gradient-fury inline-block"
              style={{ animation: 'splash-letter-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1s both' }}
            >
              Tarkam
            </span>
            <span className="text-white inline-block ml-2">{' '}</span>
            <span
              className="text-white inline-block"
              style={{ animation: 'splash-letter-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.15s both' }}
            >
              IDM
            </span>
          </h1>
          <p
            className="text-xs sm:text-sm text-white/40 mt-2 tracking-[0.25em] uppercase font-light"
            style={{ animation: 'splash-subtitle-enter 0.6s ease-out 1.4s both' }}
          >
            Idol Meta · Fan Made Edition
          </p>
        </div>

        {/* Decorative dot divider */}
        <div
          className="mt-6 flex items-center gap-3"
          style={{ animation: 'splash-subtitle-enter 0.6s ease-out 1.5s both' }}
        >
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-idm-gold-warm/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-idm-gold-warm/40" />
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-idm-gold-warm/30" />
        </div>

        {/* Auto progress bar */}
        <div
          className="mt-8 w-48 sm:w-64"
          style={{ animation: 'splash-subtitle-enter 0.4s ease-out 1.6s both' }}
        >
          <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p
            className="text-[10px] text-center mt-2 tracking-wider text-white/30"
            style={{ animation: 'splash-subtitle-enter 0.3s ease-out 1.8s both' }}
          >
            MEMASUKI ARENA
          </p>
        </div>
      </div>

      {/* BORNEO Pride Footer */}
      <div
        className="absolute bottom-0 inset-x-0"
        style={{ animation: 'splash-subtitle-enter 0.6s ease-out 2s both' }}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="py-4 flex flex-col items-center gap-1.5">
          <span className="text-[10px] sm:text-xs tracking-widest uppercase font-semibold bg-gradient-to-r from-amber-400/80 via-yellow-200/80 to-amber-400/80 bg-clip-text text-transparent">
            BORNEO Pride
          </span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-gradient-to-r from-transparent to-amber-500/40" />
            <div className="w-1 h-1.5 rotate-45 bg-amber-500/50" />
            <div className="w-4 h-px bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
          <span className="text-[8px] text-amber-500/20 tracking-widest uppercase">Idol Meta · Fan Made Edition</span>
        </div>
      </div>
    </div>
  );
}
