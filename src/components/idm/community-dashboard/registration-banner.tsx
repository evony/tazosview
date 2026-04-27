'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DoorOpen, DoorClosed, Clock, Bell, Zap, Trophy, Calendar,
} from 'lucide-react';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   REGISTRATION BANNER — Banner for registration window status
   ═══════════════════════════════════════════════════════ */
interface RegistrationBannerProps {
  maleData?: StatsData;
  femaleData?: StatsData;
}

interface RegistrationInfo {
  division: 'male' | 'female';
  tournamentName: string;
  weekNumber: number;
  scheduledAt: string;
  prizePool: number;
  status: string;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Waktu habis');
        setIsExpired(true);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}h ${hours % 24}j`);
      } else {
        setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
      }
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className={isExpired ? 'text-red-400' : 'text-emerald-300'}>{timeLeft}</span>
  );
}

export function RegistrationBanner({ maleData, femaleData }: RegistrationBannerProps) {
  const dt = useCommunityTheme();

  // Find registration-open tournaments
  const registrations = useMemo(() => {
    const items: RegistrationInfo[] = [];

    for (const [div, data] of [['male', maleData], ['female', femaleData]] as const) {
      if (data?.activeTournament?.status === 'registration') {
        const t = data.activeTournament;
        items.push({
          division: div,
          tournamentName: t.name,
          weekNumber: t.weekNumber,
          scheduledAt: t.scheduledAt,
          prizePool: t.prizePool,
          status: t.status,
        });
      }
    }

    return items;
  }, [maleData, femaleData]);

  // Determine current status for each division
  const divisionStatuses = useMemo(() => {
    const items: { division: 'male' | 'female'; status: string; name: string; week: number }[] = [];

    for (const [div, data] of [['male', maleData], ['female', femaleData]] as const) {
      if (data?.activeTournament) {
        items.push({
          division: div,
          status: data.activeTournament.status,
          name: data.activeTournament.name,
          week: data.activeTournament.weekNumber,
        });
      }
    }

    return items;
  }, [maleData, femaleData]);

  // ── Registration OPEN ──
  if (registrations.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card className="overflow-hidden border-2 border-emerald-500/30">
          {/* Gradient background */}
          <div className="relative bg-gradient-to-br from-emerald-600/20 via-green-600/10 to-emerald-700/20 overflow-hidden">
            {/* Animated glow pulse */}
            <motion.div
              className="absolute inset-0 bg-emerald-500/5"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <CardContent className="p-4 lg:p-6 relative z-10">
              {/* Pulse badge */}
              <div className="flex items-center gap-2 mb-3">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-[10px] font-bold animate-pulse">
                    🔴 PENDAFTARAN DIBUKA!
                  </Badge>
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2
                className="text-xl lg:text-2xl font-black text-emerald-300 mb-1"
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                PENDAFTARAN DIBUKA!
              </motion.h2>

              {/* Tournament info for each open registration */}
              <div className="space-y-3 mt-3">
                {registrations.map((reg) => (
                  <div
                    key={reg.division}
                    className="flex items-center justify-between flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{reg.division === 'male' ? '🕺' : '💃'}</span>
                      <span className="text-xs font-semibold">{reg.tournamentName}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] border">
                        Week {reg.weekNumber}
                      </Badge>
                    </div>
                    {reg.scheduledAt && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span className="text-muted-foreground">Tutup dalam:</span>
                        <CountdownTimer targetDate={reg.scheduledAt} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Daftar Sekarang
                  </span>
                </button>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ── Registration CLOSED / No registration ──
  // Determine message based on current tournament status
  const hasLiveTournament = divisionStatuses.some((d) => d.status === 'live');
  const hasCompletedTournament = divisionStatuses.some((d) => d.status === 'completed');

  const statusMessage = hasLiveTournament
    ? 'Tournament Sedang Berlangsung'
    : hasCompletedTournament
    ? 'Tournament Selesai'
    : 'Pendaftaran Ditutup';

  const statusDescription = hasLiveTournament
    ? 'Pertandingan sedang berlangsung! Nonton dan dukung pemain favoritmu.'
    : hasCompletedTournament
    ? 'Tournament telah selesai. Nantikan pendaftaran berikutnya!'
    : 'Pendaftaran saat ini ditutup. Nantikan pengumuman selanjutnya!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`${dt.casinoCard} overflow-hidden`}>
        <div className={dt.casinoBar} />
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl ${dt.iconBg} flex items-center justify-center shrink-0`}>
              {hasLiveTournament ? (
                <Trophy className={`w-5 h-5 ${dt.text}`} />
              ) : (
                <DoorClosed className={`w-5 h-5 ${dt.text} opacity-60`} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold">{statusMessage}</h3>
                {hasLiveTournament && (
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[8px] border">
                    🔴 LIVE
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{statusDescription}</p>

              {/* Division info if available */}
              {divisionStatuses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {divisionStatuses.map((ds) => (
                    <div key={ds.division} className="flex items-center gap-1.5">
                      <span className="text-[10px]">{ds.division === 'male' ? '🕺' : '💃'}</span>
                      <span className="text-[10px] text-muted-foreground">{ds.name}</span>
                      <Badge className={`${dt.badgeBg} text-[7px] border`}>W{ds.week}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notification button */}
            <button
              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider ${dt.bgSubtle} border ${dt.borderSubtle} ${dt.text} hover:${dt.hoverBgSubtle} transition-colors duration-200 shrink-0`}
            >
              <span className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                <span className="hidden sm:inline">Notifikasi</span>
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
