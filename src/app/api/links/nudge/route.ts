import { NextResponse } from 'next/server';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** Send today's nudge to a linked partner. Body: { to, date }. One per partner per day. */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { to, date } = (await req.json().catch(() => ({}))) as { to?: string; date?: string };
  if (!to || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  const [a, b] = [user.id, to].sort();
  const { data: link } = await admin.from('links').select('id').eq('a', a).eq('b', b).maybeSingle();
  if (!link) return NextResponse.json({ error: 'You are not linked with that person.' }, { status: 403 });
  const { error } = await admin.from('nudges').upsert({ from_user: user.id, to_user: to, date }, { onConflict: 'from_user,to_user,date', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
