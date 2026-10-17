import { NextResponse } from 'next/server';
import { skyFor } from '@/lib/constellation-server';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** GET ?date=&tz= → tonight's live Constellation for the signed-in person. */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const date = q.get('date') ?? '';
  const tz = q.get('tz') ?? 'UTC';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || tz.length > 64) return NextResponse.json({ error: 'Bad date.' }, { status: 400 });
  try {
    const sky = await skyFor(admin, user.id, date, tz);
    if (!sky) return NextResponse.json({ error: 'nochart' }, { status: 409 });
    return NextResponse.json(sky);
  } catch (e) {
    console.error('[constellation]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** POST { name } → name (or rename) your constellation. */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 });
  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  const clean = String(name ?? '').replace(/[^\p{L}\p{N} .,'’&!-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 32);
  if (!clean) await admin.from('constellations').delete().eq('user_id', user.id);
  else await admin.from('constellations').upsert({ user_id: user.id, name: clean, updated_at: new Date().toISOString() });
  return NextResponse.json({ ok: true, name: clean || null });
}
