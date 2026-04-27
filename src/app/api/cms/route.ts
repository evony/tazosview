import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await db.cmsSetting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error('CMS settings error:', error);
    return NextResponse.json({ settings: {} });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      if (!item.key) continue;
      await db.cmsSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CMS settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
