import { requireAdmin } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/**
 * POST /api/cloudinary/upload
 *
 * Uploads an image to Cloudinary using the Admin API (unsigned upload via base64).
 * Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET env vars.
 *
 * Body:
 *   - file: string (base64 data URI, e.g. "data:image/png;base64,...")
 *   - folder?: string (target folder, e.g. "avatars", "clubs", "club-banners")
 *   - publicId?: string (custom public ID for the image)
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { file, folder = 'general', publicId } = body;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file is a base64 data URI
    if (!file.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid file format — must be base64 data URI' }, { status: 400 });
    }

    // Validate file size (base64 is ~33% larger than binary, so 10MB file = ~13.3MB base64)
    const base64Data = file.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid base64 data' }, { status: 400 });
    }

    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (sizeInBytes > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Build upload parameters
    const uploadParams: Record<string, string> = {
      file,
      folder,
      api_key: API_KEY,
      timestamp: Math.floor(Date.now() / 1000).toString(),
    };

    if (publicId) {
      uploadParams.public_id = publicId;
    }

    // Generate signature
    // Cloudinary signature = SHA1(sorted_params + api_secret)
    const crypto = await import('crypto');
    const sortedKeys = Object.keys(uploadParams).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${uploadParams[key]}`)
      .join('&') + API_SECRET;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    uploadParams.signature = signature;

    // Upload to Cloudinary using their upload API
    const formData = new FormData();
    for (const [key, value] of Object.entries(uploadParams)) {
      formData.append(key, value);
    }

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
      bytes: result.bytes,
      created_at: result.created_at,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
