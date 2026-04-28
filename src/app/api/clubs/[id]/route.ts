import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// GET /api/clubs/[id] — Club detail with profile, members, and matches
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const club = await db.club.findUnique({
    where: { id },
    include: {
      profile: {
        include: {
          members: {
            where: { leftAt: null },
            include: { player: { select: { id: true, name: true, gamertag: true, division: true, tier: true, points: true, totalWins: true, totalMvp: true, streak: true, avatar: true } } },
            orderBy: [{ role: 'desc' }, { player: { gamertag: 'asc' } }],
          },
        },
      },
      season: { select: { id: true, name: true, division: true, status: true } },
      homeMatches: { include: { club2: { include: { profile: { select: { name: true, logo: true } } } } }, orderBy: { week: 'asc' }, take: 5 },
      awayMatches: { include: { club1: { include: { profile: { select: { name: true, logo: true } } } } }, orderBy: { week: 'asc' }, take: 5 },
    },
  });
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  // Flatten for frontend compatibility
  const flat = {
    id: club.id,
    profileId: club.profileId,
    name: club.profile.name,
    logo: club.profile.logo,
    bannerImage: club.profile.bannerImage,
    division: club.division,
    seasonId: club.seasonId,
    wins: club.wins,
    losses: club.losses,
    points: club.points,
    gameDiff: club.gameDiff,
    season: club.season,
    members: club.profile.members.map(m => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      player: m.player,
    })),
    homeMatches: club.homeMatches.map(m => ({
      ...m,
      club2: { id: m.club2.id, name: m.club2.profile?.name, logo: m.club2.profile?.logo },
    })),
    awayMatches: club.awayMatches.map(m => ({
      ...m,
      club1: { id: m.club1.id, name: m.club1.profile?.name, logo: m.club1.profile?.logo },
    })),
    _count: { members: club.profile.members.length },
  };

  return NextResponse.json(flat);
}

// PUT /api/clubs/[id] — Edit club (name, logo, banner → all on ClubProfile now)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { name, logo, bannerImage } = body;

  const club = await db.club.findUnique({
    where: { id },
    include: { profile: true },
  });
  if (!club) return NextResponse.json({ error: 'Club tidak ditemukan' }, { status: 404 });

  // ── Update ClubProfile (persistent identity: name, logo, banner) ──
  if (name || logo !== undefined || bannerImage !== undefined) {
    // Check name uniqueness if renaming
    if (name && name !== club.profile.name) {
      const existing = await db.clubProfile.findFirst({
        where: { name, id: { not: club.profileId } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Nama club sudah digunakan' }, { status: 409 });
      }
    }

    await db.clubProfile.update({
      where: { id: club.profileId },
      data: {
        ...(name && { name: name.trim() }),
        ...(logo !== undefined && { logo }),
        ...(bannerImage !== undefined && { bannerImage }),
      },
    });
  }

  // Re-fetch updated club with profile
  const updated = await db.club.findUnique({
    where: { id },
    include: { profile: true },
  });

  // Invalidate ALL Next.js/Vercel cache layers
  revalidatePath('/');
  revalidatePath('/api/league');
  revalidateTag('league-data', 'max');
  revalidatePath('/api/stats');

  return NextResponse.json({
    id: updated!.id,
    profileId: updated!.profileId,
    name: updated!.profile.name,
    logo: updated!.profile.logo,
    bannerImage: updated!.profile.bannerImage,
    division: updated!.division,
    seasonId: updated!.seasonId,
    wins: updated!.wins,
    losses: updated!.losses,
    points: updated!.points,
    gameDiff: updated!.gameDiff,
  });
}

// DELETE /api/clubs/[id] — Delete club (season entry only, not the profile)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const club = await db.club.findUnique({
    where: { id },
    include: {
      profile: { select: { id: true, name: true } },
      _count: { select: { homeMatches: true, awayMatches: true } },
    },
  });
  if (!club) return NextResponse.json({ error: 'Club tidak ditemukan' }, { status: 404 });

  // Check if club has matches — don't allow deletion if so
  if (club._count.homeMatches > 0 || club._count.awayMatches > 0) {
    return NextResponse.json({ error: 'Club tidak bisa dihapus karena sudah memiliki match' }, { status: 400 });
  }

  // Delete the season entry (Club record)
  // Note: ClubMember is linked to ClubProfile, NOT Club, so deleting a Club
  // doesn't remove members — they persist across seasons via ClubProfile
  await db.club.delete({ where: { id } });

  // Invalidate cache
  revalidatePath('/');
  revalidatePath('/api/league');
  revalidateTag('league-data', 'max');
  revalidatePath('/api/stats');

  return NextResponse.json({ success: true, message: `Club "${club.profile.name}" berhasil dihapus dari season ini. Profil club dan anggota tetap tersimpan.` });
}
