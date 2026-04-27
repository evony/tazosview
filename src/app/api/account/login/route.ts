import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSessionToken } from '@/lib/auth';

const PLAYER_SESSION_COOKIE = 'idm-player-session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    // Find account by username (which is gamertag)
    const account = await db.account.findUnique({
      where: { username },
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
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, account.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Update last login
    await db.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session token (use 'player' role to distinguish from admin)
    const token = createSessionToken(account.id, 'player');

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

    const response = NextResponse.json({
      success: true,
      account: {
        id: account.id,
        username: account.username,
        donorBadgeCount: account.donorBadgeCount,
        skins: skinsData,
        player: account.player,
      },
    });

    // Set httpOnly cookie for player session
    response.cookies.set(PLAYER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Player login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
