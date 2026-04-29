// @ts-nocheck
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextRequest } from 'next/server';

// GET /api/whatsapp/logs - Get bot logs
export async function GET(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const currentUser = await getSession(request);
    
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(currentUser.role)) {
      return Response.json(
        { success: false, error: 'Forbidden' },
        { headers,  status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs = await db.whatsAppLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return Response.json({
      success: true,
      data: logs
    }, { headers });
  } catch (error) {
    console.error('Get WhatsApp logs error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { headers,  status: 500 }
    );
  }
}
