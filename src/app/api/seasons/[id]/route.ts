import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const season = await db.season.findUnique({
    where: { id },
    include: {
      tournaments: { orderBy: { weekNumber: 'asc' } },
      clubs: {
        orderBy: { points: 'desc' },
        include: {
          profile: { select: { id: true, name: true, logo: true } },
          _count: { select: { homeMatches: true, awayMatches: true } },
        },
      },
      donations: { orderBy: { createdAt: 'desc' } },
      championClub: { select: { id: true, name: true, logo: true } },
      championPlayer: { select: { id: true, gamertag: true, division: true, avatar: true, points: true } },
      _count: { select: { tournaments: true, clubs: true, donations: true } },
    },
  });

  if (!season) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 });
  }

  // For tarkam seasons, fetch unique players from tournament participations
  let seasonPlayers: Array<{ id: string; gamertag: string; division: string; avatar: string | null; points: number; tournamentCount: number }> = [];
  if (season.division !== 'liga') {
    const participations = await db.participation.findMany({
      where: {
        tournament: { seasonId: id },
        status: { in: ['approved', 'assigned'] },
      },
      include: {
        player: { select: { id: true, gamertag: true, division: true, avatar: true, points: true } },
      },
    });
    // Deduplicate players (a player can participate in multiple tournaments)
    const playerMap = new Map<string, { id: string; gamertag: string; division: string; avatar: string | null; points: number; tournamentCount: number }>();
    for (const p of participations) {
      const existing = playerMap.get(p.player.id);
      if (existing) {
        existing.tournamentCount++;
      } else {
        playerMap.set(p.player.id, { ...p.player, tournamentCount: 1 });
      }
    }
    seasonPlayers = Array.from(playerMap.values()).sort((a, b) => b.points - a.points);
  }

  // For liga seasons, also fetch ALL ClubProfiles (for champion selector when season has no clubs yet)
  let availableProfiles: Array<{ id: string; name: string; logo: string | null; memberCount: number }> = [];
  if (season.division === 'liga') {
    const profiles = await db.clubProfile.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true } } },
    });
    availableProfiles = profiles.map(p => ({
      id: p.id,
      name: p.name,
      logo: p.logo,
      memberCount: p._count.members,
    }));
  }

  // Parse championSquad JSON string for SQLite compatibility
  const response = { ...season } as Record<string, unknown>;
  if (response.championSquad && typeof response.championSquad === 'string') {
    try {
      response.championSquad = JSON.parse(response.championSquad as string);
    } catch {
      response.championSquad = null;
    }
  }
  // Add players for tarkam seasons
  if (seasonPlayers.length > 0) {
    response.players = seasonPlayers;
  }
  // Add available profiles for liga seasons
  if (availableProfiles.length > 0) {
    response.availableProfiles = availableProfiles;
  }

  return NextResponse.json(response);
}

// PUT /api/seasons/[id] — Update season (status, championClubId, endDate, name)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { name, status, championClubId, championPlayerId, championSquad, endDate } = body;

  const season = await db.season.findUnique({ where: { id } });
  if (!season) {
    return NextResponse.json({ error: 'Season tidak ditemukan' }, { status: 404 });
  }

  // Validate championClubId if provided (liga mode — references ClubProfile)
  if (championClubId !== undefined && championClubId !== null) {
    const profile = await db.clubProfile.findUnique({ where: { id: championClubId } });
    if (!profile) {
      return NextResponse.json({ error: 'Club champion tidak ditemukan' }, { status: 400 });
    }
    // Check if club already has a season entry; if not, auto-create one
    const seasonEntry = await db.club.findFirst({ where: { profileId: championClubId, seasonId: id } });
    if (!seasonEntry) {
      // Auto-add club to this season so it can be set as champion
      await db.club.create({
        data: {
          profileId: championClubId,
          division: season.division,
          seasonId: id,
        },
      });
    }
  }

  // Validate championPlayerId if provided (tarkam mode — references Player)
  if (championPlayerId !== undefined && championPlayerId !== null) {
    const player = await db.player.findUnique({ where: { id: championPlayerId } });
    if (!player) {
      return NextResponse.json({ error: 'Player champion tidak ditemukan' }, { status: 400 });
    }
  }

  // Validate championSquad if provided — must be array with max 5 members
  if (championSquad !== undefined) {
    if (championSquad !== null && !Array.isArray(championSquad)) {
      return NextResponse.json({ error: 'championSquad harus berupa array' }, { status: 400 });
    }
    if (Array.isArray(championSquad) && championSquad.length > 5) {
      return NextResponse.json({ error: 'championSquad maksimal 5 anggota' }, { status: 400 });
    }
  }

  // Validate status transition
  if (status && !['active', 'completed', 'upcoming'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
  }

  // If completing season, auto-set endDate
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (status !== undefined) updateData.status = status;
  if (championClubId !== undefined) updateData.championClubId = championClubId || null;
  if (championPlayerId !== undefined) updateData.championPlayerId = championPlayerId || null;
  if (championSquad !== undefined) updateData.championSquad = championSquad ? JSON.stringify(championSquad) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

  // When status is set to completed and no endDate, set now
  if (status === 'completed' && !endDate && !season.endDate) {
    updateData.endDate = new Date();
  }

  const updated = await db.season.update({
    where: { id },
    data: updateData,
    include: {
      championClub: { select: { id: true, name: true, logo: true } },
      championPlayer: { select: { id: true, gamertag: true, division: true, avatar: true, points: true } },
      _count: { select: { tournaments: true, clubs: true } },
    },
  });

  // Parse championSquad JSON string for SQLite compatibility
  const updatedResponse = { ...updated } as Record<string, unknown>;
  if (updatedResponse.championSquad && typeof updatedResponse.championSquad === 'string') {
    try {
      updatedResponse.championSquad = JSON.parse(updatedResponse.championSquad as string);
    } catch {
      updatedResponse.championSquad = null;
    }
  }

  // Invalidate Next.js server cache so landing page shows updated champion data
  revalidatePath('/');
  revalidatePath('/api/league');

  return NextResponse.json(updatedResponse);
}

// DELETE /api/seasons/[id] — Delete season (cascade handled by Prisma schema)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const season = await db.season.findUnique({
    where: { id },
    include: { _count: { select: { tournaments: true, clubs: true, leagueMatches: true, playoffMatches: true } } },
  });
  if (!season) {
    return NextResponse.json({ error: 'Season tidak ditemukan' }, { status: 404 });
  }

  // Don't allow deletion if season has matches (too destructive)
  if (season._count.leagueMatches > 0 || season._count.playoffMatches > 0) {
    return NextResponse.json({ error: 'Season tidak bisa dihapus karena sudah memiliki match' }, { status: 400 });
  }

  // Prisma cascade deletes will handle: tournaments → teams → teamPlayers, matches → playerPoints,
  // clubs → clubMembers, donations (SetNull), etc.
  await db.season.delete({ where: { id } });

  return NextResponse.json({ success: true, message: 'Season berhasil dihapus' });
}
