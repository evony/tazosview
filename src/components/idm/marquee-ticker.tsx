'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Wallet, Swords, Trophy, Calendar } from 'lucide-react';
import Pusher from 'pusher-js';
import { hexToRgba, formatCurrency } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

/* ========== Feed Item Types ========== */
interface FeedItem {
  id: string;
  type: 'transfer' | 'donation' | 'score' | 'champion' | 'mvp' | 'registration' | 'stat';
  icon: string;
  title: string;
  subtitle: string;
  timestamp: string;
  division?: string;
  accent: string;
  numericValue?: number;
}

/* ========== Time Formatter ========== */
function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Baru';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}j`;
  if (days < 7) return `${days}h`;
  return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/* ========== Fallback Demo Items (shown when no data) ========== */
const DEMO_ITEMS: FeedItem[] = [
  { id: 'demo-1', type: 'champion', icon: '🏆', title: 'Team Alpha Juara Week 5!', subtitle: 'Male Division', timestamp: new Date().toISOString(), division: 'male', accent: '#d4a853' },
  { id: 'demo-2', type: 'donation', icon: '💰', title: 'CommunityPartner menyawer Rp500rb', subtitle: 'Donasi Weekly', timestamp: new Date().toISOString(), accent: '#22c55e' },
  { id: 'demo-3', type: 'score', icon: '⚽', title: 'Club A 3–1 Club B', subtitle: 'Week 5 • Club A menang!', timestamp: new Date().toISOString(), division: 'male', accent: '#06b6d4' },
  { id: 'demo-4', type: 'mvp', icon: '⭐', title: 'Dancer_X MVP Week 5!', subtitle: 'Male Division', timestamp: new Date().toISOString(), division: 'male', accent: '#eab308' },
  { id: 'demo-5', type: 'transfer', icon: '🔄', title: 'StarPlayer pindah ke Club C', subtitle: 'Dari Club A → Club C', timestamp: new Date().toISOString(), division: 'female', accent: '#a855f7' },
  { id: 'demo-6', type: 'registration', icon: '🆕', title: 'NewDancer mendaftar sebagai pemain', subtitle: 'Female Division', timestamp: new Date().toISOString(), division: 'female', accent: '#22d3ee' },
  { id: 'demo-7', type: 'donation', icon: '💰', title: 'AnonDonor menyawer Rp1jt', subtitle: 'Donasi Season', timestamp: new Date().toISOString(), accent: '#22c55e' },
  { id: 'demo-8', type: 'champion', icon: '🏆', title: 'Team Omega Juara Week 4!', subtitle: 'Female Division', timestamp: new Date().toISOString(), division: 'female', accent: '#d4a853' },
  { id: 'demo-9', type: 'score', icon: '⚽', title: 'Club D 2–2 Club E', subtitle: 'Week 5 • Seru!', timestamp: new Date().toISOString(), division: 'female', accent: '#06b6d4' },
  { id: 'demo-10', type: 'donation', icon: '💎', title: 'VIPSupporter menyawer Rp250rb', subtitle: 'Donasi Season', timestamp: new Date().toISOString(), accent: '#22c55e' },
];

/* ========== Accent colors per type ========== */
const TYPE_ACCENT: Record<FeedItem['type'], string> = {
  champion: '#d4a853',
  mvp: '#eab308',
  donation: '#22c55e',
  score: '#06b6d4',
  transfer: '#a855f7',
  registration: '#22d3ee',
  stat: '#d4a853',
};

/* ========== Count-up hook for stat values ========== */
function useCountUp(target: number, duration = 1200, delay = 200) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started || target <= 0) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { current };
}

/* ========== Single Feed Card ========== */
function FeedCard({ item }: { item: FeedItem }) {
  const accent = item.accent || TYPE_ACCENT[item.type] || '#d4a853';
  const isStat = item.type === 'stat';
  const { current } = useCountUp(item.numericValue || 0, 1200, 0);

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2 rounded-lg shrink-0 border transition-all duration-300 cursor-default select-none ${
        isStat
          ? 'bg-idm-gold-warm/[0.06] border-idm-gold-warm/20 hover:border-idm-gold-warm/35 hover:shadow-[0_0_16px_rgba(212,168,83,0.1)]'
          : 'hover:scale-[1.02]'
      }`}
      style={isStat ? {} : {
        background: `linear-gradient(135deg, ${hexToRgba(accent, 0x08)} 0%, ${hexToRgba(accent, 0x03)} 100%)`,
        borderColor: hexToRgba(accent, 0x20),
      }}
    >
      {/* Icon with glow */}
      <span
        className="text-base shrink-0 drop-shadow-sm"
        style={{ filter: `drop-shadow(0 0 4px ${hexToRgba(accent, 0x40)})` }}
      >
        {item.icon}
      </span>

      {/* Content */}
      <div className="flex items-center gap-2 min-w-0">
        {isStat ? (
          <div className="flex flex-col">
            <span className="text-sm font-black text-gradient-fury whitespace-nowrap">
              {item.numericValue && item.numericValue > 0 ? current : item.title}
            </span>
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">{item.subtitle}</span>
          </div>
        ) : (
          <>
            <p className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
              {item.title}
            </p>
            {item.subtitle && (
              <>
                <span className="text-muted-foreground/20 shrink-0 text-[8px]">◆</span>
                <p className="text-[10px] text-muted-foreground/70 truncate max-w-[100px] sm:max-w-[140px] hidden sm:block">
                  {item.subtitle}
                </p>
              </>
            )}
          </>
        )}
      </div>

      {/* Time badge — only for feed items */}
      {!isStat && (
        <span
          className="text-[9px] font-medium shrink-0 tabular-nums px-1.5 py-0.5 rounded"
          style={{ color: hexToRgba(accent, 0xaa), background: hexToRgba(accent, 0x10) }}
        >
          {formatTimeAgo(item.timestamp)}
        </span>
      )}

      {/* Division dot — only for feed items */}
      {!isStat && item.division && (
        <span
          className="w-2 h-2 rounded-full shrink-0 ring-1 ring-offset-1 ring-offset-background"
          style={{
            backgroundColor: item.division === 'male' ? '#06b6d4' : '#a855f7',
            boxShadow: `0 0 6px ${item.division === 'male' ? hexToRgba('#06b6d4', 0x40) : hexToRgba('#a855f7', 0x40)}`,
            '--tw-ring-color': item.division === 'male' ? hexToRgba('#06b6d4', 0x60) : hexToRgba('#a855f7', 0x60),
          } as React.CSSProperties}
        />
      )}
    </div>
  );
}

/* ========== Separator ========== */
function Separator() {
  return (
    <span className="text-[8px] text-idm-gold-warm/25 shrink-0 mx-1 select-none">◆</span>
  );
}

/* ========== Combined Marquee Props ========== */
interface UnifiedMarqueeProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  leagueData?: any;
}

/* ========== Unified Marquee — Stats + Feed in one scrolling bar ========== */
export function MarqueeTicker({ maleData, femaleData, leagueData }: UnifiedMarqueeProps = {}) {
  const qc = useQueryClient();
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const { data } = useQuery<{ items: FeedItem[] }>({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await fetch('/api/feed');
      if (!res.ok) throw new Error('Feed fetch failed');
      return res.json();
    },
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Pusher real-time
  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) return;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe('idm-feed');
    channel.bind('feed-updated', () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [qc]);

  // Build combined items: stats first, then feed items
  const combinedItems = useMemo(() => {
    const stats: FeedItem[] = [];

    // Calculate aggregate stats
    const totalPlayers = (maleData?.totalPlayers || 0) + (femaleData?.totalPlayers || 0);
    const totalPrizePool = (maleData?.totalPrizePool || 0) + (femaleData?.totalPrizePool || 0);
    const totalMatches = leagueData?.stats?.totalMatches || (maleData?.recentMatches?.length || 0) + (femaleData?.recentMatches?.length || 0);
    const seasonInfo = leagueData?.ligaChampion
      ? `Season ${leagueData.ligaChampion.seasonNumber}`
      : leagueData?.preSeason ? 'Pre-Season' : 'Current Season';

    stats.push(
      { id: 'stat-players', type: 'stat', icon: '👥', title: `${totalPlayers}`, subtitle: 'Total Players', timestamp: new Date().toISOString(), accent: '#22d3ee', numericValue: totalPlayers },
      { id: 'stat-prize', type: 'stat', icon: '💰', title: formatCurrency(totalPrizePool), subtitle: 'Prize Pool', timestamp: new Date().toISOString(), accent: '#22c55e', numericValue: totalPrizePool },
      { id: 'stat-matches', type: 'stat', icon: '⚔️', title: `${totalMatches}`, subtitle: 'Matches', timestamp: new Date().toISOString(), accent: '#a855f7', numericValue: totalMatches },
      { id: 'stat-season', type: 'stat', icon: '📅', title: seasonInfo, subtitle: 'Current Season', timestamp: new Date().toISOString(), accent: '#f59e0b' },
      { id: 'stat-champ', type: 'stat', icon: '🏆', title: leagueData?.ligaChampion?.name || 'TBD', subtitle: 'Reigning Champion', timestamp: new Date().toISOString(), accent: '#d4a853' },
    );

    const feedItems = (data?.items && data.items.length > 0) ? data.items : DEMO_ITEMS;

    return [...stats, ...feedItems];
  }, [data?.items, maleData, femaleData, leagueData]);

  // Build the track with separators
  const trackContent = useMemo(() => {
    const elements: React.ReactNode[] = [];
    combinedItems.forEach((item, i) => {
      elements.push(<FeedCard key={`card-${item.id}-${i}`} item={item} />);
      if (i < combinedItems.length - 1) {
        elements.push(<Separator key={`sep-${i}`} />);
      }
    });
    return elements;
  }, [combinedItems]);

  // JS-driven infinite scroll
  useEffect(() => {
    const animate = () => {
      if (!trackRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!pausedRef.current) {
        offsetRef.current -= 0.5;
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

  if (combinedItems.length === 0) return null;

  return (
    <div
      className="w-full overflow-hidden relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }}
      />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }}
      />

      {/* Scrolling track — 2x for seamless loop */}
      <div
        ref={trackRef}
        className="flex items-center shrink-0"
        style={{ width: 'max-content', willChange: 'transform' }}
      >
        {trackContent}
        {trackContent}
      </div>
    </div>
  );
}
