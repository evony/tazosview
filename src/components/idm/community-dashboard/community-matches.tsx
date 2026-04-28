'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, CheckCircle2, Users } from 'lucide-react';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   COMMUNITY MATCHES — Tournament status & champion history
   ═══════════════════════════════════════════════════════ */
interface CommunityMatchesProps {
  maleData?: StatsData;
  femaleData?: StatsData;
}

interface TournamentStatus {
  id: string;
  division: 'male' | 'female';
  name: string;
  week: number;
  status: string;
  teams: number;
  champion?: string;
  mvp?: string;
}

export function CommunityMatches({ maleData, femaleData }: CommunityMatchesProps) {
  const tournamentStatuses = useMemo(() => {
    const items: TournamentStatus[] = [];

    for (const [div, data] of [['male', maleData], ['female', femaleData]] as const) {
      if (data?.activeTournament) {
        const t = data.activeTournament;
        const lastChampion = data?.weeklyChampions?.[0];
        items.push({
          id: `t-status-${div}`,
          division: div,
          name: t.name,
          week: t.weekNumber,
          status: t.status,
          teams: t.teams?.length || 0,
          champion: lastChampion?.winnerTeam?.name || undefined,
          mvp: lastChampion?.mvp?.gamertag || undefined,
        });
      }
    }

    return items;
  }, [maleData, femaleData]);

  if (tournamentStatuses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tournamentStatuses.map((t, i) => {
        const dt = getDivisionTheme(t.division);
        const isLive = t.status === 'live';
        const isCompleted = t.status === 'completed';

        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className={`${dt.cardPremium} border ${dt.borderSubtle} overflow-hidden group hover:shadow-md transition-all duration-300`}>
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{t.division === 'male' ? '🕺' : '💃'}</span>
                    <span className={`text-xs font-bold ${dt.text}`}>{t.name}</span>
                  </div>
                  <Badge className={`${
                    isLive
                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : isCompleted
                      ? 'bg-green-500/15 text-green-400 border-green-500/30'
                      : 'bg-idm-gold-warm/15 text-idm-gold-warm border-idm-gold-warm/30'
                  } text-[8px] border`}>
                    {isLive ? '🔴 LIVE' : isCompleted ? '✅ Selesai' : '⏳ Segera'}
                  </Badge>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Week {t.week}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {t.teams} Tim
                  </span>
                </div>

                {/* Last champion / MVP info */}
                {(t.champion || t.mvp) && (
                  <div className="pt-2 border-t border-border/10 space-y-1.5">
                    {t.champion && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span>👑</span>
                        <span className="text-muted-foreground">Champion:</span>
                        <span className="font-semibold truncate">{t.champion}</span>
                      </div>
                    )}
                    {t.mvp && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span>⭐</span>
                        <span className="text-muted-foreground">MVP:</span>
                        <span className="font-semibold truncate">{t.mvp}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
