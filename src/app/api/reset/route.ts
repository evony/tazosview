import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getSafeErrorMessage } from '@/lib/api-error';
import { NextResponse } from 'next/server';

/**
 * POST /api/reset
 * Resets all tournament data, player points, club points, and season data.
 * Keeps: Players, ClubProfiles, ClubMembers, Admins, Accounts, CMS data, Skins, Sponsors
 * Requires super_admin authentication.
 */
export async function POST(request: Request) {
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const results: Record<string, number> = {};

    // 1. Delete all tournament-related data (respect foreign key order)
    results.playerAchievement = await db.playerAchievement.deleteMany();
    results.playerPoint = await db.playerPoint.deleteMany();
    results.sponsoredPrize = await db.sponsoredPrize.deleteMany();
    results.tournamentSponsor = await db.tournamentSponsor.deleteMany();
    results.tournamentPrize = await db.tournamentPrize.deleteMany();
    results.teamPlayer = await db.teamPlayer.deleteMany();
    results.match = await db.match.deleteMany();
    results.team = await db.team.deleteMany();
    results.participation = await db.participation.deleteMany();
    results.tournament = await db.tournament.deleteMany();

    // 2. Delete all league & playoff matches
    results.playoffMatch = await db.playoffMatch.deleteMany();
    results.leagueMatch = await db.leagueMatch.deleteMany();

    // 3. Delete all donations
    results.donation = await db.donation.deleteMany();

    // 4. Reset all player stats to zero
    const playerUpdate = await db.player.updateMany({
      data: {
        points: 0,
        totalWins: 0,
        totalMvp: 0,
        streak: 0,
        maxStreak: 0,
        matches: 0,
        tier: 'B',
      },
    });
    results.playersReset = playerUpdate.count;

    // 5. Reset all club season entries to zero
    const clubUpdate = await db.club.updateMany({
      data: {
        points: 0,
        wins: 0,
        losses: 0,
        gameDiff: 0,
      },
    });
    results.clubsReset = clubUpdate.count;

    // 6. Reset all seasons — remove champion references, set status to active
    const seasonUpdate = await db.season.updateMany({
      data: {
        championClubId: null,
        championPlayerId: null,
        championPlayerPoints: null,
        championSquad: null,
        status: 'active',
      },
    });
    results.seasonsReset = seasonUpdate.count;

    return NextResponse.json({
      success: true,
      message: 'Semua data turnamen berhasil di-reset! Poin pemain, poin club, dan season sudah bersih.',
      details: results,
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Reset error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(e) }, { status: 500 });
  }
}
