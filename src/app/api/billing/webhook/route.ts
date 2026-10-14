import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/server';
import { planFromPrice, stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

/** Stripe tells us here whenever a subscription starts, renews, changes or ends. */
export async function POST(req: Request) {
  const s = stripe();
  const admin = supabaseAdmin();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !admin || !secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const sig = req.headers.get('stripe-signature') ?? '';
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }

  const apply = async (sub: Stripe.Subscription) => {
    const userId = sub.metadata.user_id;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const item = sub.items.data[0];
    const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null;
    const row = {
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      plan: planFromPrice(item?.price.id, item?.price.recurring?.interval),
      current_period_end: periodEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    };
    if (userId) {
      const { error } = await admin.from('subscriptions').upsert({ user_id: userId, ...row });
      if (error) throw error;
    } else {
      const { error } = await admin.from('subscriptions').update(row).eq('stripe_customer_id', customerId);
      if (error) throw error;
    }
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await s.subscriptions.retrieve(typeof session.subscription === 'string' ? session.subscription : session.subscription.id);
          if (!sub.metadata.user_id && session.client_reference_id) sub.metadata.user_id = session.client_reference_id;
          await apply(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await apply(event.data.object);
        break;
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
