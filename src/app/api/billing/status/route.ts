import { NextResponse } from 'next/server';
import { billingEnabled, fetchPrices, PRICES } from '@/lib/stripe';

export const runtime = 'nodejs';

/** Health check for the payments setup. Never returns keys, only whether they work. */
export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  const mode = key.startsWith('sk_live_') ? 'live' : key.startsWith('sk_test_') ? 'test' : key ? 'unknown' : 'missing';
  let prices: 'ok' | string = 'ok';
  if (billingEnabled) {
    try {
      const { stripe } = await import('@/lib/stripe');
      await Promise.all([PRICES.monthly, PRICES.yearly].map((id) => stripe()!.prices.retrieve(id)));
    } catch (e) { prices = (e as Error).message; }
  }
  return NextResponse.json({
    configured: billingEnabled, mode,
    priceIdsLookRight: /^price_\w+$/.test(PRICES.monthly) && /^price_\w+$/.test(PRICES.yearly),
    prices, webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET), displayPrices: (await fetchPrices())?.map((p) => `${p.plan}: ${p.amount} ${p.currency}/${p.interval}`) ?? null,
  });
}
