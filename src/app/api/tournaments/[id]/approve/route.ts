import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

const VALID_TIERS = ['S', 'A', 'B'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { playerId, tier, approve, approvals } = body;

  const tournament = await db.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Cannot modify approvals if tournament is past approval phase
  if (!['setup', 'registration', 'approval'].includes(tournament.status)) {
    return NextResponse.json(
      { error: 'Cannot modify approvals — tournament is past the approval phase' },
      { status: 400 }
    );
  }

  // Support both single and bulk approval
  const items: { playerId: string; tier?: string; approve: boolean }[] = [];
  if (approvals && Array.isArray(approvals)) {
    items.push(...approvals);
  } else if (playerId) {
    items.push({ playerId, tier, approve: approve !== false });
  } else {
    return NextResponse.json(
      { error: 'playerId or approvals array required' },
      { status: 400 }
    );
  }

  const results: { playerId: string; status: string }[] = [];
  const errors: { playerId: string; error: string }[] = [];

  for (const item of items) {
    const participation = await db.participation.findUnique({
      where: { playerId_tournamentId: { playerId: item.playerId, tournamentId: id } },
    });

    if (!participation) {
      errors.push({ playerId: item.playerId, error: 'Player not registered' });
      continue;
    }

    if (item.approve) {
      const tierValue = item.tier;
      if (tierValue && !VALID_TIERS.includes(tierValue)) {
        errors.push({ playerId: item.playerId, error: `Invalid tier: ${tierValue}. Must be S, A, or B` });
        continue;
      }

      await db.participation.update({
        where: { id: participation.id },
        data: {
          status: 'approved',
          ...(tierValue && { tierOverride: tierValue }),
        },
      });
      results.push({ playerId: item.playerId, status: 'approved' });
    } else {
      await db.participation.delete({
        where: { id: participation.id },
      });
      results.push({ playerId: item.playerId, status: 'rejected' });
    }
  }

  // Single approval: return simple response
  if (!approvals && playerId) {
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0].error }, { status: 400 });
    }
    return NextResponse.json({ success: true, status: results[0].status });
  }

  // Bulk approval: return summary
  return NextResponse.json({
    processed: results.length,
    errorCount: errors.length,
    results,
    errors,
  });
}

/**
 * PUT — Unapprove / Rollback approval
 * Reverts approved/assigned/rejected players back to "registered" status
 * so admin can fix tier balance
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { playerId, playerIds, unapproveAll } = body;

  const tournament = await db.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Can only unapprove during approval phase
  if (!['setup', 'registration', 'approval'].includes(tournament.status)) {
    return NextResponse.json(
      { error: 'Cannot unapprove — tournament is past the approval phase' },
      { status: 400 }
    );
  }

  // Determine which players to unapprove
  let targetPlayerIds: string[] = [];

  if (unapproveAll) {
    // Unapprove ALL approved/assigned/rejected players
    const participations = await db.participation.findMany({
      where: {
        tournamentId: id,
        status: { in: ['approved', 'assigned', 'rejected'] },
      },
      select: { playerId: true },
    });
    targetPlayerIds = participations.map(p => p.playerId);
  } else if (playerIds && Array.isArray(playerIds)) {
    targetPlayerIds = playerIds;
  } else if (playerId) {
    targetPlayerIds = [playerId];
  } else {
    return NextResponse.json(
      { error: 'playerId, playerIds, or unapproveAll required' },
      { status: 400 }
    );
  }

  if (targetPlayerIds.length === 0) {
    return NextResponse.json({ unapproved: 0, message: 'No players to unapprove' });
  }

  // Revert status to "registered" and clear tierOverride
  const result = await db.participation.updateMany({
    where: {
      tournamentId: id,
      playerId: { in: targetPlayerIds },
      status: { in: ['approved', 'assigned', 'rejected'] },
    },
    data: {
      status: 'registered',
      tierOverride: null,
    },
  });

  return NextResponse.json({
    unapproved: result.count,
    message: `${result.count} player berhasil dikembalikan ke status terdaftar`,
  });
}
