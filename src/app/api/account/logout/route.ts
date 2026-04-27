import { NextResponse } from 'next/server';

const PLAYER_SESSION_COOKIE = 'idm-player-session';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(PLAYER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
