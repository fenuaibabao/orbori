import { NextResponse } from 'next/server';
import { BETA } from '@/lib/beta';
import { PACKS } from '@/lib/credits';
import { isOwnerEmail } from '@/lib/owner';
import { siteUrl, stripe } from '@/lib/stripe';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** POST { pack } → a one-time Stripe Checkout for a pack of vision credits. */
export async function POST(req: Request) {
  const s = stripe();
  const admin = supabaseAdmin();
  if (!s || !admin) return NextResponse.json({ error: 'Payments are not set up yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  if (BETA && !isOwnerEmail(user.email)) return NextResponse.json({ error: 'Credit packs open after the beta.' }, { status: 403 });
  const { pack } = (await req.json().catch(() => ({}))) as { pack?: string };
  const p = PACKS.find((x) => x.id === pack);
  if (!p) return NextResponse.json({ error: 'Pick a pack.' }, { status: 400 });

  const { data: row } = await admin.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
  const session = await s.checkout.sessions.create({
    mode: 'payment',
    ...(row?.stripe_customer_id ? { customer: row.stripe_customer_id } : { customer_email: user.email ?? undefined }),
    client_reference_id: user.id,
    line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: p.cents, product_data: { name: `Orbori Visions: ${p.credits} credits`, description: 'One credit makes one Cosmic Vision. Credits never expire.' } } }],
    metadata: { user_id: user.id, credits: String(p.credits), kind: 'vision-credits' },
    payment_intent_data: { metadata: { user_id: user.id, credits: String(p.credits) } },
    success_url: `${siteUrl(req)}/visions?credits=1`,
    cancel_url: `${siteUrl(req)}/visions`,
  });
  return NextResponse.json({ url: session.url });
}
