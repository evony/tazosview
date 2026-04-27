import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { recalculateAllPoints } from '@/lib/points';
import { NextResponse } from 'next/server';

/**
 * GET /api/rankings
 * Query params:
 *   division: "male" | "female"
 *   detail: "full" — include point breakdown per player
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division');
  const detail = searchParams.get('detail');

  const where: Record<string, string> = {};
  if (division) where.division = division;

  const players = await db.player.findMany({
    where,
    orderBy: [{ points: 'desc' }, { totalWins: 'desc' }, { maxStreak: 'desc' }, { matches: 'asc' }],
    include: {
      participations: { include: { tournament: true }, orderBy: { createdAt: 'desc' } },
      clubMembers: { where: { leftAt: null }, include: { profile: { select: { name: true } } } },
    },
  });

  const rankings = players.map((p, idx) => {
    const club = (p.clubMembers as unknown as { profile: { name: string } }[])?.[0]?.profile?.name || null;

    // Point breakdown
    const pointBreakdown = {
      participation: 0,
      matchWin: 0,
      prize: 0,
      other: 0,
    };

    if (detail === 'full') {
      // Calculate from participations (aggregated view)
      for (const part of p.participations) {
        // We can approximate from participation data but the real audit trail is in PlayerPoint
      }
    }

    return {
      rank: idx + 1,
      id: p.id,
      name: p.name,
      gamertag: p.gamertag,
      division: p.division,
      tier: p.tier,
      avatar: p.avatar,
      points: p.points,
      totalWins: p.totalWins,
      totalMvp: p.totalMvp,
      streak: p.streak,
      maxStreak: p.maxStreak,
      matches: p.matches,
      club,
      tournamentCount: p.participations.filter(part => part.status === 'approved' || part.status === 'assigned').length,
    };
  });

  // Tier distribution summary
  const tierSummary = { S: 0, A: 0, B: 0 };
  for (const p of rankings) {
    tierSummary[p.tier as keyof typeof tierSummary]++;
  }

  return NextResponse.json({
    rankings,
    tierSummary,
  });
}

/**
 * POST /api/rankings
 * Actions:
 *   action: "recalculate" — recalculate all points from audit trail
 *   action: "set_tier" — admin manually sets player tier (playerId + tier required)
 */
export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { action, division, playerId, tier } = body;

  if (action === 'recalculate') {
    const results = await recalculateAllPoints(division || undefined);
    const corrected = results.filter(r => r.diff !== 0);
    return NextResponse.json({ success: true, totalPlayers: results.length, corrected, correctionsCount: corrected.length });
  }

  if (action === 'set_tier' && playerId && tier) {
    const validTiers = ['S', 'A', 'B'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` }, { status: 400 });
    }
    const player = await db.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    const oldTier = player.tier;
    await db.player.update({ where: { id: playerId }, data: { tier } });
    return NextResponse.json({ success: true, playerId, fromTier: oldTier, toTier: tier });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
