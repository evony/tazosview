import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

const VALID_CATEGORIES = ['avatar', 'accessory', 'jasa_gb', 'jasa_joki', 'baju', 'item', 'lainnya'];

// GET /api/marketplace — List marketplace items (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { isActive: true };

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await db.marketplaceItem.findMany({
      where,
      orderBy: [
        { isPremium: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching marketplace items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace items' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace — Create a marketplace item (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { sellerName, sellerAvatar, sellerWhatsapp, title, description, price, category, imageUrl, isPremium } = body;

    // Validate required fields
    if (!sellerName || !title || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: 'sellerName, title, description, price, and category are required' },
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

    const item = await db.marketplaceItem.create({
      data: {
        sellerName,
        sellerAvatar: sellerAvatar || null,
        sellerWhatsapp: sellerWhatsapp || null,
        title,
        description,
        price,
        category,
        imageUrl: imageUrl || null,
        isPremium: isPremium ?? false,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating marketplace item:', error);
    return NextResponse.json(
      { error: 'Failed to create marketplace item' },
      { status: 500 }
    );
  }
}
