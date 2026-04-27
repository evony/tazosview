import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/skins/player/[accountId]
 * Get any player's active skins (public, no auth needed - for display on profiles)
 * Returns active (non-expired) skins for the given accountId
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId diperlukan' },
        { status: 400 }
      );
    }

    // Verify the account exists
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        player: {
          select: { gamertag: true, name: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan' },
        { status: 404 }
      );
    }

    // Find all PlayerSkin records for this account
    const playerSkins = await db.playerSkin.findMany({
      where: { accountId },
      include: { skin: true },
    });

    const now = new Date();

    // Filter out expired skins (don't auto-clean for public view, just filter)
    const activeSkins = playerSkins.filter(ps => {
      return !ps.expiresAt || new Date(ps.expiresAt) >= now;
    });

    // Sort by skin priority desc (highest priority first)
    activeSkins.sort((a, b) => b.skin.priority - a.skin.priority);

    const skinsData = activeSkins.map(ps => ({
      id: ps.id,
      skinId: ps.skinId,
      skinType: ps.skin.type,
      displayName: ps.skin.displayName,
      description: ps.skin.description,
      icon: ps.skin.icon,
      colorClass: JSON.parse(ps.skin.colorClass),
      priority: ps.skin.priority,
      duration: ps.skin.duration,
      reason: ps.reason,
      expiresAt: ps.expiresAt,
      createdAt: ps.createdAt,
      donorBadgeCount: ps.skin.type === 'donor' ? account.donorBadgeCount : undefined,
    }));

    // If player has donor badges but no active donor skin, add virtual donor_badge entry
    if (account.donorBadgeCount > 0 && !skinsData.some(s => s.skinType === 'donor')) {
      skinsData.push({
        id: 'virtual-donor-badge',
        skinId: '',
        skinType: 'donor_badge',
        displayName: account.donorBadgeCount >= 5 ? 'Heart Badge ★' : 'Heart Badge',
        description: 'Permanent donor heart badge',
        icon: '❤️',
        colorClass: JSON.parse('{"frame":"#fb7185","name":"#fb7185|#ef4444|#f472b6","badge":"rgba(244,63,94,0.2)|#fda4af","border":"#f43f5e|#ef4444|#f472b6","glow":"rgba(244,63,94,0.35)"}'),
        priority: 0,
        duration: 'permanent',
        reason: `${account.donorBadgeCount}x donasi`,
        expiresAt: null,
        createdAt: new Date(),
        donorBadgeCount: account.donorBadgeCount,
      });
    }

    return NextResponse.json({
      accountId,
      gamertag: account.player.gamertag,
      name: account.player.name,
      count: skinsData.length,
      donorBadgeCount: account.donorBadgeCount,
      skins: skinsData,
    });
  } catch (error) {
    console.error('Get player skins error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player skins' },
      { status: 500 }
    );
  }
}
