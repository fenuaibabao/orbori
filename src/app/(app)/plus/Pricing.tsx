'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { goToBilling, usePlus } from '@/lib/plus';
import type { PriceInfo } from '@/lib/stripe';

const FREE = ['Daily Cosmic Council and Convergence Score', 'Your Big Three across all five systems', 'Chart Rarity, streaks, badges and levels', 'Compatibility and invites'];
const PLUS = ['Everything in Free', 'All five systems in depth: houses, aspects, Dasha timeline, Four Pillars, Mayan cross', 'Personal year, name numbers and the Navamsa', 'Streak Shields (coming soon)', 'Early access to AI readings and The Cosmos'];

const money = (p: PriceInfo) => new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency, minimumFractionDigits: p.amount % 1 ? 2 : 0 }).format(p.amount);

export function Pricing({ prices }: { prices: PriceInfo[] | null }) {
  return <Suspense fallback={<div className="min-h-dvh" />}><Inner prices={prices} /></Suspense>;
}

function Inner({ prices }: { prices: PriceInfo[] | null }) {
  const { user } = useAuth();
  const plus = usePlus();
  const params = useSearchParams();
  const welcome = params.get('welcome') === '1';
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Right after checkout, Stripe's webhook may land a beat later than the person does.
  useEffect(() => {
    if (!welcome || plus.plus) return;
    let n = 0;
    const t = setInterval(() => { plus.refresh(); if (++n >= 10) clearInterval(t); }, 1500);
    return () => clearInterval(t);
  }, [welcome, plus.plus, plus.refresh, plus]);

  const monthly = prices?.find((p) => p.plan === 'monthly') ?? null;
  const yearly = prices?.find((p) => p.plan === 'yearly') ?? null;
  const perMonth = yearly ? yearly.amount / 12 : null;
  const saves = monthly && yearly ? Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100) : null;

  const choose = async (plan: 'monthly' | 'yearly') => {
    setError(null);
    setBusy(plan);
    const e = await goToBilling('/api/billing/checkout', { plan });
    if (e) { setError(e); setBusy(null); }
  };

  const cta = (plan: 'monthly' | 'yearly', label: string, primary: boolean) => {
    const cls = `flex h-12 w-full items-center justify-center rounded-full px-5 font-bold disabled:opacity-50 ${primary ? 'bg-gold text-space hover:bg-gold-lite' : 'border border-royal text-starlight hover:border-gold-lite'}`;
    if (!user) return <Link href={`/signin?next=${encodeURIComponent('/plus')}`} className={cls}>Sign in to continue</Link>;
    if (!prices) return <button type="button" disabled className={cls}>Coming soon</button>;
    return <button type="button" disabled={busy !== null} onClick={() => choose(plan)} className={cls}>{busy === plan ? 'Opening checkout…' : label}</button>;
  };

  return (
    <div className="flex flex-col gap-6 lg:max-w-3xl">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[11px] tracking-[0.12em] text-gold-lite">ORBORI PLUS</p>
        <h1 className="font-display text-[28px] font-bold leading-tight">Hear the whole council.</h1>
        <p className="text-[15px] text-muted">The daily reading stays free forever. Plus opens every system in depth.</p>
      </header>

      {welcome && plus.plus && (
        <div role="status" className="rounded-[22px] border border-gold bg-night p-5">
          <p className="font-display text-lg font-bold text-gold-lite">Welcome to Plus.</p>
          <p className="mt-1 text-sm text-muted">Every deeper page is open now. <Link href="/chart" className="text-gold-lite">Go to your chart →</Link></p>
        </div>
      )}
      {welcome && !plus.plus && <p role="status" className="text-sm text-muted">Confirming your payment…</p>}

      {plus.plus && !welcome && (
        <div className="rounded-[22px] border border-royal bg-night p-5 text-sm text-muted">
          You&apos;re on Plus{plus.plan ? ` (${plus.plan})` : ''}.{plus.cancelAtPeriodEnd && plus.periodEnd ? ` It ends ${new Date(plus.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.` : ''}{' '}
          <Link href="/profile" className="text-gold-lite">Manage in Profile →</Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card name="Free" price="$0" sub="forever" features={FREE} cta={<Link href="/today" className="flex h-12 w-full items-center justify-center rounded-full border border-royal px-5 font-bold text-starlight">You have this</Link>} />
        <Card name="Plus Monthly" price={monthly ? money(monthly) : '—'} sub="per month" features={PLUS}
          cta={plus.plus ? null : cta('monthly', 'Go monthly', false)} />
        <Card name="Plus Yearly" highlight badge={saves ? `BEST VALUE · SAVE ${saves}%` : 'BEST VALUE'}
          price={perMonth && yearly ? new Intl.NumberFormat('en-US', { style: 'currency', currency: yearly.currency }).format(perMonth) : '—'}
          sub={yearly ? `per month, billed ${money(yearly)} a year` : 'per month, billed yearly'} features={PLUS}
          cta={plus.plus ? null : cta('yearly', 'Go yearly', true)} />
      </div>
      {error && <p role="alert" className="text-sm text-mauve-lite">{error}</p>}
      <p className="text-xs text-dim">Cancel any time from your Profile. Prices in US dollars. Orbori is entertainment, not destiny.</p>
    </div>
  );
}

function Card({ name, price, sub, features, cta, highlight, badge }: { name: string; price: string; sub: string; features: string[]; cta: React.ReactNode; highlight?: boolean; badge?: string }) {
  return (
    <section aria-label={name} className={`relative flex flex-col gap-4 rounded-[22px] border p-5 ${highlight ? 'border-gold bg-night' : 'border-line bg-deep'}`}>
      {badge && <span className="absolute -top-3 left-5 rounded-full bg-gold px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.08em] text-space">{badge}</span>}
      <div>
        <h2 className="font-display text-lg font-bold">{name}</h2>
        <p className="mt-1"><span className="font-display text-[32px] font-extrabold text-gold-lite">{price}</span> <span className="text-xs text-muted">{sub}</span></p>
      </div>
      <ul className="flex flex-1 flex-col gap-2 text-sm text-muted">
        {features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden="true" className="text-gold-lite">✦</span>{f}</li>)}
      </ul>
      {cta}
    </section>
  );
}
