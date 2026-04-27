import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { db } from '@/lib/db';

const PLAYER_SESSION_COOKIE = 'idm-player-session';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ authenticated: false });
    }

    // Parse cookie
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=');
        return [key, val.join('=')];
      })
    );

    const token = cookies[PLAYER_SESSION_COOKIE];
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const decodedToken = decodeURIComponent(token);
    const session = verifySessionToken(decodedToken);
    if (!session || session.role !== 'player') {
      return NextResponse.json({ authenticated: false });
    }

    // Get account data
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
            city: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ authenticated: false });
    }

    // Get active skins for the player
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

    // Build skins array with donorBadgeCount support
    const skinsData = playerSkins.map(ps => ({
      type: ps.skin.type,
      icon: ps.skin.icon,
      displayName: ps.skin.displayName,
      colorClass: ps.skin.colorClass,
      priority: ps.skin.priority,
      duration: ps.skin.duration,
      reason: ps.reason,
      expiresAt: ps.expiresAt?.toISOString() ?? null,
      donorBadgeCount: ps.skin.type === 'donor' ? account.donorBadgeCount : undefined,
    }));

    // If player has donor badges but no active donor skin, add virtual donor_badge entry
    if (account.donorBadgeCount > 0 && !skinsData.some(s => s.type === 'donor')) {
      skinsData.push({
        type: 'donor_badge',
        icon: '❤️',
        displayName: account.donorBadgeCount >= 5 ? 'Heart Badge ★' : 'Heart Badge',
        colorClass: '{"frame":"#fb7185","name":"#fb7185|#ef4444|#f472b6","badge":"rgba(244,63,94,0.2)|#fda4af","border":"#f43f5e|#ef4444|#f472b6","glow":"rgba(244,63,94,0.35)"}',
        priority: 0,
        duration: 'permanent',
        reason: `${account.donorBadgeCount}x donasi`,
        expiresAt: null,
        donorBadgeCount: account.donorBadgeCount,
      });
    }

    return NextResponse.json({
      authenticated: true,
      account: {
        id: account.id,
        username: account.username,
        donorBadgeCount: account.donorBadgeCount,
        skins: skinsData,
        player: account.player,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
