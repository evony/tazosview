'use client';

import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import { hexToRgba } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   COMMUNITY ACTIVITY MARQUEE — Opsi C-R
   1 baris, ~56-64px, pill-shaped items, hover detail, pause on hover
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

/* ── Relative time ── */
function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Baru';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}j`;
  if (days < 7) return `${days}h`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/* ── Type accent colors ── */
const TYPE_ACCENT: Record<ActivityItem['type'], string> = {
  registration: '#22d3ee',
  match_result: '#f59e0b',
  donation: '#f472b6',
  achievement: '#a855f7',
};

const TYPE_LABEL: Record<ActivityItem['type'], string> = {
  registration: 'Bergabung',
  match_result: 'Pertandingan',
  donation: 'Donasi',
  achievement: 'Pencapaian',
};

/* ── Single Pill Item ── */
function ActivityPill({ item }: { item: ActivityItem }) {
  const accent = TYPE_ACCENT[item.type];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pill shape */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 cursor-default select-none"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(accent, 0x08)} 0%, ${hexToRgba(accent, 0x03)} 100%)`,
          borderColor: hovered ? hexToRgba(accent, 0x35) : hexToRgba(accent, 0x15),
          boxShadow: hovered ? `0 0 12px ${hexToRgba(accent, 0x15)}` : 'none',
        }}
      >
        {/* Icon */}
        <span
          className="text-sm shrink-0"
          style={{ filter: `drop-shadow(0 0 3px ${hexToRgba(accent, 0x30)})` }}
        >
          {item.icon}
        </span>

        {/* Title */}
        <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
          {item.description}
        </span>

        {/* Division dot */}
        {item.division && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: item.division === 'male' ? '#06b6d4' : '#a855f7',
              boxShadow: `0 0 4px ${item.division === 'male' ? hexToRgba('#06b6d4', 0x40) : hexToRgba('#a855f7', 0x40)}`,
            }}
          />
        )}

        {/* Time */}
        <span
          className="text-[9px] font-medium shrink-0 tabular-nums px-1.5 py-0.5 rounded"
          style={{ color: hexToRgba(accent, 0xaa), background: hexToRgba(accent, 0x10) }}
        >
          {formatTimeAgo(item.timestamp)}
        </span>
      </div>

      {/* Hover detail popup */}
      {hovered && (
        <div
          className="absolute top-full left-0 mt-1.5 z-50 px-3 py-2 rounded-lg border text-[10px] whitespace-nowrap pointer-events-none"
          style={{
            background: 'hsl(var(--card))',
            borderColor: hexToRgba(accent, 0x25),
            boxShadow: `0 4px 20px ${hexToRgba(accent, 0x12)}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: accent, background: hexToRgba(accent, 0x12) }}
            >
              {TYPE_LABEL[item.type]}
            </span>
            {item.division && (
              <span className="text-[9px] text-muted-foreground">
                {item.division === 'male' ? '🕺 Male' : '💃 Female'}
              </span>
            )}
          </div>
          <p className="text-foreground font-medium">{item.title}</p>
          <p className="text-muted-foreground">{item.description}</p>
        </div>
      )}
    </div>
  );
}

/* ── Separator diamond ── */
function Separator() {
  return <span className="text-[8px] text-idm-gold-warm/20 shrink-0 mx-0.5 select-none">◆</span>;
}

/* ── Main Marquee Component ── */
export function CommunityActivityMarquee() {
  const dt = useCommunityTheme();
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const { data } = useQuery<{ activities: ActivityItem[] }>({
    queryKey: ['community-activity-feed'],
    queryFn: async () => {
      const res = await fetch('/api/activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const activities = useMemo(() => (data?.activities ?? []).slice(0, 15), [data?.activities]);

  // Build track content
  const trackContent = useMemo(() => {
    if (activities.length === 0) return null;
    const elements: React.ReactNode[] = [];
    activities.forEach((item, i) => {
      elements.push(<ActivityPill key={`pill-${item.id}`} item={item} />);
      if (i < activities.length - 1) {
        elements.push(<Separator key={`sep-${i}`} />);
      }
    });
    return elements;
  }, [activities]);

  // JS-driven infinite scroll
  useEffect(() => {
    const animate = () => {
      if (!trackRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      if (!pausedRef.current) {
        offsetRef.current -= 0.4;
      }
      const totalWidth = trackRef.current.scrollWidth / 2;
      if (Math.abs(offsetRef.current) >= totalWidth) {
        offsetRef.current += totalWidth;
      }
      trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // No activities — show subtle empty state
  if (!data || activities.length === 0) {
    return (
      <div className={`rounded-xl border ${dt.borderSubtle} ${dt.bgSubtle} px-4 py-3 flex items-center gap-2`}>
        <span className="text-sm opacity-40">🔔</span>
        <span className="text-[10px] text-muted-foreground/50">Belum ada aktivitas komunitas</span>
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-hidden relative group rounded-xl border border-idm-gold-warm/10 bg-idm-gold-warm/[0.02]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left label */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-1.5 px-3 bg-idm-gold-warm/[0.06] border-r border-idm-gold-warm/10">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
        </span>
        <span className={`text-[9px] font-bold ${dt.neonText} uppercase tracking-wider whitespace-nowrap`}>
          Live
        </span>
      </div>

      {/* Fade edges */}
      <div
        className="absolute left-[52px] top-0 bottom-0 w-8 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }}
      />

      {/* Scrolling track — padded left for label */}
      <div className="pl-14 pr-2 py-2">
        <div
          ref={trackRef}
          className="flex items-center gap-1 shrink-0"
          style={{ width: 'max-content', willChange: 'transform' }}
        >
          {trackContent}
          {trackContent}
        </div>
      </div>
    </div>
  );
}
