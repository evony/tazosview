import { db } from '@/lib/db';
import { SEASON_TOTAL_WEEKS } from '@/lib/constants';
import { NextResponse } from 'next/server';

// Force dynamic — this route is never statically rendered
export const dynamic = 'force-dynamic';

// ── Smart Caching Strategy for /api/stats ──
// Same as /api/league: CDN caches 10s, browser never caches, Surrogate-Key for targeted purge.
// Admin mutations that affect standings/scores call revalidateTag('league-data').

const STATS_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30, max-age=0',
  'Surrogate-Key': 'league-data',
  'Vary': 'Accept-Encoding',
};

const STATS_CACHE_HEADERS_SHORT = {
  'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15, max-age=0',
  'Surrogate-Key': 'league-data',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division') || 'male';

  // Find seasons for the SPECIFIC division requested
  // Male and Female are separate seasons with separate clubs, matches, tournaments
  const allSeasons = await db.season.findMany({
    where: { division, status: { in: ['active', 'completed'] } },
    orderBy: { number: 'desc' },
    include: { _count: { select: { tournaments: true } } },
  });

  // Use the latest season for this division as the primary reference
  const season = allSeasons[0];

  if (!season) {
    return NextResponse.json({ hasData: false, division, allSeasons: [], weeklyChampions: [] }, {
      headers: STATS_CACHE_HEADERS_SHORT,
    });
  }

  // Find the latest season for this division that actually has clubs
  // This handles the case where a new Season is active but has no clubs yet,
  // while a previous season (completed) has clubs that should still be visible
  const seasonWithClubs = await db.season.findFirst({
    where: {
      division,
      id: { in: allSeasons.map(s => s.id) },
      clubs: { some: {} },
    },
    orderBy: { number: 'desc' },
  });
  // Use the season that has clubs for all club/league-related queries, fall back to latest season
  const activeSeasonId = seasonWithClubs?.id || season.id;
  const seasonForClubs = seasonWithClubs || season;

  // Run ALL independent queries in parallel
  const [
    activeTournament,
    totalPlayers,
    seasonDonations,
    topPlayers,
    clubs,
    recentMatches,
    upcomingMatches,
    playoffMatches,
    tournaments,
    leagueMatches,
  ] = await Promise.all([
    // Active/recent tournament — use activeSeasonId for consistency with clubs
    db.tournament.findFirst({
      where: { seasonId: activeSeasonId },
      orderBy: { weekNumber: 'desc' },
      include: {
        teams: { include: { teamPlayers: { include: { player: true } } } },
        matches: { include: { team1: true, team2: true, mvpPlayer: true } },
        participations: { include: { player: true } },
        donations: true,
      },
    }),

    // Total players
    db.player.count({ where: { division, isActive: true } }),

    // ALL approved donations for the season — use activeSeasonId for consistency
    db.donation.findMany({
      where: { seasonId: activeSeasonId, status: 'approved' },
    }),

    // Top players leaderboard — show all active players for landing page roster
    db.player.findMany({
      where: { division, isActive: true },
      orderBy: [{ points: 'desc' }, { totalWins: 'desc' }],
    }),

    // Clubs standings — use the season that actually has clubs
    db.club.findMany({
      where: { seasonId: activeSeasonId },
      orderBy: [{ points: 'desc' }, { gameDiff: 'desc' }],
      include: { profile: { include: { _count: { select: { members: true } } } }, season: { select: { name: true, division: true } } },
    }),

    // Recent matches — use activeSeasonId for consistency with clubs
    db.leagueMatch.findMany({
      where: { seasonId: activeSeasonId, status: 'completed' },
      orderBy: { week: 'desc' },
      take: 3,
      include: { club1: { include: { profile: true } }, club2: { include: { profile: true } } },
    }),

    // Upcoming matches
    db.leagueMatch.findMany({
      where: { seasonId: activeSeasonId, status: 'upcoming' },
      orderBy: { week: 'asc' },
      take: 3,
      include: { club1: { include: { profile: true } }, club2: { include: { profile: true } } },
    }),

    // Playoff matches
    db.playoffMatch.findMany({
      where: { seasonId: activeSeasonId },
      include: { club1: { include: { profile: true } }, club2: { include: { profile: true } } },
      orderBy: { round: 'asc' },
    }),

    // Tournaments list — fetch from ALL seasons for this division (not just activeSeasonId)
    // so that MVP Hall of Fame and weeklyChampions include completed seasons too
    db.tournament.findMany({
      where: { seasonId: { in: allSeasons.map((s: { id: string }) => s.id) } },
      orderBy: { weekNumber: 'asc' },
      include: {
        _count: { select: { teams: true, participations: true } },
        teams: {
          where: { isWinner: true },
          include: { teamPlayers: { include: { player: true } } },
        },
        participations: {
          where: { isMvp: true },
          include: { player: true },
        },
      },
    }),

    // All league matches grouped by week — use activeSeasonId for consistency
    db.leagueMatch.findMany({
      where: { seasonId: activeSeasonId },
      orderBy: [{ week: 'asc' }],
      include: { club1: { include: { profile: true } }, club2: { include: { profile: true } } },
    }),
  ]);

  // ── No more fallback logo/banner resolution needed ──
  // ClubProfile is now persistent — logo/banner are always on the profile
  // Clubs include their profile via { include: { profile: true } }

  // ── Compute derived values in-memory (no extra DB queries) ──

  // ── Active skins map: playerId → skins[] for all players in this division ──
  // Efficient single query instead of per-player lookups
  const playerIds = topPlayers.map((p: { id: string }) => p.id);
  const activePlayerSkins = playerIds.length > 0 ? await db.playerSkin.findMany({
    where: {
      account: { player: { id: { in: playerIds } } },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      skin: { select: { type: true, displayName: true, icon: true, colorClass: true, priority: true, duration: true } },
      account: { select: { player: { select: { id: true } }, donorBadgeCount: true } },
    },
  }) : [];

  // Also fetch donorBadgeCount for ALL players with accounts (even if no active skins)
  const donorBadgeAccounts = playerIds.length > 0 ? await db.account.findMany({
    where: { player: { id: { in: playerIds } }, donorBadgeCount: { gt: 0 } },
    select: { player: { select: { id: true } }, donorBadgeCount: true },
  }) : [];
  const donorBadgeMap: Record<string, number> = {};
  for (const acc of donorBadgeAccounts) {
    donorBadgeMap[acc.player.id] = acc.donorBadgeCount;
  }

  // Build a map: playerId → skins[]
  const skinMap: Record<string, Array<{
    type: string;
    icon: string;
    displayName: string;
    colorClass: string;
    priority: number;
    duration: string;
    reason?: string | null;
    expiresAt?: Date | null;
    donorBadgeCount?: number;
  }>> = {};

  for (const ps of activePlayerSkins) {
    const pid = ps.account.player.id;
    if (!skinMap[pid]) skinMap[pid] = [];
    skinMap[pid].push({
      type: ps.skin.type,
      icon: ps.skin.icon,
      displayName: ps.skin.displayName,
      colorClass: ps.skin.colorClass, // Raw JSON string — renderer parses it
      priority: ps.skin.priority,
      duration: ps.skin.duration,
      reason: ps.reason,
      expiresAt: ps.expiresAt,
      donorBadgeCount: ps.account.donorBadgeCount,
    });
  }

  // For players with donor badges but no active skins, add a virtual entry
  // so the permanent heart badge can still be rendered
  for (const [pid, count] of Object.entries(donorBadgeMap)) {
    if (!skinMap[pid]) {
      skinMap[pid] = [];
    }
    // Only add virtual entry if there's no active donor skin already
    const hasActiveDonorSkin = skinMap[pid].some(s => s.type === 'donor');
    if (!hasActiveDonorSkin) {
      skinMap[pid].push({
        type: 'donor_badge',
        icon: '❤️',
        displayName: count >= 5 ? 'Heart Badge ★' : 'Heart Badge',
        colorClass: '{"frame":"#fb7185","name":"#fb7185|#ef4444|#f472b6","badge":"rgba(244,63,94,0.2)|#fda4af","border":"#f43f5e|#ef4444|#f472b6","glow":"rgba(244,63,94,0.35)"}',
        priority: 0,
        duration: 'permanent',
        reason: `${count}x donasi`,
        expiresAt: null,
        donorBadgeCount: count,
      });
    } else {
      // Attach donorBadgeCount to the existing donor skin entry
      const donorSkin = skinMap[pid].find(s => s.type === 'donor');
      if (donorSkin) {
        donorSkin.donorBadgeCount = count;
      }
    }
  }

  // Total prize pool — filter weekly donations
  const totalPrizePool = seasonDonations
    .filter(d => d.type === 'weekly')
    .reduce((sum, d) => sum + d.amount, 0);

  // Season donation total
  const seasonDonationTotal = seasonDonations.reduce((sum, d) => sum + d.amount, 0);

  // Top donors — computed in-memory from seasonDonations instead of groupBy query
  const donorAccum = new Map<string, { totalAmount: number; donationCount: number }>();
  for (const d of seasonDonations) {
    const entry = donorAccum.get(d.donorName) ?? { totalAmount: 0, donationCount: 0 };
    donorAccum.set(d.donorName, {
      totalAmount: entry.totalAmount + d.amount,
      donationCount: entry.donationCount + 1,
    });
  }
  const topDonors = Array.from(donorAccum.entries())
    .map(([donorName, data]) => ({
      donorName,
      _sum: { amount: data.totalAmount },
      _count: { id: data.donationCount },
    }))
    .sort((a, b) => b._sum.amount - a._sum.amount)
    .slice(0, 5);

  // Completed tournaments — filtered in-memory from already-fetched list
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

  // Build season lookup for tournament → season mapping
  const seasonLookup = new Map(allSeasons.map((s: { id: string; number: number; status: string }) => [s.id, s]));

  // Weekly champions — derived from completedTournaments (no new query)
  const weeklyChampions = completedTournaments.map(t => {
    const winnerTeam = t.teams[0]; // Only 1 winning team
    const mvpParticipation = t.participations.find(p => p.isMvp); // Admin-assigned MVP
    const mvpPlayer = mvpParticipation?.player;
    const tournamentSeason = seasonLookup.get(t.seasonId);
    return {
      weekNumber: t.weekNumber,
      tournamentName: t.name,
      prizePool: t.prizePool,
      completedAt: t.completedAt,
      seasonId: t.seasonId,
      seasonNumber: tournamentSeason?.number ?? 1,
      seasonStatus: tournamentSeason?.status ?? 'active',
      winnerTeam: winnerTeam ? {
        name: winnerTeam.name,
        players: winnerTeam.teamPlayers.map(tp => ({
          id: tp.player.id,
          gamertag: tp.player.gamertag,
          avatar: tp.player.avatar,
          tier: tp.tier || tp.player.tier,
          points: tp.player.points,
          totalWins: tp.player.totalWins,
          totalMvp: tp.player.totalMvp,
          streak: tp.player.streak,
          matches: tp.player.matches,
        })),
      } : null,
      mvp: mvpPlayer ? { id: mvpPlayer.id, gamertag: mvpPlayer.gamertag, avatar: mvpPlayer.avatar, tier: mvpPlayer.tier, totalMvp: mvpPlayer.totalMvp, points: mvpPlayer.points } : null,
    };
  });

  // Season progress
  const completedWeeks = tournaments.filter(t => t.status === 'completed').length;

  // MVP Hall of Fame — computed in-memory from tournament participations instead of a separate query
  const mvpHallOfFame = completedTournaments
    .flatMap(t =>
      t.participations.map(p => ({
        _sortKey: p.createdAt as Date,
        id: p.player.id,
        gamertag: p.player.gamertag,
        avatar: p.player.avatar,
        tier: p.player.tier,
        totalMvp: p.player.totalMvp,
        points: p.player.points,
        totalWins: p.player.totalWins,
        streak: p.player.streak,
        weekNumber: t.weekNumber,
        tournamentName: t.name,
        prizePool: t.prizePool,
      }))
    )
    .sort((a, b) => +b._sortKey - +a._sortKey)
    .map(({ _sortKey, ...rest }) => rest);

  // Type for champion player in season info
  type SeasonChampionPlayer = {
    id: string;
    gamertag: string;
    avatar?: string | null;
    tier: string;
    points: number;
    totalWins: number;
    totalMvp: number;
    streak: number;
    maxStreak: number;
    matches: number;
    club?: string | null;
    division?: string;
  };

  // All seasons info for season selector — include champion player data
  const allSeasonsInfo = await Promise.all(allSeasons.map(async (s: { id: string; name: string; number: number; status: string; startDate: Date | null; endDate: Date | null; championClubId: string | null; championPlayerId: string | null; _count?: { tournaments?: number } }) => {
    let championPlayer: SeasonChampionPlayer | null = null;
    if (s.championPlayerId) {
      const player = await db.player.findUnique({
        where: { id: s.championPlayerId },
        include: {
          clubMembers: {
            where: { leftAt: null },
            include: { profile: { select: { name: true } } },
            take: 1,
          },
        },
      });
      if (player) {
        const activeClub = player.clubMembers[0]?.profile?.name || null;
        championPlayer = {
          id: player.id,
          gamertag: player.gamertag,
          avatar: player.avatar,
          tier: player.tier,
          points: player.points,
          totalWins: player.totalWins,
          totalMvp: player.totalMvp,
          streak: player.streak,
          maxStreak: player.maxStreak,
          matches: player.matches,
          club: activeClub,
          division: player.division,
        };
      }
    }
    return {
      id: s.id,
      name: s.name,
      number: s.number,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      tournamentCount: s._count?.tournaments ?? 0,
      championClubId: s.championClubId,
      championPlayerId: s.championPlayerId,
      championPlayer,
    };
  }));

  // ── Flatten club data for frontend compatibility ──
  // New schema: Club has profileId → ClubProfile (name, logo, bannerImage)
  // Frontend expects: { id, name, logo, wins, losses, points, gameDiff, _count: { members } }
  const flatClubs = clubs.map((c: any) => ({
    id: c.id,
    name: c.profile?.name || '',
    logo: c.profile?.logo || null,
    bannerImage: c.profile?.bannerImage || null,
    division: c.division,
    seasonId: c.seasonId,
    wins: c.wins,
    losses: c.losses,
    points: c.points,
    gameDiff: c.gameDiff,
    _count: { members: c.profile?._count?.members || 0 },
    profileId: c.profileId,
  }));

  // Flatten matches (club1/club2 now have nested profile)
  const flatRecentMatches = recentMatches.map((m: any) => ({
    ...m, club1: { id: m.club1?.id, name: m.club1?.profile?.name, logo: m.club1?.profile?.logo }, club2: { id: m.club2?.id, name: m.club2?.profile?.name, logo: m.club2?.profile?.logo },
  }));
  const flatUpcomingMatches = upcomingMatches.map((m: any) => ({
    ...m, club1: { id: m.club1?.id, name: m.club1?.profile?.name, logo: m.club1?.profile?.logo }, club2: { id: m.club2?.id, name: m.club2?.profile?.name, logo: m.club2?.profile?.logo },
  }));
  const flatPlayoffMatches = playoffMatches.map((m: any) => ({
    ...m, club1: { id: m.club1?.id, name: m.club1?.profile?.name, logo: m.club1?.profile?.logo }, club2: { id: m.club2?.id, name: m.club2?.profile?.name, logo: m.club2?.profile?.logo },
  }));
  const flatLeagueMatches = leagueMatches.map((m: any) => ({
    ...m, club1: { id: m.club1?.id, name: m.club1?.profile?.name, logo: m.club1?.profile?.logo }, club2: { id: m.club2?.id, name: m.club2?.profile?.name, logo: m.club2?.profile?.logo },
  }));

  return NextResponse.json({
    hasData: true,
    division,
    season,
    allSeasons: allSeasonsInfo,
    seasonForClubs, // Season that has clubs — used by admin club management
    activeTournament,
    totalPlayers,
    totalPrizePool,
    seasonDonationTotal,
    topPlayers,
    skinMap,
    clubs: flatClubs,
    recentMatches: flatRecentMatches,
    upcomingMatches: flatUpcomingMatches,
    playoffMatches: flatPlayoffMatches,
    tournaments,
    weeklyChampions,
    leagueMatches: flatLeagueMatches,
    topDonors,
    mvpHallOfFame,
    seasonProgress: {
      totalWeeks: SEASON_TOTAL_WEEKS,
      completedWeeks,
      percentage: SEASON_TOTAL_WEEKS > 0 ? Math.round((completedWeeks / SEASON_TOTAL_WEEKS) * 100) : 0,
    },
  }, {
    headers: STATS_CACHE_HEADERS,
  });
}
