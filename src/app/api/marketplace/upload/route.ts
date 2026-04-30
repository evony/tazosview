import { requirePlayer } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_UPLOADS_PER_DAY = 20;

// In-memory rate limit tracking
const uploadCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(playerId: string): boolean {
  const now = Date.now();
  const entry = uploadCounts.get(playerId);
  if (!entry || now > entry.resetAt) {
    uploadCounts.set(playerId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= MAX_UPLOADS_PER_DAY) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Authenticate as player (not admin)
  const authResult = await requirePlayer(request);
  if (authResult instanceof NextResponse) return authResult;

  const { playerId } = authResult;

  // Check rate limit
  if (!checkRateLimit(playerId)) {
    return NextResponse.json(
      { error: 'Upload rate limit exceeded — maximum 20 uploads per day' },
      { status: 429 }
    );
  }

  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { file } = body;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Invalid file format — must be base64 data URI' },
        { status: 400 }
      );
    }

    // Validate MIME type — only images allowed
    const mimeMatch = file.match(/^data:([^;]+);/);
    if (!mimeMatch) {
      return NextResponse.json(
        { error: 'Invalid data URI format' },
        { status: 400 }
      );
    }

    const mimeType = mimeMatch[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid file type "${mimeType}" — only image files are allowed` },
        { status: 400 }
      );
    }

    const base64Data = file.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Invalid base64 data' },
        { status: 400 }
      );
    }

    // Check file size (5MB limit for players)
    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    if (sizeInBytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Force marketplace folder and generate unique public ID
    const folder = 'marketplace';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const publicId = `${folder}/${playerId}_${timestamp}_${random}`;

    // Build Cloudinary signature
    const cloudinaryTimestamp = Math.floor(Date.now() / 1000).toString();
    const signatureParams: Record<string, string> = {
      folder,
      public_id: publicId,
      timestamp: cloudinaryTimestamp,
    };

    const crypto = await import('crypto');
    const sortedKeys = Object.keys(signatureParams).sort();
    const signatureString =
      sortedKeys.map(key => `${key}=${signatureParams[key]}`).join('&') +
      API_SECRET;
    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex');

    // Upload to Cloudinary via REST API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', API_KEY!);
    formData.append('timestamp', cloudinaryTimestamp);
    formData.append('folder', folder);
    formData.append('public_id', publicId);
    formData.append('signature', signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cloudinary upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload to Cloudinary', details: error },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error('Marketplace upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
