'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedEmptyState } from '../ui/animated-empty-state';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';

/* ─── Chart Data Types ─── */
interface TierDistItem { tier: string; count: number; }
interface ClubPerfItem { club: string; points: number; wins: number; members: number; }
interface WeeklyTrendItem { week: number; registrations: number; matches: number; }
interface TopPerformerItem { gamertag: string; points: number; wins: number; mvp: number; }

interface ChartsData {
  tierDistribution: TierDistItem[];
  clubPerformance: ClubPerfItem[];
  weeklyTrend: WeeklyTrendItem[];
  topPerformers: TopPerformerItem[];
}

/* ─── Tier Colors ─── */
const TIER_COLORS: Record<string, string> = {
  S: '#ef4444', // red
  A: '#f59e0b', // amber
  B: '#22c55e', // green
  C: '#3b82f6', // blue
  D: '#6b7280', // gray
};

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl">
      {label && <p className="text-[10px] font-semibold text-muted-foreground mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: entry.color || '#f5e6c8' }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Pie Chart Label ─── */
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number;
  percent: number; name: string;
}) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
}

/* ─── Stats Tab ─── */
export function StatsTab() {
  const division = useAppStore(s => s.division);
  const dt = useDivisionTheme();

  const { data, isLoading, error } = useQuery<ChartsData>({
    queryKey: ['stats-charts', division],
    queryFn: async () => {
      const res = await fetch(`/api/stats/charts?division=${division}`);
      if (!res.ok) throw new Error('Failed to fetch charts data');
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return <StatsTabSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <AnimatedEmptyState
          icon={BarChart3}
          message="Gagal memuat statistik"
          hint="Coba refresh halaman ini"
        />
      </div>
    );
  }

  const hasData = data.tierDistribution.length > 0 || data.clubPerformance.length > 0 ||
    data.weeklyTrend.length > 0 || data.topPerformers.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-4">
        <AnimatedEmptyState
          icon={BarChart3}
          message="Belum ada data statistik"
          hint="Data akan muncul setelah ada pemain dan pertandingan"
        />
      </div>
    );
  }

  const accentColor = division === 'male' ? '#22d3ee' : '#c084fc';
  const accentColorLight = division === 'male' ? '#67e8f9' : '#e9d5ff';
  const goldColor = '#e5be4a';

  // Max points for top performers horizontal bar
  const maxPoints = data.topPerformers.length > 0
    ? Math.max(...data.topPerformers.map(p => p.points), 1)
    : 1;

  return (
    <div className="space-y-4">
      {/* ─── Row 1: Tier Distribution + Club Performance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tier Distribution PieChart */}
        <StatsCard
          title="Distribusi Tier"
          icon={PieChartIcon}
          badge={`${data.tierDistribution.reduce((s, t) => s + t.count, 0)} Pemain`}
          dt={dt}
        >
          {data.tierDistribution.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="w-full h-[220px] sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.tierDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={40}
                      dataKey="count"
                      nameKey="tier"
                      label={renderPieLabel}
                      labelLine={false}
                      stroke="none"
                    >
                      {data.tierDistribution.map((entry) => (
                        <Cell
                          key={entry.tier}
                          fill={TIER_COLORS[entry.tier] || '#6b7280'}
                          className="transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <ReTooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Tier Legend */}
              <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
                {data.tierDistribution.map((t) => (
                  <div key={t.tier} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: TIER_COLORS[t.tier] }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Tier {t.tier}
                    </span>
                    <span className="text-xs font-bold" style={{ color: TIER_COLORS[t.tier] }}>
                      {t.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart message="Belum ada data tier" />
          )}
        </StatsCard>

        {/* Club Performance BarChart */}
        <StatsCard
          title="Performa Klub"
          icon={BarChart3}
          badge={`${data.clubPerformance.length} Klub`}
          dt={dt}
        >
          {data.clubPerformance.length > 0 ? (
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.clubPerformance} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(229,190,74,0.08)" />
                  <XAxis
                    dataKey="club"
                    tick={{ fill: '#a89878', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(229,190,74,0.12)' }}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: '#a89878', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(229,190,74,0.12)' }}
                    tickLine={false}
                  />
                  <ReTooltip content={<ChartTooltip />} />
                  <Bar dataKey="points" fill={accentColor} radius={[4, 4, 0, 0]} name="Points" />
                  <Bar dataKey="wins" fill={goldColor} radius={[4, 4, 0, 0]} name="Wins" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Belum ada data klub" />
          )}
        </StatsCard>
      </div>

      {/* ─── Row 2: Weekly Trend ─── */}
      <StatsCard
        title="Tren Mingguan"
        icon={TrendingUp}
        badge={data.weeklyTrend.length > 0 ? `W1–W${data.weeklyTrend[data.weeklyTrend.length - 1]?.week || 1}` : undefined}
        dt={dt}
      >
        {data.weeklyTrend.length > 0 ? (
          <div className="h-[220px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyTrend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(229,190,74,0.08)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#a89878', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(229,190,74,0.12)' }}
                  tickLine={false}
                  tickFormatter={(v: number) => `W${v}`}
                />
                <YAxis
                  tick={{ fill: '#a89878', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(229,190,74,0.12)' }}
                  tickLine={false}
                />
                <ReTooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#a89878' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke={accentColor}
                  strokeWidth={2}
                  dot={{ fill: accentColor, r: 3 }}
                  activeDot={{ r: 5, fill: accentColorLight }}
                  name="Registrasi"
                />
                <Line
                  type="monotone"
                  dataKey="matches"
                  stroke={goldColor}
                  strokeWidth={2}
                  dot={{ fill: goldColor, r: 3 }}
                  activeDot={{ r: 5, fill: '#f5d77a' }}
                  name="Match"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Belum ada data tren mingguan" />
        )}
      </StatsCard>

      {/* ─── Row 3: Top Performers Horizontal Bar ─── */}
      <StatsCard
        title="Top Performer"
        icon={Award}
        badge="TOP 5"
        dt={dt}
      >
        {data.topPerformers.length > 0 ? (
          <div className="space-y-3">
            {data.topPerformers.map((player, idx) => {
              const barWidth = maxPoints > 0 ? (player.points / maxPoints) * 100 : 0;
              const rankColors = [
                'from-yellow-500 to-amber-600',
                'from-gray-400 to-gray-500',
                'from-amber-700 to-amber-800',
              ];
              const barGradient = idx < 3
                ? rankColors[idx]
                : division === 'male'
                  ? 'from-idm-male/60 to-idm-male/30'
                  : 'from-idm-female/60 to-idm-female/30';

              return (
                <div key={player.gamertag} className="group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-600' :
                      `${dt.iconBg} text-muted-foreground`
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold truncate flex-1">{player.gamertag}</span>
                    <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
                      <span className="text-green-500 font-medium">{player.wins}W</span>
                      {player.mvp > 0 && <span className="text-yellow-500 font-medium">⭐{player.mvp}</span>}
                      <span className={`font-bold ${dt.neonText}`}>{player.points} pts</span>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full ${dt.bgSubtle} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient} progress-fill-animate`}
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyChart message="Belum ada data performer" />
        )}
      </StatsCard>
    </div>
  );
}

/* ─── Stats Card wrapper ─── */
function StatsCard({ title, icon: Icon, badge, children, dt }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children: React.ReactNode;
  dt: ReturnType<typeof useDivisionTheme>;
}) {
  return (
    <div className={`${dt.casinoCard} casino-shimmer overflow-hidden rounded-xl`}>
      <div className={dt.casinoBar} />
      <div className="relative z-10">
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
          <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3 h-3 ${dt.neonText}`} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
          {badge && <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{badge}</Badge>}
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty chart state ─── */
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[180px] rounded-xl bg-muted/5 border border-border/20">
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

/* ─── Loading Skeleton ─── */
function StatsTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="casino-card casino-card-male casino-shimmer overflow-hidden rounded-xl">
            <div className="casino-card-bar-male" />
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-idm-male/10">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-4 w-12 rounded ml-auto" />
              </div>
              <div className="p-4 space-y-3">
                <Skeleton className="h-[220px] w-full rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="casino-card casino-card-male casino-shimmer overflow-hidden rounded-xl">
        <div className="casino-card-bar-male" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-idm-male/10">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-4 w-12 rounded ml-auto" />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
        </div>
      </div>
      <div className="casino-card casino-card-male casino-shimmer overflow-hidden rounded-xl">
        <div className="casino-card-bar-male" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-idm-male/10">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-4 w-12 rounded ml-auto" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-10 rounded ml-auto" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
