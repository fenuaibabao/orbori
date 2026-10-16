import { NextResponse } from 'next/server';
import { isPlusRow } from '@/lib/plus-status';
import { LEVELS } from '@/lib/progress';
import { REWARDS } from '@/lib/rewards';
import { serverProgress } from '@/lib/server-progress';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const today = () => new Date().toISOString().slice(0, 10);

/** POST { reward: 'plus-month' } → grants 30 days of Plus to an Oracle (checked on the server). */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to claim rewards.' }, { status: 401 });
  const { reward } = (await req.json().catch(() => ({}))) as { reward?: string };
  if (reward !== 'plus-month') return NextResponse.json({ error: 'That reward has nothing to claim.' }, { status: 400 });

  const need = REWARDS.find((r) => r.id === reward)!.level;
  const p = await serverProgress(admin, user.id, today());
  if (p.levelIndex < need) return NextResponse.json({ error: `Reach ${LEVELS[need].name} to claim this. Your account shows ${p.xp} XP.` }, { status: 403 });

  const { data: claimed } = await admin.from('reward_claims').select('reward').eq('user_id', user.id).eq('reward', reward).maybeSingle();
  if (claimed) return NextResponse.json({ error: 'Already claimed.' }, { status: 409 });

  const { data: sub } = await admin.from('subscriptions').select('status, plan, current_period_end').eq('user_id', user.id).maybeSingle();
  if (isPlusRow(sub)) return NextResponse.json({ error: 'You already have Plus. Save this for later: it starts the day you claim it.' }, { status: 409 });

  const end = new Date(Date.now() + 30 * 86400000).toISOString();
  const { error } = await admin.from('subscriptions').upsert({ user_id: user.id, status: 'active', plan: 'gift', note: 'Oracle reward', current_period_end: end, cancel_at_period_end: true, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from('reward_claims').insert({ user_id: user.id, reward });
  return NextResponse.json({ ok: true, until: end });
}
