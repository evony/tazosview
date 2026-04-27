import { getSession } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return Response.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
