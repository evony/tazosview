'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Trophy, Crown, Star, Swords, Zap } from 'lucide-react';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   COMMUNITY GALLERY — Premium horizontal scrollable cards
   ═══════════════════════════════════════════════════════ */
interface CommunityGalleryProps {
  maleData?: StatsData;
  femaleData?: StatsData;
}

export function CommunityGallery({ maleData, femaleData }: CommunityGalleryProps) {
  const cards = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      desc: string;
      badge?: string;
      badgeColor?: string;
      emoji: string;
      gradient: string;
      icon?: typeof Trophy;
    }> = [];

    // Active tournaments
    for (const [div, data] of [['male', maleData], ['female', femaleData]] as const) {
      if (data?.activeTournament) {
        const t = data.activeTournament;
        items.push({
          id: `tournament-${div}`,
          title: t.name,
          desc: `Week ${t.weekNumber} • ${t.teams?.length || 0} Tim`,
          badge: t.status === 'live' ? '🔴 LIVE' : t.status === 'completed' ? 'Selesai' : 'Segera',
          badgeColor: t.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-idm-gold-warm/20 text-idm-gold-warm',
          emoji: div === 'male' ? '🕺' : '💃',
          gradient: div === 'male'
            ? 'from-cyan-600/25 via-cyan-500/10 to-transparent'
            : 'from-purple-600/25 via-purple-500/10 to-transparent',
          icon: Trophy,
        });
      }
    }

    // Top players featured cards
    for (const [div, data] of [['male', maleData], ['female', femaleData]] as const) {
      const top3 = data?.topPlayers?.slice(0, 3) || [];
      if (top3.length > 0) {
        const top1 = top3[0];
        items.push({
          id: `top-${div}`,
          title: `Top ${div === 'male' ? 'Male' : 'Female'}`,
          desc: `${top1.gamertag} leading with ${top1.points} pts`,
          badge: `${top3.length} Pemain`,
          badgeColor: 'bg-idm-gold-warm/20 text-idm-gold-warm',
          emoji: div === 'male' ? '🏆' : '🌟',
          gradient: 'from-idm-gold-warm/20 via-amber-500/8 to-transparent',
          icon: Crown,
        });
      }
    }

    // Streak players — fire icons
    for (const [div, data] of [['male', maleData], ['female', femaleData]] as const) {
      const streakPlayers = data?.topPlayers?.filter(p => p.streak >= 3) || [];
      if (streakPlayers.length > 0) {
        items.push({
          id: `streak-${div}`,
          title: `${streakPlayers.length} Streak Player`,
          desc: streakPlayers.slice(0, 3).map(p => `${p.gamertag} (${p.streak}🔥)`).join(' • '),
          badge: `${streakPlayers.reduce((s, p) => s + p.streak, 0)} total`,
          badgeColor: 'bg-orange-500/20 text-orange-400',
          emoji: '🔥',
          gradient: 'from-orange-600/20 via-orange-500/8 to-transparent',
          icon: Flame,
        });
      }
    }

    // Weekly champions
    for (const [div, data] of [['male', maleData], ['female', femaleData]] as const) {
      const champions = data?.weeklyChampions?.slice(0, 2) || [];
      for (const ch of champions) {
        if (ch.winnerTeam) {
          items.push({
            id: `champion-${ch.weekNumber}-${div}`,
            title: `W${ch.weekNumber} Champion`,
            desc: ch.winnerTeam.name,
            badge: '👑',
            badgeColor: 'bg-yellow-500/20 text-yellow-500',
            emoji: '👑',
            gradient: 'from-yellow-600/20 via-amber-500/8 to-transparent',
            icon: Crown,
          });
        }
      }
    }

    // MVPs
    for (const [div, data] of [['male', maleData], ['female', femaleData]] as const) {
      const mvps = data?.topPlayers?.filter(p => p.totalMvp >= 2) || [];
      if (mvps.length > 0) {
        items.push({
          id: `mvp-${div}`,
          title: `${div === 'male' ? 'Male' : 'Female'} MVP`,
          desc: mvps.slice(0, 3).map(p => `${p.gamertag} (${p.totalMvp}x)`).join(' • '),
          badge: `${mvps.length} MVP`,
          badgeColor: 'bg-cyan-500/20 text-cyan-400',
          emoji: '⭐',
          gradient: 'from-cyan-600/15 via-cyan-500/5 to-transparent',
          icon: Star,
        });
      }
    }

    // Community stats card
    const totalP = (maleData?.totalPlayers || 0) + (femaleData?.totalPlayers || 0);
    if (totalP > 0) {
      items.push({
        id: 'community-overview',
        title: 'Komunitas Aktif',
        desc: `${totalP} pemain dari ${maleData?.topPlayers?.length || 0} + ${femaleData?.topPlayers?.length || 0} ranked`,
        badge: 'Live',
        badgeColor: 'bg-green-500/20 text-green-400',
        emoji: '⚡',
        gradient: 'from-green-600/15 via-green-500/5 to-transparent',
        icon: Zap,
      });
    }

    return items;
  }, [maleData, femaleData]);

  if (cards.length === 0) {
    // Fallback when no data
    return (
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {[
          { emoji: '🎮', title: 'Tarkam Arena', desc: 'Arena kompetisi dance match', gradient: 'from-idm-gold-warm/15 to-transparent' },
          { emoji: '🏆', title: 'Championship', desc: 'Season championship ongoing', gradient: 'from-yellow-500/15 to-transparent' },
          { emoji: '🕺', title: 'Male Division', desc: 'Compete in male bracket', gradient: 'from-cyan-500/15 to-transparent' },
          { emoji: '💃', title: 'Female Division', desc: 'Compete in female bracket', gradient: 'from-purple-500/15 to-transparent' },
        ].map((card, i) => (
          <div key={i} className="snap-start shrink-0 w-52">
            <Card className={`bg-gradient-to-br ${card.gradient} border border-border/20 overflow-hidden h-full`}>
              <CardContent className="p-4">
                <span className="text-xl mb-2 block">{card.emoji}</span>
                <h4 className="text-xs font-bold mb-1">{card.title}</h4>
                <p className="text-[10px] text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="snap-start shrink-0 w-56"
          >
            <Card className={`bg-gradient-to-br ${card.gradient} border border-border/20 overflow-hidden group hover:shadow-md hover:border-border/40 transition-all duration-300 h-full`}>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{card.emoji}</span>
                  {card.badge && (
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor || 'bg-muted/50 text-muted-foreground'}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold mb-1.5 line-clamp-1">{card.title}</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 flex-1 leading-relaxed">{card.desc}</p>
                {card.icon && (
                  <div className="mt-3 pt-2 border-t border-border/10 flex items-center gap-1.5">
                    <card.icon className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">IDM Tarkam</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
