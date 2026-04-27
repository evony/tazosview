import { requireAdmin } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/**
 * POST /api/cloudinary/upload
 *
 * Uploads an image to Cloudinary via server-side signed upload.
 * Accepts JSON body: { file: string (base64 data URI), folder?: string, publicId?: string }
 * Returns: { url: string, publicId: string, width: number, height: number, format: string }
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
    const { file, folder, publicId } = body as {
      file: string;
      folder?: string;
      publicId?: string;
    };

    if (!file) {
      return NextResponse.json({ error: 'File is required (base64 data URI)' }, { status: 400 });
    }

    // Validate it's a base64 data URI
    if (!file.startsWith('data:')) {
      return NextResponse.json({ error: 'File must be a base64 data URI' }, { status: 400 });
    }

    // Build Cloudinary Upload API parameters
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const uploadParams: Record<string, string> = {
      timestamp,
      file,
    };

    if (folder) {
      uploadParams.folder = folder;
    }
    if (publicId) {
      uploadParams.public_id = publicId;
    }

    // Generate signature (sorted params + API_SECRET)
    const sortedKeys = Object.keys(uploadParams)
      .filter(k => k !== 'file') // 'file' is not part of the signature
      .sort();
    const signatureString = sortedKeys.map(k => `${k}=${uploadParams[k]}`).join('&') + API_SECRET;

    const crypto = await import('crypto');
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    uploadParams.signature = signature;
    uploadParams.api_key = API_KEY;

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    for (const [key, value] of Object.entries(uploadParams)) {
      formData.append(key, value);
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[cloudinary/upload] Upload failed:', errorText);
      return NextResponse.json(
        { error: 'Upload ke Cloudinary gagal' },
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
    });
  } catch (error) {
    console.error('[cloudinary/upload] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
