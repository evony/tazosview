import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin user management - works with Admin model
export async function GET(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
      ];
    }

    const admins = await db.admin.findMany({
      where,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: admins,
    }, { headers });
  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { headers,  status: 500 }
    );
  }
}
