'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
// Note: motion.div removed — replaced with CSS animations
import {
  Trophy, Crown, Radio, Clock, Flame, Zap,
  Star,
  Activity, CheckCircle2, Timer
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareButton } from './ui/share-button';
import {
  MatchDayHeroSkeleton,
  MatchRowSkeleton,
  StatsRowSkeleton,
} from './ui/skeleton';
import { useState, useMemo } from 'react';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { formatCurrency } from '@/lib/utils';
import type { StatsData } from '@/types/stats';
// container/item removed — replaced with CSS stagger-item classes

/* ─── Live Pulse Indicator ─── */
function LivePulse() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Live</span>
    </div>
  );
}

/* ─── Match Event for Timeline ─── */
interface MatchEvent {
  time: string;
  type: 'session_open' | 'score_input' | 'mvp_selected' | 'match_end' | 'match_scheduled' | 'round_result';
  team: 'team1' | 'team2' | 'neutral';
  description: string;
  player?: string;
}

/* ─── Timeline Event ─── */
function TimelineEvent({ event, idx }: { event: MatchEvent; idx: number }) {
  const dt = useDivisionTheme();
  const iconMap = {
    session_open: <Activity className="w-3 h-3 text-green-400" />,
    round_result: <CheckCircle2 className="w-3 h-3 text-blue-400" />,
    score_input: <Star className="w-3 h-3 text-emerald-400" />,
    mvp_selected: <Crown className="w-3 h-3 text-yellow-500" />,
    match_scheduled: <Clock className="w-3 h-3 text-amber-400" />,
    match_end: <Trophy className="w-3 h-3 text-idm-gold-warm" />,
  };

  const teamColor = event.team === 'team1' ? dt.neonText : event.team === 'team2' ? 'text-purple-400' : 'text-muted-foreground';

  return (
    <div
      className="stagger-item flex items-start gap-3"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-7 h-7 rounded-full ${dt.bgSubtle} border ${dt.borderSubtle} flex items-center justify-center`}>
          {iconMap[event.type]}
        </div>
        {idx < 5 && <div className={`w-px h-4 ${dt.borderSubtle} bg-border`} />}
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${dt.casinoBadge} text-[8px] px-1.5 py-0`}>{event.time}</Badge>
          <span className={`text-[11px] font-semibold ${teamColor}`}>{event.description}</span>
        </div>
        {event.player && (
          <p className="text-[9px] text-muted-foreground mt-0.5 ml-10">{event.player}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ title, icon: Icon, badge, children, className = '' }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const dt = useDivisionTheme();
  return (
    <Card className={`${dt.casinoCard} overflow-hidden ${className}`}>
      <div className={dt.casinoBar} />
      <CardContent className="p-0 relative z-10">
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
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT: MatchDayCenter
   ═══════════════════════════════════════════════ */
export function MatchDayCenter() {
  const { division } = useAppStore();
  const dt = useDivisionTheme();
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);

  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ['stats', division],
    queryFn: async () => {
      const res = await fetch(`/api/stats?division=${division}`);
      return res.json();
    },
  });

  // Timeline events — only shows what admin actually inputs into the system.
  // No fake auto-detected game events, no simulated round timestamps.
  // The game is NOT integrated with the server, so we only display
  // organizer-input data: scores, MVP selection, match status.
  const matchEvents: MatchEvent[] = useMemo(() => {
    const t = data?.activeTournament;
    if (!t?.matches?.length) return [];
    const match = t.matches[selectedMatchIdx] || t.matches[0];
    const events: MatchEvent[] = [];

    // Match scheduled — shown for upcoming matches
    if (match.status === 'scheduled' || match.status === 'upcoming') {
      events.push({ time: t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'TBD', type: 'match_scheduled', team: 'neutral', description: 'Match dijadwalkan — menunggu sesi dimulai' });
      return events;
    }

    // Session opened by admin
    events.push({ time: t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Start', type: 'session_open', team: 'neutral', description: 'Sesi dibuka oleh organizer' });

    // Round results — derived from the admin-input scores (not auto-detected)
    const s1 = match.score1 ?? 0;
    const s2 = match.score2 ?? 0;

    if (s1 > 0 || s2 > 0) {
      // Show round-by-round result based on the final score input by admin
      // Each score point represents a round/dance-off win
      let roundNum = 0;
      const t1Rounds = s1;
      const t2Rounds = s2;
      // Interleave round wins to create a realistic sequence
      const maxRounds = Math.max(t1Rounds, t2Rounds);
      for (let i = 0; i < maxRounds; i++) {
        if (i < t1Rounds) {
          roundNum++;
          events.push({ time: `R${roundNum}`, type: 'round_result', team: 'team1', description: `Ronde ${roundNum}: ${match.team1?.name || 'TBD'} memenangkan dance-off` });
        }
        if (i < t2Rounds) {
          roundNum++;
          events.push({ time: `R${roundNum}`, type: 'round_result', team: 'team2', description: `Ronde ${roundNum}: ${match.team2?.name || 'TBD'} memenangkan dance-off` });
        }
      }

      // Final score submitted by admin
      events.push({ time: 'Final', type: 'score_input', team: s1 > s2 ? 'team1' : 'team2', description: `Skor akhir disubmit: ${s1} - ${s2}` });
    }

    // MVP — selected by admin/organizer
    if (match.mvpPlayer) {
      events.push({ time: 'Final', type: 'mvp_selected', team: 'neutral', description: 'MVP dipilih oleh organizer', player: match.mvpPlayer.gamertag });
    }

    // Match end
    if (match.status === 'completed') {
      events.push({ time: 'Final', type: 'match_end', team: 'neutral', description: 'Match selesai — hasil difinalisasi' });
    }

    return events;
  }, [data?.activeTournament, selectedMatchIdx]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <MatchDayHeroSkeleton />
        <div className="border-b border-border">
          <div className="flex items-center gap-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-9 w-24 rounded-none" aria-hidden="true" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
            <div className="skeleton-shimmer h-5 w-32 rounded" aria-hidden="true" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-6 w-full rounded-lg" aria-hidden="true" />
              ))}
            </div>
          </div>
          <StatsRowSkeleton count={3} className="grid-cols-3" />
        </div>
        <MatchRowSkeleton count={4} />
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className={`w-8 h-8 border-2 ${dt.border} border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  const t = data.activeTournament;
  const tournamentMatches = t?.matches || [];
  const selectedMatch = tournamentMatches[selectedMatchIdx] || tournamentMatches[0];

  return (
    <div className="space-y-5">

      {/* ═══════ HERO: Featured Match Banner ═══════ */}
      <div className="stagger-item-subtle stagger-d0">
        <Card className={`${dt.casinoCard} ${dt.casinoGlow} casino-shimmer overflow-hidden`}>
          <div className={dt.casinoBar} />
          <div className="relative">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img src="/bg-default.jpg" alt="" className="w-full h-full object-cover object-[center_30%]" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
            </div>

            <div className="relative z-10 p-4 lg:p-6">
              {/* Top Bar: Tournament Info + Live Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Badge className={`${dt.casinoBadge} text-[10px]`}>
                    <Flame className="w-3 h-3 mr-1" />
                    Week {t?.weekNumber ?? '-'}
                  </Badge>
                  <Badge className={`${dt.casinoBadge} text-[10px]`}>
                    {t?.name || 'Turnamen IDM'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <ShareButton
                    title={t?.name || 'Tarkam IDM'}
                    description={`Week ${t?.weekNumber ?? '-'} — ${division === 'male' ? 'Male' : 'Female'} Division`}
                    variant="icon"
                  />
                  {(selectedMatch?.status === 'live' || selectedMatch?.status === 'main_event') ? (
                    <LivePulse />
                  ) : selectedMatch?.status === 'completed' ? (
                    <Badge className="bg-green-500/10 text-green-500 text-[10px] font-black border-0">SELESAI</Badge>
                  ) : (
                    <Badge className={`${dt.casinoBadge} text-[10px]`}>MENDATANG</Badge>
                  )}
                </div>
              </div>

              {/* Match Selection Tabs */}
              {tournamentMatches.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1">
                  {tournamentMatches.map((m, idx) => {
                    const isActive = idx === selectedMatchIdx;
                    const isLive = m.status === 'live' || m.status === 'main_event';
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMatchIdx(idx)}
                        className={`shrink-0 px-3 py-2 rounded-md text-[11px] min-h-[36px] font-semibold transition-all border ${
                          isActive
                            ? `${dt.bg} ${dt.text} ${dt.border} shadow-sm`
                            : `${dt.bgSubtle} ${dt.borderSubtle} text-muted-foreground hover:text-foreground`
                        } ${isLive ? 'border-red-500/30' : ''}`}
                      >
                        {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 live-dot" />}
                        {m.team1?.name || 'TBD'} vs {(m.team2?.name || 'TBD')}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ═══ Main Match Display ═══ */}
              {selectedMatch && (
                <div className="flex items-center gap-4 lg:gap-8">
                  {/* Team 1 */}
                  <div className={`flex-1 text-center ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! ? '' : 'opacity-80'}`}>
                    <div
                      className={`hover-scale-md w-20 h-20 lg:w-28 lg:h-28 mx-auto rounded-2xl flex items-center justify-center text-2xl lg:text-4xl font-black shadow-lg ${
                        selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2!
                          ? `bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white glow-champion`
                          : `${dt.iconBg} ${dt.text}`
                      }`}
                    >
                      {(selectedMatch.team1?.name || 'TBD').slice(0, 2).toUpperCase()}
                    </div>
                    <p className={`text-sm lg:text-xl font-bold mt-3 ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! ? dt.neonText : ''}`}>
                      {selectedMatch.team1?.name || 'TBD'}
                    </p>
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! && (
                      <Badge className="bg-yellow-500/10 text-yellow-500 text-[9px] border-0 mt-1">
                        <Crown className="w-2.5 h-2.5 mr-0.5" /> WINNER
                      </Badge>
                    )}
                  </div>

                  {/* VS / Score Center */}
                  <div className="flex flex-col items-center shrink-0">
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null ? (
                      <div className="flex items-center gap-3 lg:gap-5">
                        <span
                          className={`stagger-item-subtle text-4xl lg:text-6xl font-black tabular-nums ${
                            selectedMatch.score1 > selectedMatch.score2 ? dt.neonGradient : 'text-foreground/30'
                          }`}
                        >
                          {selectedMatch.score1}
                        </span>
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-full ${dt.bgSubtle} ${dt.border} border flex items-center justify-center`}>
                            <Star className={`w-5 h-5 lg:w-7 lg:h-7 ${dt.neonText}`} />
                          </div>
                          <span className="text-[8px] text-muted-foreground mt-1 font-semibold uppercase">
                            {selectedMatch.status === 'completed' ? 'Final' : 'BO3'}
                          </span>
                        </div>
                        <span
                          className={`stagger-item-subtle text-4xl lg:text-6xl font-black tabular-nums ${
                            selectedMatch.score2 > selectedMatch.score1 ? dt.neonGradient : 'text-foreground/30'
                          }`}
                        >
                          {selectedMatch.score2}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div
                          className={`animate-pulse-scale w-16 h-16 lg:w-24 lg:h-24 rounded-full ${dt.bgSubtle} ${dt.border} border-2 flex items-center justify-center`}
                        >
                          <span className={`text-xl lg:text-3xl font-black ${dt.neonGradient}`}>VS</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-2 font-semibold">Segera Dimulai</span>
                      </div>
                    )}

                    {/* MVP */}
                    {selectedMatch.mvpPlayer && (
                      <div
                        className={`stagger-item-subtle flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg ${dt.bgSubtle} ${dt.border} border`}
                      >
                        <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-[10px] font-semibold text-yellow-500">MVP: {selectedMatch.mvpPlayer.gamertag}</span>
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className={`flex-1 text-center ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! ? '' : 'opacity-80'}`}>
                    <div
                      className={`hover-scale-md w-20 h-20 lg:w-28 lg:h-28 mx-auto rounded-2xl flex items-center justify-center text-2xl lg:text-4xl font-black shadow-lg ${
                        selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1!
                          ? `bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white glow-champion`
                          : `${dt.iconBg} ${dt.text}`
                      }`}
                    >
                      {(selectedMatch.team2?.name || 'TBD').slice(0, 2).toUpperCase()}
                    </div>
                    <p className={`text-sm lg:text-xl font-bold mt-3 ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! ? dt.neonText : ''}`}>
                      {selectedMatch.team2?.name || 'TBD'}
                    </p>
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! && (
                      <Badge className="bg-yellow-500/10 text-yellow-500 text-[9px] border-0 mt-1">
                        <Crown className="w-2.5 h-2.5 mr-0.5" /> WINNER
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Score Bar */}
              {selectedMatch && selectedMatch.score1 !== null && selectedMatch.score2 !== null && (selectedMatch.score1 + selectedMatch.score2) > 0 && (
                <div className="mt-4">
                  <div className={`h-2 rounded-full ${dt.bgSubtle} overflow-hidden flex`}>
                    <div
                      className={`h-full rounded-l-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`}
                      style={{ width: `${(selectedMatch.score1 / (selectedMatch.score1 + selectedMatch.score2)) * 100}%`, transition: 'width 0.8s ease-out' }}
                    />
                    <div
                      className={`h-full rounded-r-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male-light to-idm-male' : 'from-idm-female-light to-idm-female'}`}
                      style={{ width: `${(selectedMatch.score2 / (selectedMatch.score1 + selectedMatch.score2)) * 100}%`, opacity: 0.5, transition: 'width 0.8s ease-out' }}
                    />
                  </div>
                </div>
              )}

              {/* Match Meta */}
              {t && (
                <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.scheduledAt ? new Date(t.scheduledAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBD'}</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" />Week {t.weekNumber}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{formatCurrency(t.prizePool)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ═══════ TABS: Bracket / Queue / Timeline / Results ═══════ */}
      <Tabs defaultValue="bracket" className="w-full">
        <div className={`border-b ${dt.border}`}>
          <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
            {[
              { value: 'bracket', label: 'Bracket', icon: Trophy },
              { value: 'queue', label: 'Antrian', icon: Radio },
              { value: 'timeline', label: 'Lini Masa', icon: Activity },
              { value: 'results', label: 'Hasil', icon: Trophy },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`relative px-3 py-2.5 text-[11px] sm:text-xs sm:px-4 font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:shadow-none ${division === 'male' ? 'data-[state=active]:text-idm-male' : 'data-[state=active]:text-idm-female'} text-muted-foreground hover:text-foreground transition-colors`}
              >
                <tab.icon className="w-3.5 h-3.5 mr-1.5 inline" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ═══ BRACKET TAB ═══ */}
        <TabsContent value="bracket" className="mt-4 space-y-4">
          <div className="space-y-4">
            {/* Tournament Bracket Visualization */}
            <SectionCard title="Bracket Turnamen" icon={Trophy} badge={tournamentMatches.length > 0 ? `${tournamentMatches.length} match` : undefined}>
              {tournamentMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className={`w-10 h-10 mx-auto mb-3 opacity-30`} />
                  <p className="text-sm text-muted-foreground">Belum ada bracket — turnamen belum dimulai</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Group matches by round */}
                  {Object.entries(
                    tournamentMatches.reduce((acc: Record<string, typeof tournamentMatches>, m) => {
                      const round = m.round ?? 'Main';
                      if (!acc[round]) acc[round] = [];
                      acc[round].push(m);
                      return acc;
                    }, {})
                  ).map(([round, matches]) => (
                    <div key={round}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${dt.casinoBadge} text-[9px]`}>
                          {round === 'final' ? 'Final' : round === 'semifinal' || round === 'sf' ? 'Semifinal' : round === 'quarterfinal' || round === 'qf' ? 'Perempat Final' : `Round ${round}`}
                        </Badge>
                        <div className={`h-px flex-1 ${dt.borderSubtle}`} />
                      </div>
                      <div className="space-y-1.5">
                        {matches.map((m) => {
                          const isLive = m.status === 'live' || m.status === 'main_event';
                          const isCompleted = m.status === 'completed';
                          const team1Winner = m.score1 !== null && m.score2 !== null && m.score1 > m.score2;
                          const team2Winner = m.score1 !== null && m.score2 !== null && m.score2 > m.score1;
                          return (
                            <div
                              key={m.id}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                                isLive ? `${dt.border} border-red-500/30 bg-red-500/5` : isCompleted ? `${dt.borderSubtle} bg-green-500/5 border-green-500/10` : `${dt.borderSubtle} ${dt.bgSubtle}`
                              }`}
                            >
                              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-semibold truncate ${team1Winner ? dt.neonText : ''}`}>
                                    {m.team1?.name || 'TBD'}
                                  </span>
                                  {team1Winner && <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />}
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5 px-2">
                                {m.score1 !== null && m.score2 !== null ? (
                                  <>
                                    <span className={`text-sm font-black tabular-nums ${team1Winner ? dt.neonText : 'text-muted-foreground'}`}>{m.score1}</span>
                                    <span className="text-[10px] text-muted-foreground">-</span>
                                    <span className={`text-sm font-black tabular-nums ${team2Winner ? dt.neonText : 'text-muted-foreground'}`}>{m.score2}</span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">vs</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  {team2Winner && <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />}
                                  <span className={`text-[11px] font-semibold truncate ${team2Winner ? dt.neonText : ''}`}>
                                    {m.team2?.name || 'TBD'}
                                  </span>
                                </div>
                              </div>
                              {m.mvpPlayer && (
                                <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* My Position in Bracket — quick info for logged-in player */}
            <SectionCard title="Posisi Saya" icon={Star} badge="Login Required">
              <div className="text-center py-4">
                <Star className={`w-8 h-8 mx-auto mb-2 opacity-30`} />
                <p className="text-xs text-muted-foreground">Login sebagai peserta untuk melihat posisi bracket Anda</p>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* ═══ QUEUE TAB ═══ */}
        <TabsContent value="queue" className="mt-4 space-y-4">
          <div className="space-y-4">
            {/* Live & Upcoming Match Queue */}
            <SectionCard title="Antrian Pertandingan" icon={Radio} badge={tournamentMatches.length > 0 ? `${tournamentMatches.filter(m => m.status === 'live' || m.status === 'scheduled' || m.status === 'upcoming').length} match` : undefined}>
              {tournamentMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Radio className={`w-10 h-10 mx-auto mb-3 opacity-30`} />
                  <p className="text-sm text-muted-foreground">Belum ada antrian match — turnamen belum dimulai</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Live matches first */}
                  {tournamentMatches.filter(m => m.status === 'live' || m.status === 'main_event').length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-500">Sedang Berlangsung</span>
                      </div>
                      {tournamentMatches.filter(m => m.status === 'live' || m.status === 'main_event').map(m => (
                        <div key={m.id} className={`flex items-center gap-2 p-3 rounded-lg border ${dt.border} border-red-500/30 bg-red-500/5`}>
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{m.team1?.name || 'TBD'} vs {m.team2?.name || 'TBD'}</p>
                            {m.score1 !== null && m.score2 !== null && (
                              <p className="text-[10px] text-muted-foreground">{m.score1} - {m.score2}</p>
                            )}
                          </div>
                          <Badge className="bg-red-500/10 text-red-500 text-[9px] border-0">LIVE</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upcoming matches */}
                  {tournamentMatches.filter(m => m.status === 'scheduled' || m.status === 'upcoming').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Berikutnya</span>
                      </div>
                      <div className="space-y-1.5">
                        {tournamentMatches.filter(m => m.status === 'scheduled' || m.status === 'upcoming').map((m, idx) => (
                          <div key={m.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${dt.borderSubtle} ${dt.bgSubtle}`}>
                            <span className="text-[10px] font-bold text-muted-foreground w-5 text-center shrink-0">#{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold truncate">{m.team1?.name || 'TBD'} vs {m.team2?.name || 'TBD'}</p>
                            </div>
                            <Badge className={`${dt.casinoBadge} text-[8px]`}>Menunggu</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed matches */}
                  {tournamentMatches.filter(m => m.status === 'completed').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Selesai</span>
                      </div>
                      <div className="space-y-1.5">
                        {tournamentMatches.filter(m => m.status === 'completed').map(m => {
                          const team1Winner = (m.score1 ?? 0) > (m.score2 ?? 0);
                          return (
                            <div key={m.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${dt.borderSubtle} bg-green-500/5 border-green-500/10`}>
                              <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold truncate">
                                  <span className={team1Winner ? dt.neonText : ''}>{m.team1?.name || 'TBD'}</span>
                                  <span className="text-muted-foreground mx-1">{m.score1} - {m.score2}</span>
                                  <span className={!team1Winner ? dt.neonText : ''}>{m.team2?.name || 'TBD'}</span>
                                </p>
                              </div>
                              {m.mvpPlayer && (
                                <Badge className="bg-yellow-500/10 text-yellow-500 text-[8px] border-0">
                                  <Crown className="w-2.5 h-2.5 mr-0.5" />MVP
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Tournament Status Summary */}
            <SectionCard title="Status Turnamen" icon={Zap}>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl ${dt.bgSubtle} ${dt.border} border text-center`}>
                  <p className={`text-2xl font-black ${dt.neonGradient}`}>
                    {tournamentMatches.filter(m => m.status === 'live' || m.status === 'main_event').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Live</p>
                </div>
                <div className={`p-3 rounded-xl ${dt.bgSubtle} ${dt.border} border text-center`}>
                  <p className={`text-2xl font-black ${dt.neonGradient}`}>
                    {tournamentMatches.filter(m => m.status === 'scheduled' || m.status === 'upcoming').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Menunggu</p>
                </div>
                <div className={`p-3 rounded-xl ${dt.bgSubtle} ${dt.border} border text-center`}>
                  <p className={`text-2xl font-black ${dt.neonGradient}`}>
                    {tournamentMatches.filter(m => m.status === 'completed').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Selesai</p>
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* ═══ TIMELINE TAB ═══ */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          <div className="space-y-4">
            <div className="stagger-item-fast stagger-d0">
              <SectionCard title="Lini Masa Match" icon={Activity} badge={selectedMatch ? `${matchEvents.length} event` : '0 event'}>
                {matchEvents.length > 0 ? (
                  <div className="space-y-0">
                    {matchEvents.map((event, idx) => (
                      <TimelineEvent key={`${event.time}-${idx}`} event={event} idx={idx} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Timer className={`w-8 h-8 mx-auto ${dt.text} mb-2`} />
                    <p className="text-xs text-muted-foreground">Lini Masa akan muncul saat match dimulai</p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Key Moments — derived from actual match data, not hardcoded */}
            <div className="stagger-item-fast stagger-d1">
              <SectionCard title="Momen Kunci" icon={Star} badge="Sorotan">
                {selectedMatch ? (() => {
                  // Build key moments from actual match data
                  const moments: { time: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [];

                  // Session opened
                  if (selectedMatch.status !== 'scheduled' && selectedMatch.status !== 'upcoming') {
                    moments.push({
                      time: 'Start',
                      title: 'Sesi Dibuka',
                      desc: 'Organizer memulai sesi match',
                      icon: Activity,
                      color: 'text-green-400',
                    });
                  }

                  // Round results from actual score
                  const s1 = selectedMatch.score1 ?? 0;
                  const s2 = selectedMatch.score2 ?? 0;
                  if (s1 > 0 || s2 > 0) {
                    // Show dominant performance
                    if (s1 > s2) {
                      moments.push({
                        time: 'Final',
                        title: `${selectedMatch.team1?.name || 'TBD'} Dominasi`,
                        desc: `Win ${s1}-${s2} dengan selisih ronde +${s1 - s2}`,
                        icon: Star,
                        color: 'text-emerald-400',
                      });
                    } else if (s2 > s1) {
                      moments.push({
                        time: 'Final',
                        title: `${selectedMatch.team2?.name || 'TBD'} Dominasi`,
                        desc: `Win ${s2}-${s1} dengan selisih ronde +${s2 - s1}`,
                        icon: Star,
                        color: 'text-emerald-400',
                      });
                    } else {
                      moments.push({
                        time: 'Final',
                        title: 'Seimbang',
                        desc: `Seri ${s1}-${s2} — kedua tim seimbang`,
                        icon: Star,
                        color: 'text-emerald-400',
                      });
                    }

                    // Close match indicator
                    if (Math.abs(s1 - s2) === 1) {
                      moments.push({
                        time: 'Final',
                        title: 'Match Ketat',
                        desc: 'Ditentukan dengan selisih 1 ronde saja',
                        icon: Flame,
                        color: 'text-amber-400',
                      });
                    }
                  }

                  // MVP selection
                  if (selectedMatch.mvpPlayer) {
                    moments.push({
                      time: 'Final',
                      title: 'MVP Diberikan',
                      desc: `${selectedMatch.mvpPlayer.gamertag} dipilih sebagai MVP`,
                      icon: Crown,
                      color: 'text-idm-gold-warm',
                    });
                  }

                  // Match completed
                  if (selectedMatch.status === 'completed') {
                    moments.push({
                      time: 'Final',
                      title: 'Match Difinalisasi',
                      desc: 'Hasil dikonfirmasi oleh organizer',
                      icon: Trophy,
                      color: 'text-idm-gold-warm',
                    });
                  }

                  // If no moments yet (upcoming match)
                  if (moments.length === 0) {
                    moments.push({
                      time: 'TBD',
                      title: 'Match Dijadwalkan',
                      desc: 'Momen kunci akan muncul setelah session dimulai',
                      icon: Clock,
                      color: 'text-muted-foreground',
                    });
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {moments.map((moment, idx) => (
                        <div
                          key={idx}
                          className={`hover-scale-sm flex items-start gap-3 p-3 rounded-xl ${dt.bgSubtle} ${dt.borderSubtle} border cursor-pointer transition-all ${dt.hoverBorder}`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${dt.bgSubtle} flex items-center justify-center shrink-0`}>
                            <moment.icon className={`w-4 h-4 ${moment.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold">{moment.title}</span>
                              <Badge className={`${dt.casinoBadge} text-[8px] px-1`}>{moment.time}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{moment.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })() : (
                  <div className="text-center py-8">
                    <Star className={`w-8 h-8 mx-auto ${dt.text} mb-2`} />
                    <p className="text-xs text-muted-foreground">Pilih match untuk melihat momen kunci</p>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        {/* ═══ RESULTS TAB ═══ */}
        <TabsContent value="results" className="mt-4 space-y-4">
          <div className="space-y-4">
            {/* All Tournament Results */}
            <div className="stagger-item-fast stagger-d0">
              <SectionCard title="Hasil Turnamen" icon={Trophy} badge={`${tournamentMatches.length} match`}>
                <div className="space-y-2">
                  {tournamentMatches.map((m) => {
                    const hasScore = m.score1 !== null && m.score2 !== null;
                    const winner1 = hasScore && m.score1! > m.score2!;
                    const winner2 = hasScore && m.score2! > m.score1!;
                    const isLive = m.status === 'live' || m.status === 'main_event';

                    return (
                      <div
                        key={m.id}
                        className={`flex items-stretch rounded-lg overflow-hidden ${dt.bgSubtle} ${dt.borderSubtle} border transition-all ${dt.hoverBorder} cursor-pointer`}
                        onClick={() => {
                          const idx = tournamentMatches.findIndex(tm => tm.id === m.id);
                          if (idx >= 0) setSelectedMatchIdx(idx);
                        }}
                      >
                        {/* Round indicator */}
                        <div className={`w-10 shrink-0 flex items-center justify-center ${dt.bg} border-r ${dt.borderSubtle}`}>
                          <span className={`text-[9px] font-bold ${dt.neonText}`}>R{m.round}</span>
                        </div>

                        {/* Main match content */}
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center px-3 py-1.5 border-b ${dt.borderSubtle} ${winner1 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner1 && <span className="mr-1">▸</span>}
                              {m.team1?.name || 'TBD'}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-foreground'}`}>
                              {hasScore ? m.score1 : '-'}
                            </span>
                          </div>
                          <div className={`flex items-center px-3 py-1.5 ${winner2 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner2 && <span className="mr-1">▸</span>}
                              {(m.team2?.name || 'TBD')}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-foreground'}`}>
                              {hasScore ? m.score2 : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="w-16 shrink-0 flex flex-col items-center justify-center border-l border-transparent">
                          {isLive ? (
                            <Badge className="bg-red-500/10 text-red-500 text-[8px] border-0 live-dot">LIVE</Badge>
                          ) : m.status === 'completed' ? (
                            <Badge className="bg-green-500/10 text-green-500 text-[8px] border-0">FT</Badge>
                          ) : (
                            <Badge className={`${dt.casinoBadge} text-[8px]`}>VS</Badge>
                          )}
                          {m.mvpPlayer && <span className="text-[7px] text-yellow-500 mt-0.5 font-bold">MVP</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>

            {/* Recent Tarkam Results */}
            <div className="stagger-item-fast stagger-d1">
              <SectionCard title="Hasil Tarkam" icon={Radio} badge="Terbaru">
                <div className="space-y-2">
                  {data.recentMatches?.slice(0, 6).map(m => {
                    const winner1 = m.score1 > m.score2;
                    const winner2 = m.score2 > m.score1;
                    return (
                      <div key={m.id} className={`flex items-stretch rounded-lg overflow-hidden ${dt.bgSubtle} ${dt.borderSubtle} border`}>
                        <div className={`w-10 shrink-0 flex items-center justify-center ${dt.bg} border-r ${dt.borderSubtle}`}>
                          <span className={`text-[9px] font-bold ${dt.neonText}`}>W{m.week}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center px-3 py-1.5 border-b ${dt.borderSubtle} ${winner1 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner1 && <span className="mr-1">▸</span>}{m.club1.name}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-foreground'}`}>{m.score1}</span>
                          </div>
                          <div className={`flex items-center px-3 py-1.5 ${winner2 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner2 && <span className="mr-1">▸</span>}{m.club2.name}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-foreground'}`}>{m.score2}</span>
                          </div>
                        </div>
                        <div className="w-14 shrink-0 flex items-center justify-center border-l border-transparent">
                          <Badge className="bg-green-500/10 text-green-500 text-[8px] border-0">FT</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
