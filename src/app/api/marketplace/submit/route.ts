import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VALID_CATEGORIES = ['avatar', 'accessory', 'jasa_gb', 'jasa_joki', 'baju', 'item', 'lainnya'];

// POST /api/marketplace/submit — User submission (public, no auth required)
// Items are created with status "pending" and need admin approval
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerName, sellerWhatsapp, title, description, price, category, imageUrl } = body;

    // Validate required fields
    if (!sellerName || !title || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: 'sellerName, title, description, price, and category are required' },
        { status: 400 }
      );
    }

    // Validate strings length (prevent spam)
    if (sellerName.length > 50 || title.length > 100 || description.length > 500) {
      return NextResponse.json(
        { error: 'Text too long. Max: sellerName 50, title 100, description 500 characters' },
        { status: 400 }
      );
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate price is a non-negative integer
    if (typeof price !== 'number' || price < 0 || !Number.isInteger(price)) {
      return NextResponse.json(
        { error: 'Price must be a non-negative integer' },
        { status: 400 }
      );
    }

    // Rate limiting: max 3 pending submissions per sellerName per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubmissions = await db.marketplaceItem.count({
      where: {
        sellerName,
        status: 'pending',
        createdAt: { gte: oneDayAgo },
      },
    });

    if (recentSubmissions >= 3) {
      return NextResponse.json(
        { error: 'Kamu sudah mengajukan 3 iklan hari ini. Tunggu approval dari admin terlebih dahulu.' },
        { status: 429 }
      );
    }

    const item = await db.marketplaceItem.create({
      data: {
        sellerName,
        sellerAvatar: null,
        sellerWhatsapp: sellerWhatsapp || null,
        title,
        description,
        price,
        category,
        imageUrl: imageUrl || null,
        isPremium: false, // User submissions cannot be premium
        status: 'pending', // Requires admin approval
      },
    });

    return NextResponse.json({
      item,
      message: 'Iklan berhasil diajukan! Menunggu approval admin sebelum ditampilkan.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting marketplace item:', error);
    return NextResponse.json(
      { error: 'Failed to submit marketplace item' },
      { status: 500 }
    );
  }
}
