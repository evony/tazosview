import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/version
 *
 * Returns a version hash based on the latest database change timestamp.
 * The client polls this endpoint to detect when the server data has been updated
 * (e.g., admin updated banners, avatars, scores, etc.) and forces a cache refresh.
 *
 * Uses Cache-Control: no-store to prevent browser/CDN caching.
 */
export async function GET() {
  try {
    // Get the most recent update timestamp across key tables
    const [latestPlayer, latestTournament, latestCms, latestMarketplace] = await Promise.all([
      db.player.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      db.tournament.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      db.cmsSection.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      db.marketplaceItem.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);

    // Combine timestamps into a simple version string
    const timestamps = [
      latestPlayer?.updatedAt?.getTime() ?? 0,
      latestTournament?.updatedAt?.getTime() ?? 0,
      latestCms?.updatedAt?.getTime() ?? 0,
      latestMarketplace?.updatedAt?.getTime() ?? 0,
    ].join('-');

    return NextResponse.json(
      { version: timestamps },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch {
    // Fallback: use current time so client always gets a response
    return NextResponse.json(
      { version: Date.now().toString() },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}
