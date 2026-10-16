import { NextResponse } from 'next/server';
import { betaCode } from '@/lib/beta';
import { isPlusRow } from '@/lib/plus-status';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** Join the beta: { code } → Plus (gift) for the signed-in account. */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (code !== betaCode()) return NextResponse.json({ error: 'That tester link isn\'t valid.' }, { status: 400 });
  const { data: row } = await admin.from('subscriptions').select('status, plan, current_period_end').eq('user_id', user.id).maybeSingle();
  if (isPlusRow(row) && !(row?.plan === 'gift' && row?.current_period_end)) return NextResponse.json({ ok: true, already: true });
  const { error } = await admin.from('subscriptions').upsert({ user_id: user.id, status: 'active', plan: 'gift', note: 'beta tester', current_period_end: null, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
