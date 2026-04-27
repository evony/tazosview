import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { db } from '@/lib/db';

const PLAYER_SESSION_COOKIE = 'idm-player-session';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=');
        return [key, val.join('=')];
      })
    );

    const token = cookies[PLAYER_SESSION_COOKIE];
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decodedToken = decodeURIComponent(token);
    const session = verifySessionToken(decodedToken);
    if (!session || session.role !== 'player') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get full account data with player info
    const account = await db.account.findUnique({
      where: { id: session.adminId },
      include: {
        player: {
          select: {
            id: true,
            gamertag: true,
            name: true,
            division: true,
            tier: true,
            avatar: true,
            points: true,
            totalWins: true,
            totalMvp: true,
            matches: true,
            streak: true,
            maxStreak: true,
            city: true,
            phone: true,
            clubMembers: {
              where: { leftAt: null },
              include: {
                profile: {
                  select: { id: true, name: true, logo: true },
                },
              },
              take: 1,
            },
            achievements: {
              include: {
                achievement: true,
              },
              orderBy: { earnedAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get the current club from membership (now on ClubProfile)
    const currentProfile = account.player.clubMembers[0]?.profile || null;

    // Get active skins
    const playerSkins = await db.playerSkin.findMany({
      where: {
        accountId: account.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        skin: { select: { id: true, type: true, displayName: true, icon: true, colorClass: true, priority: true, duration: true } },
      },
      orderBy: { skin: { priority: 'desc' } },
    });

    return NextResponse.json({
      account: {
        id: account.id,
        username: account.username,
        email: account.email,
        phone: account.phone,
        skins: playerSkins.map(ps => ({
          type: ps.skin.type,
          icon: ps.skin.icon,
          displayName: ps.skin.displayName,
          colorClass: ps.skin.colorClass,
          priority: ps.skin.priority,
          duration: ps.skin.duration,
          reason: ps.reason,
          expiresAt: ps.expiresAt?.toISOString() ?? null,
        })),
        lastLoginAt: account.lastLoginAt,
        createdAt: account.createdAt,
        player: {
          ...account.player,
          club: currentProfile ? { id: currentProfile.id, name: currentProfile.name, logo: currentProfile.logo } : null,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
