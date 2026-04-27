import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { BotStatus } from '@prisma/client';

// GET /api/whatsapp/bot - Get bot status
export async function GET(request: NextRequest) {
  try {
    const bot = await db.whatsAppBot.findFirst();

    if (!bot) {
      return Response.json({
        success: false,
        error: 'Bot not configured'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: {
        id: bot.id,
        name: bot.name,
        status: bot.status,
        lastConnectedAt: bot.lastConnectedAt,
        messagesSent: bot.messagesSent,
        messagesReceived: bot.messagesReceived,
        autoReply: bot.autoReply
      }
    });
  } catch (error) {
    console.error('Get WhatsApp bot status error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/whatsapp/bot - Update bot settings
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getSession(request);
    
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return Response.json(
        { success: false, error: 'Forbidden: Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { autoReply, welcomeMessage, status } = body;

    const bot = await db.whatsAppBot.findFirst();
    if (!bot) {
      return Response.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }

    const updated = await db.whatsAppBot.update({
      where: { id: bot.id },
      data: {
        autoReply,
        welcomeMessage,
        status: status as BotStatus
      }
    });

    return Response.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update WhatsApp bot error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
