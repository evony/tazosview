'use client';

import { motion } from 'framer-motion';
import { Users, Trophy, ArrowRight, Radio, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerCard } from '../player-card';
import { getAvatarUrl, clubToString } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   DIVISION SHOWCASE — With PlayerCard for top 3
   ═══════════════════════════════════════════════════════ */
interface DivisionShowcaseProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  onEnterDivision: (d: 'male' | 'female') => void;
}

export function DivisionShowcase({ maleData, femaleData, onEnterDivision }: DivisionShowcaseProps) {
  const divisions = [
    {
      key: 'male' as const,
      label: 'Male Tarkam',
      emoji: '🕺',
      data: maleData,
      gradient: 'from-cyan-600/20 via-cyan-500/10 to-transparent',
      border: 'border-cyan-500/20 hover:border-cyan-400/40',
      textAccent: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      btnGradient: 'from-cyan-500 to-cyan-400',
      glowColor: 'rgba(6,182,212,0.15)',
      iconBg: 'bg-cyan-500/15',
    },
    {
      key: 'female' as const,
      label: 'Female Tarkam',
      emoji: '💃',
      data: femaleData,
      gradient: 'from-purple-600/20 via-purple-500/10 to-transparent',
      border: 'border-purple-500/20 hover:border-purple-400/40',
      textAccent: 'text-purple-400',
      badgeBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      btnGradient: 'from-purple-500 to-purple-400',
      glowColor: 'rgba(168,85,247,0.15)',
      iconBg: 'bg-purple-500/15',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {divisions.map((div, i) => {
        const isLive = div.data?.activeTournament?.status === 'live';
        const playerCount = div.data?.totalPlayers || 0;
        const top3 = div.data?.topPlayers?.slice(0, 3) || [];
        const tournamentName = div.data?.activeTournament?.name;

        return (
          <motion.div
            key={div.key}
            initial={{ opacity: 0, x: div.key === 'male' ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.5, ease: 'easeOut' }}
          >
            <Card
              className={`bg-gradient-to-br ${div.gradient} ${div.border} border cursor-pointer group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}
              onClick={() => onEnterDivision(div.key)}
            >
              {/* Hover glow effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 50%, ${div.glowColor} 0%, transparent 70%)`,
                }}
              />

              <CardContent className="relative z-10 p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${div.iconBg} flex items-center justify-center text-xl`}>
                      {div.emoji}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${div.textAccent}`}>{div.label}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {playerCount} Pemain
                      </p>
                    </div>
                  </div>
                  {isLive && (
                    <Badge className={`${div.badgeBg} text-[9px] border`}>
                      <span className="relative flex h-1.5 w-1.5 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                      </span>
                      LIVE
                    </Badge>
                  )}
                </div>

                {/* Tournament info */}
                {tournamentName && (
                  <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-background/30 border border-border/20">
                    <Trophy className={`w-3.5 h-3.5 ${div.textAccent} shrink-0`} />
                    <span className="text-xs font-medium truncate">{tournamentName}</span>
                  </div>
                )}

                {/* Top 3 using PlayerCard — same as division dashboard */}
                {top3.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {top3.map((player, idx) => (
                      <PlayerCard
                        key={player.id}
                        gamertag={player.gamertag}
                        avatar={player.avatar}
                        tier={player.tier}
                        points={player.points}
                        totalWins={player.totalWins}
                        totalMvp={player.totalMvp}
                        streak={player.streak}
                        rank={idx + 1}
                        isMvp={player.totalMvp > 0 && idx === 0}
                        club={player.club}
                      />
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div className="flex items-center justify-end">
                  <span className={`bg-gradient-to-r ${div.btnGradient} text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 group-hover:shadow-lg transition-all duration-300`}>
                    Masuk Divisi
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
