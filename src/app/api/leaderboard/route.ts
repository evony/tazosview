import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      isActive: true,
    };

    if (division) {
      where.division = division;
    }

    const leaderboard = await db.player.findMany({
      where,
      select: {
        id: true,
        name: true,
        gamertag: true,
        avatar: true,
        tier: true,
        points: true,
        totalWins: true,
        totalMvp: true,
        streak: true,
        maxStreak: true,
        division: true,
        matches: true,
      },
      orderBy: [
        { points: 'desc' },
        { totalWins: 'desc' },
        { totalMvp: 'desc' },
      ],
      take: limit,
    });

    // Add rank
    const rankedLeaderboard = leaderboard.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      data: rankedLeaderboard,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
