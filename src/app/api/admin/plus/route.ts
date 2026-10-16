import { NextResponse } from 'next/server';
import { findUserByEmail, requireOwner } from '@/lib/admin';

export const runtime = 'nodejs';

/** Grant or revoke Plus for an account by email. Body: { email, grant: boolean }. */
export async function POST(req: Request) {
  const r = await requireOwner();
  if ('error' in r) return r.error;
  const { admin } = r;
  const { email, grant } = (await req.json().catch(() => ({}))) as { email?: string; grant?: boolean };
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });
  const user = await findUserByEmail(admin, email);
  if (!user) return NextResponse.json({ error: 'No account with that email.' }, { status: 404 });
  const { data: row } = await admin.from('subscriptions').select('status, plan').eq('user_id', user.id).maybeSingle();
  if (grant) {
    if (row && ['active', 'trialing'].includes(row.status) && row.plan !== 'gift') return NextResponse.json({ ok: true, note: 'Already a paying Plus member.' });
    const { error } = await admin.from('subscriptions').upsert({ user_id: user.id, status: 'active', plan: 'gift', current_period_end: null, cancel_at_period_end: false, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, note: `Plus granted to ${user.email}.` });
  }
  if (row && row.plan !== 'gift' && ['active', 'trialing'].includes(row.status)) return NextResponse.json({ error: 'That is a paying subscription; cancel it in Stripe instead.' }, { status: 400 });
  const { error } = await admin.from('subscriptions').upsert({ user_id: user.id, status: 'none', plan: null, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, note: `Plus removed from ${user.email}.` });
}
