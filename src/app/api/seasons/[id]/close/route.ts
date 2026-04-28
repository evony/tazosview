import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/seasons/[id]/close
 *
 * Tutup Season — close an active season, auto-determine champion from per-season points,
 * and snapshot the champion data. Does NOT create the next season (admin creates manually).
 *
 * Rules:
 * - Only works on seasons with status "active"
 * - Sets status to "completed" and endDate to now
 * - For tarkam: determines championPlayerId from per-season PlayerPoint aggregation
 * - For liga: determines championClubId from Club season entry with most points
 * - Snapshots full champion stats so historical display is accurate even after new seasons
 * - Only 1 active season per division at a time (validated on season creation, not here)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    const season = await db.season.findUnique({
      where: { id },
      include: {
        tournaments: { select: { id: true, status: true } },
      },
    });

    if (!season) {
      return NextResponse.json({ error: 'Season tidak ditemukan' }, { status: 404 });
    }

    if (season.status !== 'active') {
      return NextResponse.json({
        error: `Season tidak bisa ditutup karena status saat ini "${season.status}". Hanya season "active" yang bisa ditutup.`,
      }, { status: 400 });
    }

    // Warn if there are incomplete tournaments
    const incompleteTournaments = season.tournaments.filter(
      t => t.status !== 'completed' && t.status !== 'setup'
    );
    if (incompleteTournaments.length > 0) {
      return NextResponse.json({
        error: `Masih ada ${incompleteTournaments.length} tournament yang belum selesai. Finalisasi semua tournament terlebih dahulu sebelum menutup season.`,
      }, { status: 400 });
    }

    // ===== DETERMINE CHAMPION =====
    const updateData: {
      status: string;
      endDate: Date;
      championClubId?: string | null;
      championPlayerId?: string | null;
      championPlayerPoints?: number | null;
      championPlayerSnapshot?: string | null;
      championClubSnapshot?: string | null;
    } = {
      status: 'completed',
      endDate: new Date(),
    };

    if (season.division === 'liga') {
      // Liga mode: champion is the club with most points in this season
      const topClub = await db.club.findFirst({
        where: { seasonId: id },
        orderBy: [{ points: 'desc' }, { gameDiff: 'desc' }],
        include: { profile: { select: { id: true, name: true, logo: true } } },
      });
      // championClubId references ClubProfile (not Club season entry)
      updateData.championClubId = topClub?.profileId || null;

      // Snapshot the champion club data
      if (topClub?.profile) {
        updateData.championClubSnapshot = JSON.stringify({
          name: topClub.profile.name,
          logo: topClub.profile.logo,
          wins: topClub.wins,
          losses: topClub.losses,
          points: topClub.points,
          gameDiff: topClub.gameDiff,
        });
      }
    } else {
      // Tarkam mode: champion is the player with most per-season points
      // Compute from PlayerPoint records (not lifetime Player.points)
      const seasonPoints = await db.playerPoint.groupBy({
        by: ['playerId'],
        where: { seasonId: id },
        _sum: { amount: true },
      });

      if (seasonPoints.length > 0) {
        // Get player details for tiebreaking AND snapshot
        const playerIds = seasonPoints.map(sp => sp.playerId);
        const players = await db.player.findMany({
          where: { id: { in: playerIds }, division: season.division, isActive: true },
          include: {
            clubMembers: {
              where: { leftAt: null },
              include: { profile: { select: { name: true } } },
              take: 1,
            },
          },
        });
        const playerMap = new Map(players.map(p => [p.id, p]));

        // Sort by per-season points desc, then totalWins desc as tiebreaker
        seasonPoints.sort((a, b) => {
          const ptsA = a._sum.amount || 0;
          const ptsB = b._sum.amount || 0;
          if (ptsB !== ptsA) return ptsB - ptsA;
          const winsA = playerMap.get(a.playerId)?.totalWins || 0;
          const winsB = playerMap.get(b.playerId)?.totalWins || 0;
          return winsB - winsA;
        });

        const championId = seasonPoints[0]?.playerId;
        updateData.championPlayerId = championId || null;
        updateData.championPlayerPoints = seasonPoints[0]?._sum.amount || null;

        // Snapshot the champion player data at time of season closure
        if (championId) {
          const champion = playerMap.get(championId);
          if (champion) {
            const activeClub = champion.clubMembers[0]?.profile?.name || null;
            updateData.championPlayerSnapshot = JSON.stringify({
              gamertag: champion.gamertag,
              avatar: champion.avatar,
              tier: champion.tier,
              points: seasonPoints[0]?._sum.amount || 0, // Per-season points (not lifetime)
              totalWins: champion.totalWins,
              totalMvp: champion.totalMvp,
              streak: champion.streak,
              maxStreak: champion.maxStreak,
              matches: champion.matches,
              club: activeClub,
              division: champion.division,
            });
          }
        }
      } else {
        updateData.championPlayerId = null;
        updateData.championPlayerPoints = null;
      }
    }

    // ===== CLOSE THE SEASON =====
    const updated = await db.season.update({
      where: { id },
      data: updateData,
      include: {
        championClub: { select: { id: true, name: true, logo: true } },
        championPlayer: { select: { id: true, gamertag: true, division: true, avatar: true, points: true } },
        _count: { select: { tournaments: true, clubs: true } },
      },
    });

    // Invalidate caches
    revalidatePath('/');
    revalidatePath('/api/league');

    return NextResponse.json({
      success: true,
      message: `Season "${season.name}" berhasil ditutup!${updateData.championPlayerId ? ' Champion otomatis ditentukan dari per-season points.' : updateData.championClubId ? ' Champion club otomatis ditentukan dari poin liga.' : ' Tidak ada champion yang ditentukan (belum ada point record).'} `,
      season: updated,
    });

  } catch (error) {
    console.error('Close season error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menutup season' }, { status: 500 });
  }
}
