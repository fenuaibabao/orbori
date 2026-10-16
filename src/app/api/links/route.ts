import { NextResponse } from 'next/server';
import { linkSummaries } from '@/lib/links';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** GET /api/links?date=YYYY-MM-DD&tz=Zone: the signed-in person's linked partners. */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const url = new URL(req.url);
  const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const tz = url.searchParams.get('tz') ?? 'UTC';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || tz.length > 64) return NextResponse.json({ error: 'Bad date.' }, { status: 400 });
  try {
    return NextResponse.json({ links: await linkSummaries(admin, user.id, date, tz) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** DELETE /api/links { id }: unlink (either side can). */
export async function DELETE(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: 'Which link?' }, { status: 400 });
  const { error } = await admin.from('links').delete().eq('id', id).or(`a.eq.${user.id},b.eq.${user.id}`);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
