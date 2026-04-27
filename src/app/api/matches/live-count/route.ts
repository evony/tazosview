import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/matches/live-count
 * Returns live match counts: activeTournaments, completedMatches, upcomingMatches, liveNow
 */
export async function GET() {
  try {
    // Count active (non-completed) tournaments
    const activeTournaments = await db.tournament.count({
      where: {
        status: { in: ['registration', 'approval', 'team_generation', 'bracket_generation', 'main_event', 'finalization'] },
      },
    });

    // Count completed matches (Match model)
    const completedMatches = await db.match.count({
      where: { status: 'completed' },
    });

    // Count upcoming matches (Match model)
    const upcomingMatches = await db.match.count({
      where: { status: { in: ['pending', 'ready'] } },
    });

    // Check if any matches are live right now
    const liveMatchCount = await db.match.count({
      where: { status: 'live' },
    });

    // Also count live league matches
    const liveLeagueCount = await db.leagueMatch.count({
      where: { status: 'live' },
    });

    const liveNow = liveMatchCount > 0 || liveLeagueCount > 0;

    return NextResponse.json({
      activeTournaments,
      completedMatches,
      upcomingMatches,
      liveNow,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30, max-age=0',
        'Surrogate-Key': 'league-data',
      },
    });
  } catch {
    return NextResponse.json({
      activeTournaments: 0,
      completedMatches: 0,
      upcomingMatches: 0,
      liveNow: false,
    });
  }
}
