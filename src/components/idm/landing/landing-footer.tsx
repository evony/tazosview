'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface LandingFooterProps {
  cmsFooterText: string;
  cmsFooterTagline: string;
  cmsLogo: string;
  cmsSiteTitle: string;
  cmsHeroTitle: string;
  cmsHeroSubtitle: string;
  cmsSettings: Record<string, string>;
  scrollToSection: (id: string) => void;
}

export function LandingFooter({ cmsFooterText, cmsFooterTagline, cmsLogo, cmsSiteTitle, cmsHeroTitle, cmsHeroSubtitle, cmsSettings, scrollToSection }: LandingFooterProps) {
  const discordUrl = cmsSettings.social_discord_url || '#';
  const instagramUrl = cmsSettings.social_instagram_url || '#';
  const youtubeUrl = cmsSettings.social_youtube_url || '#';
  const whatsappUrl = cmsSettings.social_whatsapp_url || '#';

  // Hide social icons if URL is still '#' (not configured by admin)
  const hasDiscord = discordUrl !== '#';
  const hasInstagram = instagramUrl !== '#';
  const hasYouTube = youtubeUrl !== '#';
  const hasWhatsApp = whatsappUrl !== '#';
  const hasAnySocial = hasDiscord || hasInstagram || hasYouTube || hasWhatsApp;
  return (<>
      {/* ========== FOOTER — Premium ========== */}
      <footer className="relative py-12 px-4 bg-[#0c0a06]/50 overflow-hidden">
        {/* Animated gradient border at the very top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <div
            className="h-full w-[200%] footer-gradient-border"
            style={{
              background: 'linear-gradient(90deg, transparent, #d4a853, #f5e6c8, #d4a853, transparent, #d4a853, #f5e6c8, #d4a853, transparent)',
            }}
          />
        </div>
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-24 pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(212,168,83,0.04) 0%, transparent 70%)' }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="stagger-item">
            {/* Top row: Brand + Tagline + Nav links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              {/* Brand */}
              <div className="flex flex-col items-center sm:items-start gap-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden glow-pulse shrink-0">
                    <Image src={cmsLogo} alt="IDM" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-lg text-gradient-fury font-bold">{cmsSiteTitle}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/80 tracking-wider">{cmsHeroTitle} — {cmsHeroSubtitle}</p>
              </div>

              {/* Quick Nav */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {[
                  { id: 'about', label: 'Cerita Kami' },
                  { id: 'kompetisi', label: 'Kompetisi' },
                  { id: 'clubs', label: 'Club' },
                  { id: 'champions', label: 'Champion' },
                  { id: 'mvp', label: 'MVP' },
                  { id: 'dream', label: 'Liga IDM' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="group relative text-[11px] text-muted-foreground/80 hover:text-idm-gold-warm transition-colors cursor-pointer py-2"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-idm-gold-warm/60 transition-all duration-300 group-hover:w-full" />
                  </button>
                ))}
              </div>

              {/* Social */}
              {hasAnySocial && (
                <div className="flex items-center gap-3">
                  {hasDiscord && (
                    <a href={discordUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl glass border border-border/50 flex items-center justify-center text-muted-foreground/80 hover:text-idm-gold-warm hover:border-idm-gold-warm/30 transition-all footer-social-glow" aria-label="Discord">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                    </a>
                  )}
                  {hasInstagram && (
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl glass border border-border/50 flex items-center justify-center text-muted-foreground/80 hover:text-idm-gold-warm hover:border-idm-gold-warm/30 transition-all footer-social-glow" aria-label="Instagram">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                    </a>
                  )}
                  {hasYouTube && (
                    <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl glass border border-border/50 flex items-center justify-center text-muted-foreground/80 hover:text-idm-gold-warm hover:border-idm-gold-warm/30 transition-all footer-social-glow" aria-label="YouTube">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                  )}
                  {hasWhatsApp && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl glass border border-border/50 flex items-center justify-center text-muted-foreground/80 hover:text-[#25D366] hover:border-[#25D366]/30 transition-all footer-social-glow" aria-label="WhatsApp">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-idm-gold-warm/10 to-transparent mb-6" />

            {/* Bottom row: Tagline + Copyright */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                <p className="text-[11px] text-idm-gold-warm/40 font-semibold tracking-wider uppercase">{cmsFooterTagline}</p>
                <p className="text-[10px] text-muted-foreground/50">{cmsFooterText}</p>
              </div>
              {/* Made with ❤️ in Borneo + Version */}
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                  Made with <span className="text-red-500/70 animate-pulse">❤️</span> in Borneo
                </span>
                <span className="text-[9px] text-idm-gold-warm/20 font-mono">v1.0.0</span>
              </div>

              {/* Back to Top Link */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="footer-back-to-top flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground/40 hover:text-idm-gold-warm/70 transition-all cursor-pointer mx-auto"
                aria-label="Back to top"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

  </>);
}
