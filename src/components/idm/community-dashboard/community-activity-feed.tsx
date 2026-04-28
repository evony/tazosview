'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Activity, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { getDivisionTheme } from '@/hooks/use-division-theme';

/* ═══════════════════════════════════════════════════════
   COMMUNITY ACTIVITY FEED — Stream of recent community activities
   ═══════════════════════════════════════════════════════ */

interface ActivityItem {
  id: string;
  type: 'registration' | 'match_result' | 'donation' | 'achievement';
  title: string;
  description: string;
  icon: string;
  timestamp: string;
  division?: string;
}

/* ── Relative time formatter for Indonesian locale ── */
function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/* ── Type-based color styles ── */
const typeStyles = {
  registration: {
    dot: 'bg-cyan-400',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/5',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/10',
  },
  match_result: {
    dot: 'bg-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  donation: {
    dot: 'bg-pink-400',
    border: 'border-pink-500/20',
    bg: 'bg-pink-500/5',
    text: 'text-pink-400',
    glow: 'shadow-pink-500/10',
  },
  achievement: {
    dot: 'bg-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/10',
  },
};

/* ── Animation variants ── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ── Individual activity item ── */
function ActivityEntry({ activity }: { activity: ActivityItem }) {
  const style = typeStyles[activity.type];

  // Determine division badge
  const divisionLabel = activity.division === 'male' ? '🕺 Male' : activity.division === 'female' ? '💃 Female' : null;
  const divDt = activity.division ? getDivisionTheme(activity.division as 'male' | 'female') : null;

  return (
    <motion.div
      variants={itemVariants}
      className={`group relative flex gap-3 p-2.5 rounded-lg ${style.bg} ${style.border} border transition-all hover:shadow-md ${style.glow}`}
    >
      {/* Timeline dot & line */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`w-2 h-2 rounded-full ${style.dot} ring-1.5 ring-background`} />
        <div className="w-px flex-1 bg-border/30 mt-1 min-h-[12px]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-0.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs" role="img" aria-hidden="true">{activity.icon}</span>
          <span className={`text-[10px] font-semibold ${style.text}`}>{activity.title}</span>
          {divisionLabel && divDt && (
            <Badge className={`${divDt.badgeBg} text-[7px] border py-0 px-1`}>
              {divisionLabel}
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-foreground/70 truncate">{activity.description}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
          <span className="text-[9px] text-muted-foreground/60">{formatRelativeTime(activity.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Community Activity Feed Component ── */
export function CommunityActivityFeed() {
  const dt = useCommunityTheme();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['community-activity-feed'],
    queryFn: async () => {
      const res = await fetch('/api/activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const activities: ActivityItem[] = (data?.activities ?? []).slice(0, 8);

  return (
    <Card className={`${dt.casinoCard} overflow-hidden`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md ${dt.iconBg} flex items-center justify-center`}>
            <Activity className={`w-3 h-3 ${dt.text}`} />
          </div>
          <span className={dt.neonText}>Aktivitas Komunitas</span>
          {!isLoading && activities.length > 0 && (
            <span className="ml-auto flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <span className="text-[8px] text-green-400 font-medium">Live</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2.5 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-2.5 p-2 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-muted shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-20 rounded bg-muted" />
                  <div className="h-2 w-full rounded bg-muted/60" />
                  <div className="h-1.5 w-14 rounded bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-6">
            <p className="text-[10px] text-muted-foreground">Gagal memuat aktivitas</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3">
              <Activity className="w-8 h-8 text-muted-foreground/20" />
            </div>
            <p className="text-[10px] text-muted-foreground/50 font-medium">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto custom-scrollbar pr-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activities.map(a => a.id).join(',')}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-1.5"
              >
                {activities.map((activity) => (
                  <ActivityEntry key={activity.id} activity={activity} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
