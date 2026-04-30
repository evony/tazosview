'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { Crown, Music, Trophy, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/* ─── Match interface ─── */
interface Match {
  id: string;
  score1: number | null;
  score2: number | null;
  status: string;
  team1: { id: string; name: string } | null;
  team2: { id: string; name: string } | null;
  mvpPlayer: { id: string; name: string; gamertag: string } | null;
  round?: number;
  bracket?: string;
  groupLabel?: string;
}

interface BracketViewProps {
  matches: Match[];
  bracketType: 'single_elimination' | 'double_elimination' | 'group_stage' | 'round_robin';
}

/* ─── Round labels ─── */
function getRoundLabel(roundIdx: number, totalRounds: number): string {
  if (totalRounds <= 2) {
    return roundIdx === 0 ? 'Semi Final' : 'Final';
  }
  const fromEnd = totalRounds - 1 - roundIdx;
  if (fromEnd === 0) return 'Grand Final';
  if (fromEnd === 1) return 'Semi Final';
  if (fromEnd === 2) return 'Quarter Final';
  return `Ronde ${roundIdx + 1}`;
}

/* ─── Single bracket match card — MPL style ─── */
function BracketMatchCard({ match }: { match: Match }) {
  const dt = useDivisionTheme();
  const hasScore = match.score1 !== null && match.score2 !== null;
  const winner1 = hasScore && match.score1! > match.score2!;
  const winner2 = hasScore && match.score2! > match.score1!;
  const isLive = match.status === 'live' || match.status === 'main_event';
  const isCompleted = match.status === 'completed' || match.status === 'scoring';
  const isByeMatch = (!match.team1 || !match.team2) && !isCompleted;

  // Helper to get team display name: BYE for null teams in pending/ready, TBD otherwise
  const getTeamLabel = (team: { id: string; name: string } | null) => {
    if (team) return team.name;
    if (match.status === 'pending' || match.status === 'ready') return 'BYE';
    return 'TBD';
  };

  // Helper to get team score display
  const getTeamScore = (team: { id: string; name: string } | null, score: number | null) => {
    if (!team && (match.status === 'pending' || match.status === 'ready')) return '';
    if (hasScore) return score;
    return '-';
  };

  return (
    <div
      className={`bracket-match-card rounded-lg overflow-hidden ${
        isLive ? `border-2 border-red-500/60 ${dt.neonPulse}` :
        isCompleted ? `border ${dt.border}` :
        `border ${dt.borderSubtle}`
      } transition-all hover:shadow-lg relative`}
      style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
    >
      {/* BYE badge */}
      {isByeMatch && (
        <div className="absolute top-0.5 right-1 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded z-10">
          BYE
        </div>
      )}
      {/* Team 1 */}
      <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''} ${!match.team1 && isByeMatch ? 'opacity-40' : ''}`}>
        <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold mr-2 shrink-0 ${
          winner1 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
          `${dt.iconBg} ${dt.text}`
        }`}>
          {getTeamLabel(match.team1).slice(0, 2).toUpperCase()}
        </div>
        <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : !match.team1 && isByeMatch ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
          {getTeamLabel(match.team1)}
        </span>
        <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
          {getTeamScore(match.team1, match.score1)}
        </span>
      </div>
      {/* Team 2 */}
      <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''} ${!match.team2 && isByeMatch ? 'opacity-40' : ''}`}>
        <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold mr-2 shrink-0 ${
          winner2 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
          `${dt.iconBg} ${dt.text}`
        }`}>
          {getTeamLabel(match.team2).slice(0, 2).toUpperCase()}
        </div>
        <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : !match.team2 && isByeMatch ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
          {getTeamLabel(match.team2)}
        </span>
        <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
          {getTeamScore(match.team2, match.score2)}
        </span>
      </div>
      {/* MVP indicator */}
      {match.mvpPlayer && (
        <div className={`flex items-center gap-1 px-3 py-1 border-t ${dt.borderSubtle}`}>
          <Crown className="w-2.5 h-2.5 text-yellow-500" />
          <span className="text-[9px] text-yellow-500 font-medium truncate">MVP: {match.mvpPlayer.gamertag}</span>
        </div>
      )}
    </div>
  );
}

/* ─── SVG Connector Lines Component — MPL Style ─── */
interface ConnectorPath {
  key: string;
  d: string;
  color: string;
  isWinner?: boolean;
}

function BracketConnectors({ paths }: { paths: ConnectorPath[] }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      {paths.map((p) => {
        const isDot = p.key.endsWith('-dot');
        const isRail = p.key.endsWith('-rail');
        const isArm = p.key.endsWith('-arm1') || p.key.endsWith('-arm2');

        if (isDot) {
          // Junction dot — small filled circle
          const match = p.d.match(/M ([\d.]+) ([\d.]+) h ([\d.]+)/);
          if (match) {
            const cx = parseFloat(match[1]) + parseFloat(match[3]) / 2;
            const cy = parseFloat(match[2]);
            return (
              <circle
                key={p.key}
                cx={cx}
                cy={cy}
                r="3"
                fill={p.color}
                opacity="0.6"
              />
            );
          }
        }

        return (
          <g key={p.key}>
            {/* Glow layer — thicker, faded */}
            <path
              d={p.d}
              stroke={p.color}
              strokeWidth={isArm ? "4" : isRail ? "4" : "4"}
              fill="none"
              opacity="0.12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main line */}
            <path
              d={p.d}
              stroke={p.color}
              strokeWidth={isArm ? "1.5" : isRail ? "1.5" : "1.5"}
              fill="none"
              opacity={p.isWinner ? "0.6" : "0.35"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Zoomable Container — Touch pinch-zoom + drag-pan for mobile ─── */
function ZoomableContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Use refs for transform state to avoid re-renders during active gestures
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const [displayState, setDisplayState] = useState({ scale: 1, tx: 0, ty: 0, isAnimating: false });
  const [isInteracting, setIsInteracting] = useState(false);
  const [isMouseDragging, setIsMouseDragging] = useState(false);

  const isDragging = useRef(false);
  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const mouseDragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const rafId = useRef<number>(0);

  // Double-tap detection
  const lastTapTime = useRef(0);
  const lastTapPos = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  /* Flush transform from refs to the DOM via rAF */
  const flushTransform = useCallback((animate = false) => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setDisplayState({
        scale: scaleRef.current,
        tx: translateRef.current.x,
        ty: translateRef.current.y,
        isAnimating: animate,
      });
    });
  }, []);

  const handleZoom = useCallback((newScale: number) => {
    scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    flushTransform(true);
  }, [flushTransform]);

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    flushTransform(true);
    setIsInteracting(false);
  }, [flushTransform]);

  /* Double-tap to reset zoom */
  const handleDoubleTap = useCallback((x: number, y: number) => {
    const now = Date.now();
    const dt = now - lastTapTime.current;
    const dx = x - lastTapPos.current.x;
    const dy = y - lastTapPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dt < 300 && dist < 30) {
      // Double-tap detected — reset zoom
      resetZoom();
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
      lastTapPos.current = { x, y };
    }
  }, [resetZoom]);

  /* Touch: pinch-to-zoom + drag-to-pan */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      isDragging.current = false;
      setIsInteracting(true);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      // Check for double-tap
      handleDoubleTap(touch.clientX, touch.clientY);

      if (scaleRef.current > 1) {
        // Pan start (only when zoomed in)
        isDragging.current = true;
        dragStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          tx: translateRef.current.x,
          ty: translateRef.current.y,
        };
      }
    }
  }, [handleDoubleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastTouchDist.current > 0) {
        const delta = dist / lastTouchDist.current;
        scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * delta));
      }
      lastTouchDist.current = dist;

      // Pan while pinching
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      translateRef.current = {
        x: translateRef.current.x + (center.x - lastTouchCenter.current.x),
        y: translateRef.current.y + (center.y - lastTouchCenter.current.y),
      };
      lastTouchCenter.current = center;
      flushTransform(false);
    } else if (e.touches.length === 1 && isDragging.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      translateRef.current = {
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      };
      flushTransform(false);
    }
  }, [flushTransform]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = 0;
    isDragging.current = false;
    if (scaleRef.current <= 1) {
      setIsInteracting(false);
    }
  }, []);

  /* Mouse drag-to-pan for desktop (when zoomed in) */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scaleRef.current > 1 && e.button === 0) {
      e.preventDefault();
      mouseDragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: translateRef.current.x,
        ty: translateRef.current.y,
      };
      setIsInteracting(true);
      setIsMouseDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mouseDragStart.current) {
      const dx = e.clientX - mouseDragStart.current.x;
      const dy = e.clientY - mouseDragStart.current.y;
      translateRef.current = {
        x: mouseDragStart.current.tx + dx,
        y: mouseDragStart.current.ty + dy,
      };
      flushTransform(false);
    }
  }, [flushTransform]);

  const handleMouseUp = useCallback(() => {
    mouseDragStart.current = null;
    setIsMouseDragging(false);
    if (scaleRef.current <= 1) {
      setIsInteracting(false);
    }
  }, []);

  /* Wheel zoom for desktop trackpad */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * delta));
      flushTransform(true);
    }
  }, [flushTransform]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const cursorStyle = displayState.scale > 1
    ? (isMouseDragging ? 'grabbing' : 'grab')
    : 'default';

  return (
    <div className="relative">
      {/* Zoom controls — mobile only, positioned top area */}
      <div className="lg:hidden flex items-center gap-1.5 mb-2 px-1">
        <button
          onClick={() => handleZoom(displayState.scale - 0.25)}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-background/90 hover:bg-muted border border-border/60 shadow-sm transition-colors active:scale-95"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-foreground" />
        </button>
        <div className="px-2.5 py-1 rounded-md bg-background/90 border border-border/60 text-[10px] font-semibold tabular-nums min-w-[3.2rem] text-center shadow-sm">
          {Math.round(displayState.scale * 100)}%
        </div>
        <button
          onClick={() => handleZoom(displayState.scale + 0.25)}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-background/90 hover:bg-muted border border-border/60 shadow-sm transition-colors active:scale-95"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={resetZoom}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-background/90 hover:bg-muted border border-border/60 shadow-sm transition-colors active:scale-95"
          aria-label="Reset zoom"
        >
          <Maximize2 className="w-3.5 h-3.5 text-foreground" />
        </button>
        <span className="text-[9px] text-muted-foreground ml-2">Pinch to zoom • Drag to pan</span>
      </div>

      {/* Desktop zoom hint — shown when zoomed in */}
      {displayState.scale > 1 && (
        <div className="hidden lg:flex items-center gap-1.5 mb-2 px-1">
          <div className="px-2.5 py-1 rounded-md bg-background/90 border border-border/60 text-[10px] font-semibold tabular-nums min-w-[3.2rem] text-center shadow-sm">
            {Math.round(displayState.scale * 100)}%
          </div>
          <button
            onClick={resetZoom}
            className="flex items-center justify-center h-7 px-2 rounded-md bg-background/90 hover:bg-muted border border-border/60 text-[10px] font-medium shadow-sm transition-colors"
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-3 h-3 text-foreground mr-1" />
            Reset
          </button>
          <span className="text-[9px] text-muted-foreground ml-1">Ctrl+Scroll to zoom • Drag to pan</span>
        </div>
      )}

      {/* Scrollable/pannable container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg relative touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: cursorStyle }}
      >
        <div
          ref={contentRef}
          className="origin-top-left"
          style={{
            transform: `translate(${displayState.tx}px, ${displayState.ty}px) scale(${displayState.scale})`,
            transformOrigin: '0 0',
            willChange: isInteracting ? 'transform' : 'auto',
            transition: displayState.isAnimating && !isInteracting ? 'transform 200ms ease-out' : 'none',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Group Stage Table ─── */
function GroupStageView({ matches, roundsData }: { matches: Match[]; roundsData: { round: number; label: string; matches: Match[] }[] }) {
  const dt = useDivisionTheme();

  // Separate group matches from playoff matches
  const groupMatches = useMemo(() => matches.filter(m => (m as Match & { bracket?: string }).bracket === 'group'), [matches]);
  const playoffMatches = useMemo(() => matches.filter(m => (m as Match & { bracket?: string }).bracket !== 'group'), [matches]);

  // Group group-matches by groupLabel
  const groupsByLabel = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    groupMatches.forEach(m => {
      const label = (m as Match & { groupLabel?: string }).groupLabel || 'A';
      if (!groups[label]) groups[label] = [];
      groups[label].push(m);
    });
    return groups;
  }, [groupMatches]);

  // Build standings per group
  const standingsByGroup = useMemo(() => {
    const result: Record<string, { name: string; wins: number; draws: number; losses: number; points: number; gamesWon: number; gamesLost: number }[]> = {};
    for (const [label, gMatches] of Object.entries(groupsByLabel)) {
      const teams = new Map<string, { name: string; wins: number; draws: number; losses: number; points: number; gamesWon: number; gamesLost: number }>();
      gMatches.forEach(m => {
        const hasScore = m.score1 !== null && m.score2 !== null;
        if (!teams.has((m.team1?.name || 'TBD'))) teams.set((m.team1?.name || 'TBD'), { name: (m.team1?.name || 'TBD'), wins: 0, draws: 0, losses: 0, points: 0, gamesWon: 0, gamesLost: 0 });
        if (!teams.has((m.team2?.name || 'TBD'))) teams.set((m.team2?.name || 'TBD'), { name: (m.team2?.name || 'TBD'), wins: 0, draws: 0, losses: 0, points: 0, gamesWon: 0, gamesLost: 0 });
        if (hasScore) {
          const t1 = teams.get((m.team1?.name || 'TBD'))!;
          const t2 = teams.get((m.team2?.name || 'TBD'))!;
          t1.gamesWon += m.score1!; t1.gamesLost += m.score2!;
          t2.gamesWon += m.score2!; t2.gamesLost += m.score1!;
          if (m.score1! > m.score2!) { t1.wins++; t1.points += 3; t2.losses++; }
          else if (m.score2! > m.score1!) { t2.wins++; t2.points += 3; t1.losses++; }
          else { t1.draws++; t2.draws++; t1.points++; t2.points++; }
        }
      });
      result[label] = Array.from(teams.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);
    }
    return result;
  }, [groupsByLabel]);

  return (
    <div className="space-y-5">
      {/* Group Standings Tables */}
      {Object.entries(standingsByGroup).map(([label, teamStats]) => (
        <div key={label} className={`rounded-xl overflow-hidden border ${dt.border}`}>
          <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${dt.borderSubtle}`}>
            <Trophy className={`w-4 h-4 ${dt.neonText}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Grup {label}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${dt.borderSubtle} bg-muted/20`}>
                  <th className="w-8 text-center py-2 font-semibold">#</th>
                  <th className="text-left py-2 px-3 font-semibold">Tim</th>
                  <th className="w-10 text-center py-2 font-semibold">W</th>
                  <th className="w-10 text-center py-2 font-semibold">D</th>
                  <th className="w-10 text-center py-2 font-semibold">L</th>
                  <th className="w-14 text-center py-2 font-semibold">GW</th>
                  <th className="w-14 text-center py-2 font-semibold">GL</th>
                  <th className="w-12 text-center py-2 font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {teamStats.map((t, i) => (
                  <tr key={t.name} className={`border-b ${dt.borderSubtle} ${i < 2 ? dt.bgSubtle : ''} ${dt.hoverBgSubtle} transition-colors`}>
                    <td className="text-center py-2">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        i === 1 ? 'bg-green-500/20 text-green-500' :
                        'text-muted-foreground'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold ${
                          i < 2 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
                          `${dt.iconBg} ${dt.text}`
                        }`}>{t.name.slice(0, 2).toUpperCase()}</div>
                        <span className={`font-semibold truncate ${i < 2 ? dt.neonText : ''}`}>{t.name}</span>
                      </div>
                    </td>
                    <td className="text-center font-semibold text-green-500">{t.wins}</td>
                    <td className="text-center font-semibold text-yellow-500">{t.draws}</td>
                    <td className="text-center font-semibold text-red-500">{t.losses}</td>
                    <td className="text-center text-muted-foreground">{t.gamesWon}</td>
                    <td className="text-center text-muted-foreground">{t.gamesLost}</td>
                    <td className="text-center font-bold">{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Group Stage Match Schedule */}
      {Object.entries(groupsByLabel).map(([label, gMatches]) => (
        <div key={`matches-${label}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`px-3 py-1.5 rounded-lg ${dt.bg} ${dt.text} text-[10px] font-bold uppercase tracking-wider`}>
              Grup {label}
            </div>
            <div className={`flex-1 h-px ${dt.borderSubtle}`} />
            <span className="text-[10px] text-muted-foreground">{gMatches.length} pertandingan</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {gMatches.map((m) => {
              const hasScore = m.score1 !== null && m.score2 !== null;
              const winner1 = hasScore && m.score1! > m.score2!;
              const winner2 = hasScore && m.score2! > m.score1!;
              const isDraw = hasScore && m.score1 === m.score2;
              const isLive = m.status === 'live' || m.status === 'main_event';
              return (
                <div
                  key={m.id}
                  className={`hover-scale-sm rounded-lg overflow-hidden border ${isLive ? `border-red-500/30 ${dt.neonPulse}` : dt.borderSubtle} transition-all ${dt.hoverBorder} relative`}
                  style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
                >
                  {(!m.team1 || !m.team2) && m.status !== 'completed' && (
                    <div className="absolute top-0.5 right-1 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded z-10">
                      BYE
                    </div>
                  )}
                  <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''} ${!m.team1 && m.status !== 'completed' ? 'opacity-40' : ''}`}>
                    <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : !m.team1 && m.status !== 'completed' ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                      {m.team1?.name || (m.status === 'pending' || m.status === 'ready' ? 'BYE' : 'TBD')}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : isDraw ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {m.team1 ? (hasScore ? m.score1 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score1 : '-'))}
                    </span>
                  </div>
                  <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''} ${!m.team2 && m.status !== 'completed' ? 'opacity-40' : ''}`}>
                    <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : !m.team2 && m.status !== 'completed' ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                      {m.team2?.name || (m.status === 'pending' || m.status === 'ready' ? 'BYE' : 'TBD')}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : isDraw ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {m.team2 ? (hasScore ? m.score2 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score2 : '-'))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Playoff Matches */}
      {playoffMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`px-3 py-1.5 rounded-lg bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] font-bold uppercase tracking-wider`}>
              🏆 Playoff
            </div>
            <div className={`flex-1 h-px ${dt.borderSubtle}`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playoffMatches.sort((a, b) => (a.round ?? 0) - (b.round ?? 0)).map((m) => {
              const mExt = m as Match & { groupLabel?: string; bracket?: string };
              const hasScore = m.score1 !== null && m.score2 !== null;
              const winner1 = hasScore && m.score1! > m.score2!;
              const winner2 = hasScore && m.score2! > m.score1!;
              const isLive = m.status === 'live' || m.status === 'main_event';
              const label = mExt.groupLabel || (mExt.bracket === 'lower' ? '3rd Place' : `R${m.round}`);
              const matchLabel = label === 'SF1' ? 'Semi Final 1' : label === 'SF2' ? 'Semi Final 2' : label === 'Final' ? 'Grand Final' : label === '3rd' ? '3rd Place' : label;
              const isByeMatch = (!m.team1 || !m.team2) && m.status !== 'completed';
              return (
                <div
                  key={m.id}
                  className={`hover-scale-sm rounded-lg overflow-hidden border ${isLive ? `border-red-500/30 ${dt.neonPulse}` : 'border-idm-gold-warm/20'} transition-all relative`}
                  style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
                >
                  <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${dt.neonText} bg-idm-gold-warm/5 flex items-center justify-between`}>
                    <span>{matchLabel}</span>
                    {isByeMatch && (
                      <span className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">BYE</span>
                    )}
                  </div>
                  <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''} ${!m.team1 && isByeMatch ? 'opacity-40' : ''}`}>
                    <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : !m.team1 && isByeMatch ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                      {m.team1?.name || (m.status === 'pending' || m.status === 'ready' ? 'BYE' : 'TBD')}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                      {m.team1 ? (hasScore ? m.score1 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score1 : '-'))}
                    </span>
                  </div>
                  <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''} ${!m.team2 && isByeMatch ? 'opacity-40' : ''}`}>
                    <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : !m.team2 && isByeMatch ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                      {m.team2?.name || (m.status === 'pending' || m.status === 'ready' ? 'BYE' : 'TBD')}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                      {m.team2 ? (hasScore ? m.score2 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score2 : '-'))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main BracketView Component ─── */
export function BracketView({ matches, bracketType }: BracketViewProps) {
  const dt = useDivisionTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectors, setConnectors] = useState<ConnectorPath[]>([]);
  const [activeType, setActiveType] = useState(bracketType);

  /* Group matches by round — auto-split if all in one round */
  const roundsData = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    const grouped = matches.reduce<Record<number, Match[]>>((acc, m) => {
      const round = m.round ?? 1;
      if (!acc[round]) acc[round] = [];
      acc[round].push(m);
      return acc;
    }, {});

    // If all matches are in a single round, auto-split into bracket rounds
    if (Object.keys(grouped).length === 1 && bracketType !== 'group_stage' && bracketType !== 'round_robin') {
      const allMatches = Object.values(grouped)[0];
      const totalMatches = allMatches.length;

      const rounds: { round: number; label: string; matches: Match[] }[] = [];
      let remaining = [...allMatches];
      let roundNum = 1;
      let matchesInRound = Math.pow(2, Math.floor(Math.log2(totalMatches)));

      if (matchesInRound < totalMatches) {
        matchesInRound = totalMatches - matchesInRound / 2;
      }

      while (remaining.length > 0) {
        const roundMatches = remaining.splice(0, Math.max(1, matchesInRound));
        rounds.push({
          round: roundNum,
          label: getRoundLabel(roundNum - 1, Math.ceil(Math.log2(totalMatches + 1))),
          matches: roundMatches.map((m) => ({ ...m, round: roundNum })),
        });
        matchesInRound = Math.max(1, Math.floor(matchesInRound / 2));
        roundNum++;
      }

      return rounds;
    }

    const sortedRounds = Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, roundMatches], idx) => ({
        round: idx + 1,
        label: getRoundLabel(idx, Object.keys(grouped).length),
        matches: roundMatches,
      }));

    return sortedRounds;
  }, [matches, bracketType]);

  /* Calculate SVG connector paths after layout — Clean MPL Style
     Bracket connector pattern:
     [Feeder 1] ──────┐
                        ├────── [Next Match]
     [Feeder 2] ──────┘
     Segments: 1) Horizontal arms  2) Vertical rail  3) Horizontal to next  4) Junction dot
  */
  const calculateConnectors = useCallback(() => {
    if (!containerRef.current || roundsData.length < 2) {
      setConnectors([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const newConnectors: ConnectorPath[] = [];
    const strokeColor = dt.color;

    for (let r = 0; r < roundsData.length - 1; r++) {
      const currentRound = roundsData[r];
      const nextRound = roundsData[r + 1];

      for (let ni = 0; ni < nextRound.matches.length; ni++) {
        const nextMatch = nextRound.matches[ni];
        const nextCardEl = cardRefs.current.get(`round-${r + 1}-match-${nextMatch.id}`);
        if (!nextCardEl) continue;

        const nextRect = nextCardEl.getBoundingClientRect();
        const nextY = nextRect.top + nextRect.height / 2 - containerRect.top;
        const nextX = nextRect.left - containerRect.left;

        // Find the two feeder matches from the current round
        const feederIdx1 = ni * 2;
        const feederIdx2 = ni * 2 + 1;
        const feederMatch1 = currentRound.matches[feederIdx1];
        const feederMatch2 = currentRound.matches[feederIdx2];

        if (!feederMatch1 && !feederMatch2) continue;

        const feederEl1 = feederMatch1 ? cardRefs.current.get(`round-${r}-match-${feederMatch1.id}`) : null;
        const feederEl2 = feederMatch2 ? cardRefs.current.get(`round-${r}-match-${feederMatch2.id}`) : null;

        if (!feederEl1 && !feederEl2) continue;

        const getCenter = (el: HTMLDivElement | null | undefined) => {
          if (!el) return { x: nextX, y: nextY };
          const rect = el.getBoundingClientRect();
          return {
            x: rect.right - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top,
          };
        };

        const p1 = getCenter(feederEl1);
        const p2 = getCenter(feederEl2);

        // Midpoint X between feeder and next match (the vertical rail position)
        const midX = nextX - (nextX - Math.max(p1.x, p2.x)) / 2;

        // Check if feeder match has a winner (for highlighting)
        const f1HasWinner = feederMatch1 && feederMatch1.score1 !== null && feederMatch1.score2 !== null &&
          feederMatch1.score1 !== feederMatch1.score2;
        const f2HasWinner = feederMatch2 && feederMatch2.score1 !== null && feederMatch2.score2 !== null &&
          feederMatch2.score1 !== feederMatch2.score2;

        // ── Segment 1: Horizontal arm from Feeder 1 to midX ──
        if (feederEl1) {
          newConnectors.push({
            key: `conn-${r}-${ni}-arm1`,
            d: `M ${p1.x} ${p1.y} H ${midX}`,
            color: strokeColor,
            isWinner: f1HasWinner,
          });
        }

        // ── Segment 2: Horizontal arm from Feeder 2 to midX ──
        if (feederEl2) {
          newConnectors.push({
            key: `conn-${r}-${ni}-arm2`,
            d: `M ${p2.x} ${p2.y} H ${midX}`,
            color: strokeColor,
            isWinner: f2HasWinner,
          });
        }

        // ── Segment 3: Vertical rail at midX connecting both feeders ──
        if (feederEl1 && feederEl2) {
          const topY = Math.min(p1.y, p2.y);
          const bottomY = Math.max(p1.y, p2.y);
          newConnectors.push({
            key: `conn-${r}-${ni}-rail`,
            d: `M ${midX} ${topY} V ${bottomY}`,
            color: strokeColor,
            isWinner: f1HasWinner || f2HasWinner,
          });
        } else if (feederEl1 && !feederEl2) {
          // Single feeder — vertical rail from feeder to nextY level
          newConnectors.push({
            key: `conn-${r}-${ni}-rail`,
            d: `M ${midX} ${p1.y} V ${nextY}`,
            color: strokeColor,
            isWinner: f1HasWinner,
          });
        } else if (feederEl2 && !feederEl1) {
          newConnectors.push({
            key: `conn-${r}-${ni}-rail`,
            d: `M ${midX} ${p2.y} V ${nextY}`,
            color: strokeColor,
            isWinner: f2HasWinner,
          });
        }

        // ── Segment 4: Horizontal from midX at nextY to next match ──
        newConnectors.push({
          key: `conn-${r}-${ni}-bridge`,
          d: `M ${midX} ${nextY} H ${nextX}`,
          color: strokeColor,
          isWinner: f1HasWinner || f2HasWinner,
        });

        // ── Segment 5: Junction dot at merge point ──
        newConnectors.push({
          key: `conn-${r}-${ni}-dot`,
          d: `M ${midX - 3} ${nextY} h 6`,
          color: strokeColor,
          isWinner: true,
        });
      }
    }

    setConnectors(newConnectors);
  }, [roundsData, dt.color]);

  useEffect(() => {
    // Multiple attempts to recalculate after layout settles
    const attempts = [50, 200, 500, 1000];
    const timers = attempts.map(delay => setTimeout(calculateConnectors, delay));
    const handleResize = () => calculateConnectors();

    // Also recalculate when the scrollable container is scrolled
    // (cards shift position relative to viewport, need to update SVG)
    const scrollContainer = containerRef.current?.parentElement;
    const handleScroll = () => calculateConnectors();

    window.addEventListener('resize', handleResize);
    scrollContainer?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  }, [calculateConnectors]);

  /* Set card ref helper */
  const setCardRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(key, el);
    } else {
      cardRefs.current.delete(key);
    }
  }, []);

  /* ─── Render: Group Stage ─── */
  if (bracketType === 'group_stage') {
    return (
      <div>
        <GroupStageView matches={matches} roundsData={roundsData} />
      </div>
    );
  }

  /* ─── Render: Round Robin ─── */
  if (bracketType === 'round_robin') {
    return (
      <div className="space-y-5">
        <GroupStageView matches={matches} roundsData={roundsData} />
      </div>
    );
  }

  /* ─── Bracket content (shared for single/double elimination) ─── */
  const bracketContent = (
    <div className="overflow-x-auto custom-scrollbar pb-2 -mx-1">
      <div className="relative min-w-max px-1" ref={containerRef}>
        {/* SVG connector overlay — inside scrollable area so lines move with cards */}
        {connectors.length > 0 && <BracketConnectors paths={connectors} />}

        {/* Bracket columns — MPL horizontal layout */}
        <div className="flex gap-10">
          {roundsData.map((round, roundIdx) => {
            // Calculate vertical spacing for proper bracket alignment
            const gapMultiplier = Math.pow(2, roundIdx);

            return (
              <div key={round.round} className="flex flex-col" style={{ minWidth: '200px' }}>
                {/* Round label — MPL pill style */}
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${dt.bg} ${dt.text} text-[10px] font-bold uppercase tracking-wider`}>
                    {roundIdx === roundsData.length - 1 && <span>🏆</span>}
                    {round.label}
                  </div>
                </div>
                {/* Match cards with proper spacing */}
                <div className="flex-1 flex flex-col justify-around" style={{ gap: `${gapMultiplier * 24 + 16}px` }}>
                  {round.matches.map((m) => (
                    <div
                      key={m.id}
                      ref={(el) => setCardRef(`round-${roundIdx}-match-${m.id}`, el)}
                    >
                      <BracketMatchCard match={m} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ─── Render: Single/Double Elimination Bracket with Zoom ─── */
  return (
    <div>
      <ZoomableContainer>
        {bracketContent}
      </ZoomableContainer>

      {/* Double Elimination: Elimination Bracket */}
      {activeType === 'double_elimination' && roundsData.length > 1 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className={`px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider`}>
              Elimination Bracket
            </div>
            <div className={`flex-1 h-px ${dt.borderSubtle}`} />
          </div>
          <div className={`p-4 rounded-xl border ${dt.borderSubtle} ${dt.bgSubtle}`}>
            <p className="text-xs text-muted-foreground text-center">
              Pertandingan bracket kalahan akan muncul di sini saat tim tereliminasi dari bracket pemenang.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
