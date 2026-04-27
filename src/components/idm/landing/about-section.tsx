'use client';

import { motion } from 'framer-motion';
import { Heart, Flame, Users, Trophy, Swords, Sparkles, Music, Shield } from 'lucide-react';
import { AnimatedSection, SectionHeader } from './shared';

interface AboutSectionProps {
  cmsSections: Record<string, any>;
  cmsSettings: Record<string, string>;
}

// Milestone icon mapping by tagColor
const milestoneIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '#06b6d4': Users,     // cyan = Komunitas
  '#d4a853': Swords,    // gold = Turnamen
  '#a855f7': Trophy,    // purple = Liga IDM
};

const defaultMilestoneIcons = [Users, Swords, Trophy];

export function AboutSection({ cmsSections, cmsSettings }: AboutSectionProps) {
  // CMS data with fallbacks
  const aboutSection = cmsSections.about;
  const sectionTitle = aboutSection?.title || 'Dari Pemain, Untuk Pemain';
  const sectionSubtitle = aboutSection?.subtitle || 'Cerita Kami';
  const sectionDescription = aboutSection?.description || 'Bagaimana IDM League lahir dari semangat komunitas yang tidak ingin gamenya sepi';

  // CMS settings for longer text blocks
  const originStory = cmsSettings.about_origin_story || 'Idol Meta dari Lyto Game — sebuah rhythm game yang menghidupkan panggung virtual. Kami para pemainnya, bermain setiap hari, menari, dan berkompetisi. Tapi lama-kelamaan, rutinitas tanpa tujuan terasa hampa. Tidak ada motivasi, tidak ada sesuatu yang kita kejar bersama.\n\nGame yang kami cintai mulai sepi. Player datang dan pergi tanpa alasan untuk bertahan. Lalu muncul sebuah pertanyaan sederhana: "Kenapa tidak kita buat sendiri alasan untuk terus bermain?"\n\nDari situlah IDM League lahir — bukan dari perusahaan, bukan dari sponsor besar, tapi dari komunitas pemain yang tidak ingin gamenya mati.';
  const season1Text = cmsSettings.about_season1_text || 'Tahun 2025, Liga IDM Season 1 telah digelar dan berjalan sangat baik. Club-club bertarung, peserta bebas mix dari divisi male dan female, dan champion pun dinobatkan. Sambil menunggu dana terkumpul untuk season berikutnya, kami menyelenggarakan Weekly Tournament sebagai ajang berlatih dan bersaing secara individu.';
  const bottomTagline = cmsSettings.about_tagline || 'By Players, For Players';

  // CMS cards for milestones (fallback to defaults)
  const milestoneCards = aboutSection?.cards?.length > 0
    ? aboutSection.cards
    : [
        { title: 'Komunitas', description: 'Pemain Idol Meta berkumpul, saling mengenal, dan membentuk ikatan', tagColor: '#06b6d4', order: 1 },
        { title: 'Turnamen', description: 'Weekly tournament sebagai ajang berlatih dan bersaing secara individu', tagColor: '#d4a853', order: 2 },
        { title: 'Liga IDM', description: 'Season 1 sukses digelar — club bertanding, champion dinobatkan', tagColor: '#a855f7', order: 3 },
      ];

  // Parse origin story paragraphs
  const storyParagraphs = originStory.split('\n\n').filter(Boolean);

  // Accent colors for milestone cards
  const accentColors = ['#06b6d4', '#d4a853', '#a855f7'];
  const accentBgs = ['bg-cyan-500/10', 'bg-idm-gold-warm/10', 'bg-purple-500/10'];
  const accentBorders = ['border-cyan-500/10', 'border-idm-gold-warm/15', 'border-purple-500/10'];
  const accentHoverBorders = ['hover:border-cyan-500/20', 'hover:border-idm-gold-warm/25', 'hover:border-purple-500/20'];
  const accentHoverBgs = ['hover:bg-cyan-500/[0.05]', 'hover:bg-idm-gold-warm/[0.06]', 'hover:bg-purple-500/[0.05]'];
  const accentTexts = ['text-cyan-400', 'text-idm-gold-warm', 'text-purple-400'];
  const accentLineColors = ['via-cyan-500/50', 'via-idm-gold-warm', 'via-purple-500/50'];

  return (
    <section id="about" role="region" aria-label="Cerita Kami" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background — Warm narrative glow with subtle vertical line pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      {/* Subtle vertical line pattern — like pages of a book (story section) */}
      <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(to right, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '80px 100%' }} />
      {/* Warm spotlight from top center */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.07) 0%, transparent 50%), radial-gradient(ellipse at 15% 60%, rgba(6,182,212,0.03) 0%, transparent 40%), radial-gradient(ellipse at 85% 60%, rgba(168,85,247,0.03) 0%, transparent 40%)' }} />

      {/* Ambient orb — single, slow orbit for warmth */}
      <div className="ambient-light" style={{ top: '15%', right: '8%', animationDuration: '25s' }} />

      <div className="relative z-10 max-w-4xl mx-auto">
        <AnimatedSection>
          <SectionHeader icon={Heart} label={sectionSubtitle} title={sectionTitle} subtitle={sectionDescription} />
          {/* Typewriter cursor after subtitle */}
          <div className="flex justify-center -mt-6 mb-2">
            <span className="inline-block w-[2px] h-4 bg-idm-gold-warm/60 typewriter-cursor" />
          </div>
        </AnimatedSection>

        {/* Origin Story */}
        <AnimatedSection variant="fadeUp">
          <div className="relative rounded-2xl border border-idm-gold-warm/15 bg-idm-gold-warm/[0.06] p-6 sm:p-8 mb-8">
            {/* Gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-idm-gold-warm to-transparent" />
            {/* Subtle gold glow */}
            <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.06) 0%, transparent 50%)' }} />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-idm-gold-warm/10 border border-idm-gold-warm/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-idm-gold-warm" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Awal Mula</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">The Origin Story</p>
                </div>
                {/* Borneo Pride Badge */}
                <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-idm-gold-warm/15 bg-idm-gold-warm/[0.06] text-[10px] text-idm-gold-warm/70 font-semibold tracking-wide">
                  Borneo Pride 🏝️
                </span>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                {storyParagraphs.map((paragraph, idx) => {
                  // Use placeholders first to prevent regex from matching inside HTML attributes
                  // Step 1: Replace target words with placeholders
                  const withPlaceholders = paragraph
                    .replace(/Idol Meta/g, '⟨GOLD⟩Idol Meta⟨/GOLD⟩')
                    .replace(/IDM League/g, '⟨GOLD⟩IDM League⟨/GOLD⟩')
                    .replace(/"([^"]+)"/g, '⟨QUOTE⟩"$1"⟨/QUOTE⟩')
                    .replace(/komunitas pemain/g, '⟨WHITE⟩komunitas pemain⟨/WHITE⟩');

                  // Step 2: Convert placeholders to HTML spans
                  const highlighted = withPlaceholders
                    .replace(/⟨GOLD⟩(.*?)⟨\/GOLD⟩/g, '<span class="text-idm-gold-warm font-semibold">$1</span>')
                    .replace(/⟨QUOTE⟩(.*?)⟨\/QUOTE⟩/g, '<span class="text-white font-semibold">$1</span>')
                    .replace(/⟨WHITE⟩(.*?)⟨\/WHITE⟩/g, '<span class="text-white font-semibold">$1</span>');

                  return (
                    <p key={idx} dangerouslySetInnerHTML={{ __html: highlighted }} />
                  );
                })}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Timeline / Milestones — from CMS cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {milestoneCards.map((card: any, idx: number) => {
            const Icon = milestoneIcons[card.tagColor] || defaultMilestoneIcons[idx % 3];
            const colorIdx = idx % 3;
            return (
              <AnimatedSection key={card.id || idx} variant={idx === 0 ? 'fadeLeft' : idx === 2 ? 'fadeRight' : 'fadeUp'}>
                <div className={`relative rounded-2xl border ${accentBorders[colorIdx]} ${accentBgs[colorIdx]} p-5 text-center group ${accentHoverBorders[colorIdx]} ${accentHoverBgs[colorIdx]} transition-all duration-300 milestone-card-${colorIdx}`}>
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${accentLineColors[colorIdx]} to-transparent`} />
                  <div className={`w-12 h-12 mx-auto rounded-xl ${accentBgs[colorIdx]} border border-current/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${accentTexts[colorIdx]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className={`text-sm font-bold ${accentTexts[colorIdx]} mb-1`}>{card.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Season 1 Success Callout */}
        <AnimatedSection variant="fadeUp">
          <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.05] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Liga IDM Season 1 — Berhasil!</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {season1Text}
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Bottom decorative line */}
        <div className="mt-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-idm-gold-warm/15 to-transparent" />
          <div className="flex items-center gap-1.5 text-idm-gold-warm/30">
            <Heart className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{bottomTagline}</span>
            <Heart className="w-3 h-3" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-idm-gold-warm/15 to-transparent" />
        </div>
      </div>
    </section>
  );
}
