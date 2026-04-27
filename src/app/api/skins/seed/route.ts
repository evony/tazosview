import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { DEFAULT_SKIN_COLORS } from '@/lib/skin-utils';

// Default skin definitions — colorClass uses CSS color strings (not Tailwind classes)
// because the renderer uses inline styles. See skin-utils.ts for the color format spec.
const DEFAULT_SKINS = [
  {
    type: 'champion',
    displayName: 'Gold Crown',
    description: 'Skin juara tournament mingguan — berlaku selama 1 minggu setelah menang',
    icon: '🥇',
    colorClass: JSON.stringify(DEFAULT_SKIN_COLORS.champion),
    priority: 4,
    duration: 'weekly',
    isActive: true,
  },
  {
    type: 'mvp',
    displayName: 'Platinum Star',
    description: 'Skin MVP tournament mingguan — berlaku selama 1 minggu setelah mendapat MVP',
    icon: '⭐',
    colorClass: JSON.stringify(DEFAULT_SKIN_COLORS.mvp),
    priority: 3,
    duration: 'weekly',
    isActive: true,
  },
  {
    type: 'host',
    displayName: 'Emerald Luxury',
    description: 'Skin penyelenggara/penyawer tournament — berlaku selama 1 minggu',
    icon: '💎',
    colorClass: JSON.stringify(DEFAULT_SKIN_COLORS.host),
    priority: 2,
    duration: 'weekly',
    isActive: true,
  },
  {
    type: 'donor',
    displayName: 'Maroon Heart',
    description: 'Skin donatur — berlaku 1 minggu, badge hati ❤️ tetap permanen setelah expire',
    icon: '❤️',
    colorClass: JSON.stringify(DEFAULT_SKIN_COLORS.donor),
    priority: 1,
    duration: 'weekly',
    isActive: true,
  },
];

/**
 * POST /api/skins/seed
 * Seed the 4 default skins (admin auth required)
 * Uses upsert to avoid duplicates
 */
export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const results: Awaited<ReturnType<typeof db.skin.upsert>>[] = [];

    for (const skinData of DEFAULT_SKINS) {
      const skin = await db.skin.upsert({
        where: { type: skinData.type },
        update: {
          displayName: skinData.displayName,
          description: skinData.description,
          icon: skinData.icon,
          colorClass: skinData.colorClass,
          priority: skinData.priority,
          duration: skinData.duration,
          isActive: skinData.isActive,
        },
        create: skinData,
      });
      results.push(skin);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.length} skins`,
      skins: results.map(s => ({
        id: s.id,
        type: s.type,
        displayName: s.displayName,
        icon: s.icon,
        priority: s.priority,
        duration: s.duration,
      })),
    });
  } catch (error) {
    console.error('Skin seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed skins' },
      { status: 500 }
    );
  }
}
