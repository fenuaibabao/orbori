'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { goToBilling, usePlus } from '@/lib/plus';
import type { PriceInfo } from '@/lib/stripe';

const FREE = ['Daily Cosmic Council and Convergence Score', 'Your placements across all seven traditions', 'Chart Rarity, streaks, badges and levels', 'Compatibility and invites'];
const PLUS = ['Everything in Free', 'All seven traditions in depth: houses, aspects, Dasha timeline, Four Pillars, Mayan cross, moon nights, lunar mansions', 'Personal year, name numbers and the Navamsa', 'Your daily AI reading, written from all seven voices', 'Cosmic Visions: 3 a day, up to 20 a month (10 in a Founding year)'];

const money = (p: PriceInfo) => new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency, minimumFractionDigits: p.amount % 1 ? 2 : 0 }).format(p.amount);

type Founding = { left: number; total: number } | null;

export function Pricing({ prices, beta, founding }: { prices: PriceInfo[] | null; beta: boolean; founding: Founding }) {
  return <Suspense fallback={<div className="min-h-dvh" />}><Inner prices={prices} beta={beta} founding={founding} /></Suspense>;
}

function Inner({ prices, beta, founding }: { prices: PriceInfo[] | null; beta: boolean; founding: Founding }) {
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
    if (beta) return <button type="button" disabled className={cls}>Opens after the beta</button>;
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

      {beta && !plus.plus && (
        <div className="rounded-[22px] border border-gold bg-night p-5 text-sm text-muted">
          <p className="font-display text-lg font-bold text-starlight">Orbori is in beta.</p>
          Plus is free for testers right now. If someone sent you a tester link, open it and sign in; Plus switches on automatically. Paid plans open after the beta.
        </div>
      )}
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

      {founding && founding.left > 0 && yearly && !plus.plus && (
        <section aria-labelledby="founding" className="flex flex-col gap-3 rounded-[22px] border border-gold bg-royal/30 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="founding" className="font-display text-xl font-bold">The Founding 111</h2>
            <span className="font-mono text-sm font-bold text-gold-lite">{founding.left} of {founding.total} spots left</span>
          </div>
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${((founding.total - founding.left) / founding.total) * 100}%` }} /></div>
          <p className="text-sm text-muted">
            The first {founding.total} people to go yearly get their first year for <strong className="text-starlight">{new Intl.NumberFormat('en-US', { style: 'currency', currency: yearly.currency }).format(Math.floor(yearly.amount * 50) / 100)}</strong> instead of {money(yearly)}, and a <strong className="text-starlight">Founding Member</strong> badge that stays on your profile forever. Renews at {money(yearly)} a year after that; cancel any time.
          </p>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card name="Free" price="$0" sub="forever" features={FREE} cta={<Link href="/today" className="flex h-12 w-full items-center justify-center rounded-full border border-royal px-5 font-bold text-starlight">You have this</Link>} />
        <Card name="Plus Monthly" price={monthly ? money(monthly) : '—'} sub="per month" features={PLUS}
          cta={plus.plus ? null : cta('monthly', 'Go monthly', false)} />
        {founding && founding.left > 0 && yearly ? (
          <Card name="Plus Yearly" highlight badge={`FOUNDING 111 · ${founding.left} LEFT`}
            price={new Intl.NumberFormat('en-US', { style: 'currency', currency: yearly.currency }).format(Math.floor(yearly.amount * 50) / 100)}
            sub={`first year (was ${money(yearly)}), then ${money(yearly)} a year`} features={[...PLUS, 'Founding Member badge, forever']}
            cta={plus.plus ? null : cta('yearly', 'Claim a founding spot', true)} />
        ) : (
          <Card name="Plus Yearly" highlight badge={saves ? `BEST VALUE · SAVE ${saves}%` : 'BEST VALUE'}
            price={perMonth && yearly ? new Intl.NumberFormat('en-US', { style: 'currency', currency: yearly.currency }).format(perMonth) : '—'}
            sub={yearly ? `per month, billed ${money(yearly)} a year` : 'per month, billed yearly'} features={PLUS}
            cta={plus.plus ? null : cta('yearly', 'Go yearly', true)} />
        )}
      </div>
      {error && <p role="alert" className="text-sm text-mauve-lite">{error}</p>}
      <p className="text-xs text-dim">Cancel any time from your Profile. Prices in US dollars. Orbori is entertainment, not destiny. By subscribing you agree to the <Link href="/legal/terms" className="text-gold-lite">terms</Link>. A share of Plus revenue goes to the communities behind these traditions: <Link href="/legal/commitments" className="text-gold-lite">our commitments</Link>.</p>
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
