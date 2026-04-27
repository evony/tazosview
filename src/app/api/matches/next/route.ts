import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/matches/next?division=male
 * Returns live match count, next upcoming match, and recent results (last 5)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'male';

    // Run all queries in parallel
    const [
      liveMatchCount,
      liveLeagueCount,
      nextUpcomingMatch,
      recentCompletedMatches,
      recentCompletedLeagueMatches,
    ] = await Promise.all([
      // Count live tournament bracket matches
      db.match.count({
        where: { status: 'live' },
      }),

      // Count live league matches for this division
      db.leagueMatch.count({
        where: {
          status: 'live',
          season: { division },
        },
      }),

      // Next upcoming tournament match (earliest scheduledAt that's in the future)
      db.match.findFirst({
        where: {
          status: { in: ['pending', 'ready'] },
          scheduledAt: { gte: new Date() },
          tournament: { division },
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          team1: { select: { name: true } },
          team2: { select: { name: true } },
          tournament: { select: { name: true } },
        },
      }),

      // Recent 5 completed tournament bracket matches
      db.match.findMany({
        where: {
          status: 'completed',
          tournament: { division },
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: {
          team1: { select: { name: true } },
          team2: { select: { name: true } },
          tournament: { select: { name: true } },
        },
      }),

      // Recent 5 completed league matches for this division
      db.leagueMatch.findMany({
        where: {
          status: 'completed',
          season: { division },
        },
        orderBy: { week: 'desc' },
        take: 5,
        include: {
          club1: { include: { profile: { select: { name: true } } } },
          club2: { include: { profile: { select: { name: true } } } },
        },
      }),
    ]);

    const liveCount = liveMatchCount + liveLeagueCount;

    // Format next upcoming match
    const nextMatch = nextUpcomingMatch
      ? {
          id: nextUpcomingMatch.id,
          player1: nextUpcomingMatch.team1?.name || 'TBD',
          player2: nextUpcomingMatch.team2?.name || 'TBD',
          scheduledAt: nextUpcomingMatch.scheduledAt?.toISOString() || null,
          tournamentName: nextUpcomingMatch.tournament?.name || '',
        }
      : null;

    // Format recent results from both bracket matches and league matches
    const recentResults: Array<{
      id: string;
      player1: string;
      player2: string;
      score: string;
      winnerId: string | null;
      completedAt: string;
    }> = [];

    for (const m of recentCompletedMatches) {
      const s1 = m.score1 ?? 0;
      const s2 = m.score2 ?? 0;
      recentResults.push({
        id: m.id,
        player1: m.team1?.name || 'TBD',
        player2: m.team2?.name || 'TBD',
        score: `${s1}-${s2}`,
        winnerId: m.winnerId,
        completedAt: m.completedAt?.toISOString() || m.createdAt.toISOString(),
      });
    }

    for (const m of recentCompletedLeagueMatches) {
      const s1 = m.score1 ?? 0;
      const s2 = m.score2 ?? 0;
      const winnerId =
        s1 > s2 ? m.club1Id : s2 > s1 ? m.club2Id : null;
      recentResults.push({
        id: m.id,
        player1: (m.club1 as any)?.profile?.name || 'TBD',
        player2: (m.club2 as any)?.profile?.name || 'TBD',
        score: `${s1}-${s2}`,
        winnerId,
        completedAt: new Date().toISOString(), // LeagueMatch doesn't have completedAt
      });
    }

    // Sort by completedAt desc and take top 5
    recentResults.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    const limitedResults = recentResults.slice(0, 5);

    return NextResponse.json(
      { liveCount, nextMatch, recentResults: limitedResults },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch {
    return NextResponse.json({
      liveCount: 0,
      nextMatch: null,
      recentResults: [],
    });
  }
}
