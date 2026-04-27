import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';

// GET /api/whatsapp/commands - List WhatsApp commands
export async function GET(request: NextRequest) {
  try {
    const commands = await db.whatsAppCommand.findMany({
      orderBy: { command: 'asc' }
    });

    return Response.json({
      success: true,
      data: commands
    });
  } catch (error) {
    console.error('Get WhatsApp commands error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/whatsapp/commands - Update command
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
    const { id, response, isActive, minRole } = body;

    const command = await db.whatsAppCommand.update({
      where: { id },
      data: {
        response,
        isActive,
        minRole: minRole as UserRole
      }
    });

    return Response.json({
      success: true,
      data: command
    });
  } catch (error) {
    console.error('Update WhatsApp command error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
