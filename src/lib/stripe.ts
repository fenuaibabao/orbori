import 'server-only';
import Stripe from 'stripe';

export const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? '',
  yearly: process.env.STRIPE_PRICE_YEARLY ?? '',
};
export type Plan = keyof typeof PRICES;

/** Payments switch on once the Stripe keys and the two price IDs are set in Vercel. */
export const billingEnabled = Boolean(process.env.STRIPE_SECRET_KEY && PRICES.monthly && PRICES.yearly);

let client: Stripe | null = null;
export function stripe(): Stripe | null {
  if (!billingEnabled) return null;
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'https://orbori.vercel.app';

export function planFromPrice(priceId: string | undefined, interval?: string | null): Plan {
  if (priceId === PRICES.yearly) return 'yearly';
  if (priceId === PRICES.monthly) return 'monthly';
  return interval === 'year' ? 'yearly' : 'monthly';
}

export interface PriceInfo { plan: Plan; amount: number; currency: string; interval: 'month' | 'year' }

/** Live prices for the pricing page; null when billing isn't configured. */
export async function fetchPrices(): Promise<PriceInfo[] | null> {
  const s = stripe();
  if (!s) return null;
  try {
    const list = await Promise.all((['monthly', 'yearly'] as Plan[]).map(async (plan) => {
      const p = await s.prices.retrieve(PRICES[plan]);
      return { plan, amount: (p.unit_amount ?? 0) / 100, currency: p.currency.toUpperCase(), interval: (p.recurring?.interval ?? 'month') as 'month' | 'year' };
    }));
    return list;
  } catch {
    return null;
  }
}
