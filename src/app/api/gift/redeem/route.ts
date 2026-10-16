import { NextResponse } from 'next/server';
import { isPlusRow } from '@/lib/plus-status';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** POST { code } → seven days of Plus for the signed-in friend. */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const { data: g } = await admin.from('plus_gifts').select('code, from_user, redeemed_at, days').eq('code', code ?? '').maybeSingle();
  if (!g) return NextResponse.json({ error: 'That gift link isn\'t valid.' }, { status: 404 });
  if (g.redeemed_at) return NextResponse.json({ error: 'This gift has already been opened.' }, { status: 409 });
  if (g.from_user === user.id) return NextResponse.json({ error: 'This is your own gift. Send the link to a friend.' }, { status: 400 });
  const { data: sub } = await admin.from('subscriptions').select('status, plan, current_period_end').eq('user_id', user.id).maybeSingle();
  if (isPlusRow(sub)) return NextResponse.json({ error: 'You already have Plus, so pass this gift on to someone who doesn\'t.' }, { status: 409 });

  // Claim first so the same link can't be opened twice at once.
  const { data: took } = await admin.from('plus_gifts').update({ redeemed_by: user.id, redeemed_at: new Date().toISOString() }).eq('code', g.code).is('redeemed_at', null).select('code');
  if (!took?.length) return NextResponse.json({ error: 'This gift has already been opened.' }, { status: 409 });
  const end = new Date(Date.now() + (g.days ?? 7) * 86400000).toISOString();
  const { error } = await admin.from('subscriptions').upsert({ user_id: user.id, status: 'active', plan: 'gift', note: 'gift from a friend', current_period_end: end, cancel_at_period_end: true, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, until: end });
}
