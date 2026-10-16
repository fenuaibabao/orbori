import { NextResponse } from 'next/server';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';
import { siteUrl, stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

/** Opens Stripe's billing portal, where people change or cancel their plan and update their card. */
export async function POST(req: Request) {
  const s = stripe();
  const admin = supabaseAdmin();
  if (!s || !admin) return NextResponse.json({ error: 'Payments are not set up yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { data: row } = await admin.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
  if (!row?.stripe_customer_id) return NextResponse.json({ error: 'No billing on this account yet.' }, { status: 400 });
  const portal = await s.billingPortal.sessions.create({ customer: row.stripe_customer_id, return_url: `${siteUrl(req)}/profile` });
  return NextResponse.json({ url: portal.url });
}
