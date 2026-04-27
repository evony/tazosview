import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gamertag, password, email, phone } = body;

    if (!gamertag || !password) {
      return NextResponse.json(
        { error: 'Gamertag dan password harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Find the player by gamertag
    const player = await db.player.findUnique({
      where: { gamertag },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Gamertag tidak ditemukan. Pastikan kamu sudah terdaftar sebagai pemain.' },
        { status: 404 }
      );
    }

    // Check if player already has an account
    const existingAccount = await db.account.findUnique({
      where: { playerId: player.id },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Pemain ini sudah memiliki akun. Silakan login.' },
        { status: 409 }
      );
    }

    // Check if username (gamertag) is taken as account username
    const existingUsername = await db.account.findUnique({
      where: { username: gamertag },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username sudah digunakan. Hubungi admin.' },
        { status: 409 }
      );
    }

    // Check email uniqueness if provided
    if (email) {
      const existingEmail = await db.account.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar.' },
          { status: 409 }
        );
      }
    }

    // Create the account
    const passwordHash = await hashPassword(password);
    const account = await db.account.create({
      data: {
        playerId: player.id,
        username: gamertag,
        passwordHash,
        email: email || null,
        phone: phone || player.phone || null,
      },
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

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat!',
      account: {
        id: account.id,
        username: account.username,
        skins: [], // New accounts have no skins
        player: account.player,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Account registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
