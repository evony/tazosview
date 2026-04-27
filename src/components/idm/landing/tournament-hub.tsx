'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Music, Shield, Trophy, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection, SectionHeader } from './shared';
import { formatCurrency } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

interface TournamentHubProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
}

export function TournamentHub({ maleData, femaleData, cmsSections, cmsSettings, onEnterApp, onVideoPlay }: TournamentHubProps) {
  return (
    <section id="kompetisi" role="region" aria-label="Kompetisi" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background — Arena battle with bilateral division glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-background" />
      {/* Subtle diagonal line pattern — arena bracket feel */}
      <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(212,168,83,0.15) 35px, rgba(212,168,83,0.15) 36px)', backgroundSize: '50px 50px' }} />
      {/* Division color split — cyan left, purple right */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 25% 40%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 75% 40%, rgba(168,85,247,0.06) 0%, transparent 50%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <AnimatedSection>
          <SectionHeader icon={Music} label="Kompetisi" title="Dua Divisi, Satu Arena" subtitle="Weekly Tournament setiap minggu — pilih divisimu dan langsung bertanding" />
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* ═══ Weekly Tournament — Male Division ═══ */}
          <AnimatedSection variant="fadeLeft">
            <div className="relative group rounded-2xl overflow-hidden border border-cyan-500/20 tournament-card-hover tournament-card-hover-male" style={{ background: 'linear-gradient(135deg, #060d10 0%, #0a1518 30%, #061012 60%, #0d0a14 100%)' }}>
              {/* Glow */}
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(6,182,212,0.08) 0%, transparent 50%)' }} />
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

              <div className="relative p-6 sm:p-8 z-10">
                {/* Video Play Button */}
                {(() => {
                  const maleVideoUrl = cmsSettings?.kompetisi_male_video_url || cmsSections.kompetisi?.cards?.find((c: { division?: string; videoUrl?: string }) => c.division === 'male' && c.videoUrl)?.videoUrl;
                  return maleVideoUrl && onVideoPlay ? (
                    <button
                      onClick={() => onVideoPlay(maleVideoUrl, 'Weekly Male')}
                      className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-idm-gold-warm/30 border border-idm-gold-warm/40 flex items-center justify-center hover:bg-idm-gold-warm/40 transition-colors cursor-pointer"
                      aria-label="Play video"
                    >
                      <Play className="w-4 h-4 text-idm-gold-warm fill-idm-gold-warm" />
                    </button>
                  ) : null;
                })()}
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 30px rgba(6,182,212,0.1)' }}>
                    <Music className="w-7 h-7 text-cyan-400 tournament-icon-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-cyan-500/10 text-cyan-400 text-[10px] border-cyan-500/20 font-bold uppercase tracking-wider">Setiap Minggu</Badge>
                      <Badge className="bg-green-500/10 text-green-500 text-[10px] border-0">AKTIF</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-cyan-400">Weekly Male</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Bracket elimination — 1 tim, 3 pemain</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Turnamen mingguan dengan format bracket elimination. Peserta male bertanding di divisi ini setiap minggu. Juara weekly berhak atas prize pool dan gelar champion minggu itu.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                    <p className="text-lg font-bold text-cyan-400">{maleData?.seasonProgress?.completedWeeks || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Weekly Selesai</p>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                    <p className="text-lg font-bold text-cyan-400">{maleData?.totalPlayers || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Peserta</p>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                    <p className="text-lg font-bold text-cyan-400">{formatCurrency(maleData?.totalPrizePool || 0)}</p>
                    <p className="text-[10px] text-muted-foreground">Prize Pool</p>
                  </div>
                </div>

                {/* Flow */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <div className="px-2.5 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">Daftar</div>
                  <ArrowRight className="w-3 h-3 text-cyan-500/50" />
                  <div className="px-2.5 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">Bracket</div>
                  <ArrowRight className="w-3 h-3 text-cyan-500/50" />
                  <div className="px-2.5 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">Match</div>
                  <ArrowRight className="w-3 h-3 text-cyan-500/50" />
                  <div className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">Champion</div>
                </div>

                {/* CTA */}
                <button onClick={() => onEnterApp('male')} className="mt-5 w-full py-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-colors cursor-pointer">
                  Masuk Male Division →
                </button>
              </div>
            </div>
          </AnimatedSection>

          {/* ═══ Weekly Tournament — Female Division ═══ */}
          <AnimatedSection variant="fadeRight">
            <div className="relative group rounded-2xl overflow-hidden border border-purple-500/20 tournament-card-hover tournament-card-hover-female" style={{ background: 'linear-gradient(135deg, #0d060d 0%, #150a18 30%, #100612 60%, #140a14 100%)' }}>
              {/* Glow */}
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(168,85,247,0.08) 0%, transparent 50%)' }} />
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

              <div className="relative p-6 sm:p-8 z-10">
                {/* Video Play Button */}
                {(() => {
                  const femaleVideoUrl = cmsSettings?.kompetisi_female_video_url || cmsSections.kompetisi?.cards?.find((c: { division?: string; videoUrl?: string }) => c.division === 'female' && c.videoUrl)?.videoUrl;
                  return femaleVideoUrl && onVideoPlay ? (
                    <button
                      onClick={() => onVideoPlay(femaleVideoUrl, 'Weekly Female')}
                      className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-idm-gold-warm/30 border border-idm-gold-warm/40 flex items-center justify-center hover:bg-idm-gold-warm/40 transition-colors cursor-pointer"
                      aria-label="Play video"
                    >
                      <Play className="w-4 h-4 text-idm-gold-warm fill-idm-gold-warm" />
                    </button>
                  ) : null;
                })()}
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 30px rgba(168,85,247,0.1)' }}>
                    <Shield className="w-7 h-7 text-purple-400 tournament-icon-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-purple-500/10 text-purple-400 text-[10px] border-purple-500/20 font-bold uppercase tracking-wider">Setiap Minggu</Badge>
                      <Badge className="bg-green-500/10 text-green-500 text-[10px] border-0">AKTIF</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-purple-400">Weekly Female</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Bracket elimination — 1 tim, 3 pemain</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Turnamen mingguan dengan format bracket elimination. Peserta female bertanding di divisi ini setiap minggu. Juara weekly berhak atas prize pool dan gelar champion minggu itu.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                    <p className="text-lg font-bold text-purple-400">{femaleData?.seasonProgress?.completedWeeks || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Weekly Selesai</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                    <p className="text-lg font-bold text-purple-400">{femaleData?.totalPlayers || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Peserta</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                    <p className="text-lg font-bold text-purple-400">{formatCurrency(femaleData?.totalPrizePool || 0)}</p>
                    <p className="text-[10px] text-muted-foreground">Prize Pool</p>
                  </div>
                </div>

                {/* Flow */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <div className="px-2.5 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/10">Daftar</div>
                  <ArrowRight className="w-3 h-3 text-purple-500/50" />
                  <div className="px-2.5 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/10">Bracket</div>
                  <ArrowRight className="w-3 h-3 text-purple-500/50" />
                  <div className="px-2.5 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/10">Match</div>
                  <ArrowRight className="w-3 h-3 text-purple-500/50" />
                  <div className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold">Champion</div>
                </div>

                {/* CTA */}
                <button onClick={() => onEnterApp('female')} className="mt-5 w-full py-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold hover:bg-purple-500/20 transition-colors cursor-pointer">
                  Masuk Female Division →
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* ═══ Bridge to Liga IDM ═══ */}
        <AnimatedSection variant="fadeUp">
          <button
            onClick={() => document.getElementById('dream')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-8 w-full relative rounded-2xl border border-idm-gold-warm/15 bg-idm-gold-warm/[0.06] p-4 sm:p-5 flex items-center justify-between group hover:border-idm-gold-warm/30 hover:bg-idm-gold-warm/[0.09] transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-idm-gold-warm/10 border border-idm-gold-warm/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-idm-gold-warm tournament-icon-pulse" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-idm-gold-warm">Liga IDM — Liga Profesional</p>
                <p className="text-[11px] text-muted-foreground">Weekly adalah latihan. Liga IDM adalah tujuan akhir. Lihat visi kami →</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-idm-gold-warm/50 group-hover:text-idm-gold-warm group-hover:translate-x-1 transition-all" />
          </button>
        </AnimatedSection>
      </div>
    </section>
  );
}
