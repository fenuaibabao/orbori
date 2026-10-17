import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * DELETE { confirm: 'DELETE' }: permanently delete the signed-in person's account.
 * Cancels any paid plan right away, removes their saved Visions images, then
 * deletes the account; everything tied to it in the database goes with it.
 */
export async function DELETE(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { confirm } = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (confirm !== 'DELETE') return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });

  try {
    // 1. Stop any billing first, so nobody is charged for an account that no longer exists.
    const { data: sub } = await admin.from('subscriptions').select('stripe_subscription_id, status').eq('user_id', user.id).maybeSingle();
    const s = stripe();
    if (s && sub?.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(sub.status ?? '')) {
      await s.subscriptions.cancel(sub.stripe_subscription_id).catch((e) => { if (e?.code !== 'resource_missing') throw e; });
    }
    // 2. Saved Vision images live in storage, outside the database.
    const { data: visions } = await admin.from('visions').select('path').eq('user_id', user.id);
    const paths = (visions ?? []).map((v) => v.path).filter(Boolean);
    for (let i = 0; i < paths.length; i += 100) await admin.storage.from('visions').remove(paths.slice(i, i + 100));
    // 3. The account itself. Everything linked to it is deleted with it.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[account delete]', e);
    return NextResponse.json({ error: 'Something went wrong deleting your account. Nothing was charged; please try again or write to hello@orbori.app.' }, { status: 500 });
  }
}
