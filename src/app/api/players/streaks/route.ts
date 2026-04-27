import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'male';
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10);

    // Get top players by streak in the division
    const players = await db.player.findMany({
      where: {
        division,
        isActive: true,
        streak: { gt: 0 },
      },
      orderBy: [
        { streak: 'desc' },
        { maxStreak: 'desc' },
      ],
      take: limit,
      include: {
        clubMembers: {
          where: { leftAt: null },
          include: {
            profile: {
              select: { name: true },
            },
          },
          take: 1,
        },
      },
    });

    const streakData = players.map((player) => {
      const club = player.clubMembers[0]?.profile?.name || null;
      return {
        id: player.id,
        gamertag: player.gamertag,
        avatar: player.avatar,
        tier: player.tier,
        streak: player.streak,
        maxStreak: player.maxStreak,
        club,
      };
    });

    const response = NextResponse.json({ streaks: streakData });
    response.headers.set('Cache-Control', 's-maxage=10, stale-while-revalidate=30, max-age=0');
    response.headers.set('Surrogate-Key', 'league-data');
    return response;
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Error fetching player streaks:', error);
    return NextResponse.json({ streaks: [] }, { status: 500 });
  }
}
