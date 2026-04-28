'use client';

import { motion } from 'framer-motion';
import { Users, Building2, Swords } from 'lucide-react';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   COMMUNITY STATS — 3 compact stat cards
   ═══════════════════════════════════════════════════════ */
interface CommunityStatsProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  leagueData?: {
    stats?: {
      totalClubs: number;
      totalMatches: number;
      completedMatches: number;
      liveMatches: number;
    };
  };
}

export function CommunityStats({ maleData, femaleData, leagueData }: CommunityStatsProps) {
  const dt = useCommunityTheme();

  const totalPlayers = (maleData?.totalPlayers || 0) + (femaleData?.totalPlayers || 0);
  const totalClubs = leagueData?.stats?.totalClubs || 0;
  const totalMatches = leagueData?.stats?.totalMatches || 0;
  const completedMatches = leagueData?.stats?.completedMatches || 0;

  const stats = [
    {
      icon: Users,
      label: 'Pemain',
      value: totalPlayers,
      sub: `${maleData?.totalPlayers || 0}♂ ${femaleData?.totalPlayers || 0}♀`,
      gradient: 'from-idm-gold-warm to-amber-500',
      iconBg: 'bg-idm-gold-warm/10',
      iconColor: 'text-idm-gold-warm',
      borderColor: 'border-idm-gold-warm/15',
    },
    {
      icon: Building2,
      label: 'Klub',
      value: totalClubs,
      sub: 'Terdaftar',
      gradient: 'from-emerald-500 to-green-400',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/15',
    },
    {
      icon: Swords,
      label: 'Pertandingan',
      value: totalMatches,
      sub: `${completedMatches} selesai`,
      gradient: 'from-cyan-500 to-blue-400',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-500',
      borderColor: 'border-cyan-500/15',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
        >
          <div className={`${dt.cardPremium} rounded-xl border ${stat.borderColor} p-3 group hover:shadow-md transition-all duration-300`}>
            <div className={`w-7 h-7 rounded-lg ${stat.iconBg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
            </div>
            <p className={`text-lg sm:text-xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent leading-tight`}>
              {stat.value.toLocaleString('id-ID')}
            </p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {stat.label}
            </p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground/50 mt-0.5 truncate">
              {stat.sub}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
