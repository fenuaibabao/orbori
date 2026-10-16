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

const ALLOWED_ORIGINS = ['https://www.orbori.app', 'https://orbori.app', 'https://orbori.vercel.app'];
/** Where to send people back after Stripe: the address they came from if it's ours, else the main one. */
export const siteUrl = (req?: Request) => {
  const origin = req?.headers.get('origin') ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('vercel.app') ? process.env.NEXT_PUBLIC_SITE_URL : 'https://www.orbori.app';
};

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
  } catch (e) {
    console.error('Stripe prices could not be loaded:', (e as Error).message);
    return null;
  }
}
