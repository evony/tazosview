import { db } from '@/lib/db';
import { withDbRetry } from '@/lib/db-resilience';
import { NextResponse } from 'next/server';

// Force dynamic — this route is never statically rendered
export const dynamic = 'force-dynamic';

const LEAGUE_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30, max-age=0',
  'Surrogate-Key': 'league-data',
  'Vary': 'Accept-Encoding',
};

const LEAGUE_CACHE_HEADERS_SHORT = {
  'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15, max-age=0',
  'Surrogate-Key': 'league-data',
};

export async function GET() {
  try {
  // Get all seasons (active + completed)
  const seasons = await withDbRetry(() => db.season.findMany({
    where: { status: { in: ['active', 'completed'] } },
    orderBy: { number: 'desc' },
    include: {
      championClub: {
        select: {
          id: true, name: true, logo: true,
          members: {
            where: { leftAt: null },
            include: {
              player: { select: { id: true, gamertag: true, division: true, tier: true, points: true, avatar: true } },
            },
          },
        },
      },
    },
  }));

  if (!seasons || seasons.length === 0) {
    return NextResponse.json({ hasData: false, reason: 'no_season' }, {
      headers: LEAGUE_CACHE_HEADERS_SHORT,
    });
  }

  // Build Liga IDM champion data
  const championSeason = seasons.find(s => s.championClubId && s.championClub);
  const ligaChampion = championSeason?.championClub ? {
    id: championSeason.championClub.id,
    name: championSeason.championClub.name,
    logo: championSeason.championClub.logo,
    seasonNumber: championSeason.number,
    members: (() => {
      const rawSquad = championSeason.championSquad;
      const squad: Array<{id: string; gamertag: string; division: string; role: string}> | null =
        rawSquad ? (typeof rawSquad === 'string' ? JSON.parse(rawSquad) : rawSquad as unknown as Array<{id: string; gamertag: string; division: string; role: string}>) : null;
      if (squad && Array.isArray(squad) && squad.length > 0) {
        return squad.map(s => ({
          id: s.id, gamertag: s.gamertag, division: s.division, role: s.role,
          avatar: null as string | null,
        }));
      }
      return championSeason.championClub.members?.map(m => ({
        id: m.player.id, gamertag: m.player.gamertag, division: m.player.division,
        role: m.role, avatar: m.player.avatar,
      })) || [];
    })()
  } : null;

  // Resolve avatars for champion squad members
  if (ligaChampion?.members && ligaChampion.members.some(m => m.avatar === null)) {
    const memberIds = ligaChampion.members.map(m => m.id);
    const playersWithAvatars = await withDbRetry(() => db.player.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, avatar: true },
    }));
    const avatarLookup = new Map(playersWithAvatars.map(p => [p.id, p.avatar]));
    for (const member of ligaChampion.members) {
      if (member.avatar === null) {
        member.avatar = avatarLookup.get(member.id) || null;
      }
    }
  }

  const season = seasons[0];
  const allSeasonIds = seasons.map(s => s.id);

  // ── Get ClubProfiles with their season entries and members ──
  // ClubProfile is persistent — name/logo/members are always there
  const clubProfiles = await withDbRetry(() => db.clubProfile.findMany({
    orderBy: { name: 'asc' },
    include: {
      members: {
        where: { leftAt: null },
        include: {
          player: { select: { id: true, gamertag: true, division: true, tier: true, points: true, avatar: true } },
        },
      },
      seasonEntries: {
        where: { seasonId: { in: allSeasonIds } },
      },
    },
  }));

  if (clubProfiles.length === 0) {
    return NextResponse.json({
      hasData: false, reason: 'no_clubs',
      season: { id: season.id, name: season.name },
      ligaChampion,
    }, { headers: LEAGUE_CACHE_HEADERS_SHORT });
  }

  // Build deduplicated clubs from profiles + season entries
  const dedupedClubs = clubProfiles.map(profile => {
    // Sum all Liga stats from season entries
    let totalWins = 0, totalLosses = 0, totalPoints = 0, totalGameDiff = 0;
    for (const entry of profile.seasonEntries) {
      totalWins += entry.wins;
      totalLosses += entry.losses;
      totalPoints += entry.points;
      totalGameDiff += entry.gameDiff;
    }

    return {
      id: profile.id,
      name: profile.name,
      logo: profile.logo,
      bannerImage: profile.bannerImage,
      wins: totalWins,
      losses: totalLosses,
      points: totalPoints,
      gameDiff: totalGameDiff,
      memberCount: profile.members.length,
      members: profile.members.map(m => ({
        id: m.player.id,
        gamertag: m.player.gamertag,
        name: m.player.gamertag,
        division: m.player.division,
        tier: m.player.tier,
        points: m.player.points,
        role: m.role,
        avatar: m.player.avatar,
      })),
    };
  }).sort((a, b) => b.points - a.points || b.gameDiff - a.gameDiff);

  // All league matches
  const leagueMatches = await withDbRetry(() => db.leagueMatch.findMany({
    where: { seasonId: { in: allSeasonIds } },
    orderBy: [{ week: 'asc' }],
    include: {
      club1: { include: { profile: true } },
      club2: { include: { profile: true } },
    },
  }));

  // All playoff matches
  const playoffMatches = await withDbRetry(() => db.playoffMatch.findMany({
    where: { seasonId: { in: allSeasonIds } },
    include: {
      club1: { include: { profile: true } },
      club2: { include: { profile: true } },
    },
    orderBy: { round: 'asc' },
  }));

  // Top players
  const topPlayers = await withDbRetry(() => db.player.findMany({
    where: { isActive: true },
    orderBy: [{ points: 'desc' }, { totalWins: 'desc' }],
  }));

  // MVP candidates
  const mvpCandidates = await withDbRetry(() => db.participation.findMany({
    where: {
      isMvp: true,
      tournament: { seasonId: { in: allSeasonIds }, status: 'completed' },
    },
    include: { player: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  }));

  // Stats
  const totalClubs = dedupedClubs.length;
  const totalMatches = leagueMatches.length;
  const completedMatches = leagueMatches.filter(m => m.status === 'completed').length;
  const liveMatches = leagueMatches.filter(m => m.status === 'live').length;
  const weeks = [...new Set(leagueMatches.map(m => m.week))].sort((a: number, b: number) => a - b);
  const totalWeeks = weeks.length > 0 ? Math.max(...weeks) : 0;
  const isPreSeason = dedupedClubs.length > 0 && leagueMatches.length === 0;

  return NextResponse.json({
    hasData: true,
    preSeason: isPreSeason,
    season: { id: season.id, name: season.name },
    ligaChampion,
    clubs: dedupedClubs,
    leagueMatches: leagueMatches.map(m => ({
      id: m.id, week: m.week, score1: m.score1, score2: m.score2,
      status: m.status, format: m.format,
      club1: { id: m.club1.id, name: m.club1.profile.name, logo: m.club1.profile.logo },
      club2: { id: m.club2.id, name: m.club2.profile.name, logo: m.club2.profile.logo },
    })),
    playoffMatches: playoffMatches.map(m => ({
      id: m.id, round: m.round, score1: m.score1, score2: m.score2,
      status: m.status, format: m.format,
      club1: { id: m.club1.id, name: m.club1.profile.name, logo: m.club1.profile.logo },
      club2: { id: m.club2.id, name: m.club2.profile.name, logo: m.club2.profile.logo },
    })),
    topPlayers: topPlayers.map(p => ({
      id: p.id, gamertag: p.gamertag, division: p.division,
      tier: p.tier, points: p.points, totalWins: p.totalWins,
      totalMvp: p.totalMvp, streak: p.streak, avatar: p.avatar,
    })),
    mvpCandidates: mvpCandidates.map(mp => ({
      id: mp.player.id, gamertag: mp.player.gamertag, tier: mp.player.tier,
      totalMvp: mp.player.totalMvp, points: mp.player.points,
      totalWins: mp.player.totalWins, streak: mp.player.streak,
      avatar: mp.player.avatar, division: mp.player.division,
    })),
    stats: { totalClubs, totalMatches, completedMatches, liveMatches, totalWeeks, playedWeeks: weeks.length },
    teamFormat: {
      size: 5, main: 3, substitute: 2,
      rule: 'Peserta bebas mix atau tidak mix dari divisi male dan female. Skuad champion dapat memilih anggota dari divisi mana saja.',
    },
  }, { headers: LEAGUE_CACHE_HEADERS });

  } catch (error: any) {
    console.error('[/api/league] Error:', error?.message || error);
    return NextResponse.json({
      hasData: false, reason: 'db_error', error: error?.message || 'Database connection failed',
      ligaChampion: null,
    }, { status: 200, headers: LEAGUE_CACHE_HEADERS_SHORT });
  }
}
