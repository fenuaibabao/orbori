import { NextResponse } from 'next/server';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';
import { PRICES, siteUrl, stripe, type Plan } from '@/lib/stripe';

export const runtime = 'nodejs';

/** Starts a Stripe Checkout for Orbori Plus. Body: { plan: 'monthly' | 'yearly' }. */
export async function POST(req: Request) {
  const s = stripe();
  const admin = supabaseAdmin();
  if (!s || !admin) return NextResponse.json({ error: 'Payments are not set up yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: Plan };
  if (plan !== 'monthly' && plan !== 'yearly') return NextResponse.json({ error: 'Pick a plan.' }, { status: 400 });

  // One Stripe customer per account, remembered in the subscriptions row.
  const { data: row } = await admin.from('subscriptions').select('stripe_customer_id, status').eq('user_id', user.id).maybeSingle();
  if (row?.status === 'active' || row?.status === 'trialing') return NextResponse.json({ error: 'You already have Plus.' }, { status: 400 });
  let customerId = row?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const c = await s.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
    customerId = c.id;
    await admin.from('subscriptions').upsert({ user_id: user.id, stripe_customer_id: customerId, status: row?.status ?? 'none' });
  }

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: PRICES[plan], quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${siteUrl()}/plus?welcome=1`,
    cancel_url: `${siteUrl()}/plus`,
  });
  return NextResponse.json({ url: session.url });
}
