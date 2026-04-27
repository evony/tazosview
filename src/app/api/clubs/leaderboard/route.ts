import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Force dynamic — this route is never statically rendered
export const dynamic = 'force-dynamic';

// CDN caching: 10s edge cache, 30s stale-while-revalidate
const LEADERBOARD_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30, max-age=0',
  'Surrogate-Key': 'league-data',
  'Vary': 'Accept-Encoding',
};

interface LeaderboardClub {
  id: string;
  name: string;
  logo: string | null;
  points: number;
  wins: number;
  losses: number;
  gameDiff: number;
  memberCount: number;
  maleMemberCount: number;
  femaleMemberCount: number;
  rank: number;
}

/**
 * GET /api/clubs/leaderboard?type=tarkam|liga
 *
 * NEW SCHEMA: ClubProfile (persistent) + Club (per-season entry)
 *   - ClubProfile has members (ClubMember with profileId)
 *   - Club has season-specific stats (wins/losses/points/gameDiff)
 *
 * Tarkam: Club points = sum of all active member player.points across both divisions.
 *         Club = one entity (profile). Members persist across seasons.
 * Liga:   Club points = from Liga match results (stored Club.wins/losses/points/gameDiff per season).
 *         Club = one entity (profile). Merge male+female season entries.
 *
 * Season selection: prefers season with the most club member data.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'tarkam'; // "tarkam" | "liga"

  try {
    // ===== FETCH ALL ClubProfiles with members =====
    const clubProfiles = await db.clubProfile.findMany({
      include: {
        members: {
          where: { leftAt: null }, // Only active members
          include: {
            player: {
              select: {
                id: true,
                gamertag: true,
                points: true,
                division: true,
              },
            },
          },
        },
        seasonEntries: {
          include: {
            season: {
              select: { id: true, number: true, division: true, status: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (clubProfiles.length === 0) {
      return NextResponse.json({ clubs: [], type }, { headers: LEADERBOARD_CACHE_HEADERS });
    }

    // ===== FIND BEST SEASON FOR LIGA STATS =====
    // For Liga mode, we need the latest season that has club entries
    // Use the same approach: prefer season number with the most data
    const allSeasonNumbers = [...new Set(
      clubProfiles.flatMap(p =>
        p.seasonEntries.map(e => e.season.number)
      )
    )].sort((a, b) => b - a);

    let bestSeasonNumber = allSeasonNumbers[0] || 1;

    // For Liga, find the latest season number that has actual match data
    if (type === 'liga' && allSeasonNumbers.length > 0) {
      // Just use the latest season number for Liga
      bestSeasonNumber = allSeasonNumbers[0];
    }

    // ===== BUILD LEADERBOARD =====
    const leaderboardClubs: LeaderboardClub[] = [];

    for (const profile of clubProfiles) {
      const activeMembers = profile.members;
      const maleMembers = activeMembers.filter(m => m.player.division === 'male');
      const femaleMembers = activeMembers.filter(m => m.player.division === 'female');

      let points: number;
      let totalWins = 0;
      let totalLosses = 0;
      let totalGameDiff = 0;

      if (type === 'tarkam') {
        // Tarkam: Club points = sum of all active member player.points
        points = activeMembers.reduce((sum, m) => sum + m.player.points, 0);
      } else {
        // Liga: Club points = sum of season entry stats for the best season
        // Merge male + female entries for the same season number
        const seasonEntries = profile.seasonEntries.filter(
          e => e.season.number === bestSeasonNumber
        );

        for (const entry of seasonEntries) {
          totalWins += entry.wins;
          totalLosses += entry.losses;
          totalGameDiff += entry.gameDiff;
        }
        points = seasonEntries.reduce((sum, e) => sum + e.points, 0);
      }

      leaderboardClubs.push({
        id: profile.id,
        name: profile.name,
        logo: profile.logo,
        points,
        wins: totalWins,
        losses: totalLosses,
        gameDiff: totalGameDiff,
        memberCount: activeMembers.length,
        maleMemberCount: maleMembers.length,
        femaleMemberCount: femaleMembers.length,
        rank: 0, // will be set after sorting
      });
    }

    // Sort by points desc, then wins desc
    leaderboardClubs.sort((a, b) => b.points - a.points || b.wins - a.wins);

    // Assign ranks
    for (let i = 0; i < leaderboardClubs.length; i++) {
      leaderboardClubs[i].rank = i + 1;
    }

    return NextResponse.json({ clubs: leaderboardClubs, type }, {
      headers: LEADERBOARD_CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ clubs: [], type }, { headers: LEADERBOARD_CACHE_HEADERS });
  }
}
