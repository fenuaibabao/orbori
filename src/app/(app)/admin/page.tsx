'use client';
import { QuestionReview } from '@/components/QuestionReview';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { isOwnerEmail } from '@/lib/owner';

interface Stats { accounts: number | null; accountsTotalApprox: string | null; charts: number; newThisWeek: number; plusPaying: number; plusGifted: number; checkInsThisWeek: number; links: number }

export default function Admin() {
  const { user, ready } = useAuth();
  const owner = isOwnerEmail(user?.email);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [inbox, setInbox] = useState<{ betaPath: string; feedback: { id: string; email: string | null; page: string | null; message: string; created_at: string }[]; testers: { email: string; since: string }[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const load = () => fetch('/api/admin/stats').then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setStats(d); }).catch((e) => setError(e.message));
  useEffect(() => {
    if (!owner) return;
    load();
    fetch('/api/admin/feedback').then((r) => r.json()).then((d) => { if (d.betaPath) setInbox(d); }).catch(() => {});
  }, [owner]);
  const betaUrl = inbox ? `${typeof window !== 'undefined' ? window.location.origin : ''}${inbox.betaPath}` : '';

  const plus = async (grant: boolean) => {
    setNote('…');
    const r = await fetch('/api/admin/plus', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, grant }) });
    const d = await r.json();
    setNote(d.note ?? d.error ?? 'Done.');
    load();
  };

  if (!ready) return null;
  if (!owner) return <p className="text-muted">This page is for Orbori&apos;s owner.</p>;
  const tile = (k: string, v: string | number) => <div key={k} className="rounded-xl bg-deep p-3"><span className="block text-[11px] uppercase tracking-wide text-muted">{k}</span><span className="font-mono text-2xl font-bold text-gold-lite">{v}</span></div>;
  return (
    <div className="flex flex-col gap-6 lg:max-w-2xl">
      <header><p className="font-mono text-[11px] tracking-[0.12em] text-gold-lite">OWNER</p><h1 className="font-display text-[26px] font-bold">Mission control</h1></header>
      {error && <p role="alert" className="text-mauve-lite">{error}</p>}
      {stats && (
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tile('Accounts', stats.accountsTotalApprox ?? stats.accounts ?? '—')}
          {tile('Charts saved', stats.charts)}
          {tile('New this week', stats.newThisWeek)}
          {tile('Plus (paying)', stats.plusPaying)}
          {tile('Plus (gifted)', stats.plusGifted)}
          {tile('Check-ins, 7d', stats.checkInsThisWeek)}
          {tile('Links', stats.links)}
        </section>
      )}
      {inbox && (
        <section className="flex flex-col gap-3 rounded-[22px] border border-gold bg-night p-[18px]">
          <h2 className="font-display text-lg font-bold">Tester link</h2>
          <p className="text-sm text-muted">Send this to your testers. Anyone who opens it and signs in gets Plus free during the beta.</p>
          <div className="flex gap-2">
            <input readOnly value={betaUrl} className="h-11 min-w-0 flex-1 rounded-2xl border border-line-2 bg-deep px-3 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" onClick={() => { navigator.clipboard.writeText(betaUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
              className="h-11 rounded-full bg-gold px-4 text-sm font-bold text-space">{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <p className="text-xs text-dim">{inbox.testers.length} {inbox.testers.length === 1 ? 'tester has' : 'testers have'} joined{inbox.testers.length ? `: ${inbox.testers.map((t) => t.email).join(', ')}` : '.'}</p>
        </section>
      )}

      {inbox && (
        <section className="flex flex-col gap-3 rounded-[22px] border border-royal bg-night p-[18px]">
          <h2 className="font-display text-lg font-bold">Feedback <span className="font-mono text-sm text-gold-lite">{inbox.feedback.length}</span></h2>
          {inbox.feedback.length === 0 && <p className="text-sm text-muted">Nothing yet. Feedback from the button in the app lands here.</p>}
          <ul className="flex flex-col gap-2">
            {inbox.feedback.map((f) => (
              <li key={f.id} className="rounded-xl bg-deep p-3 text-sm">
                <p className="whitespace-pre-wrap">{f.message}</p>
                <p className="mt-1.5 font-mono text-[11px] text-dim">{f.email ?? 'anonymous'} · {f.page ?? ''} · {new Date(f.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-[22px] border border-royal bg-night p-[18px]">
        <h2 className="font-display text-lg font-bold">Gift Plus</h2>
        <p className="text-sm text-muted">Grant Plus to an account for free (friends, reviewers, practitioners), or take a gift back. The person must have signed in at least once.</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="their@email.com" className="h-12 rounded-2xl border border-line-2 bg-deep px-4 text-base placeholder:text-dim" />
        <div className="flex gap-2">
          <button type="button" onClick={() => plus(true)} disabled={!email} className="flex h-11 flex-1 items-center justify-center rounded-full bg-gold font-bold text-space disabled:opacity-50">Grant Plus</button>
          <button type="button" onClick={() => plus(false)} disabled={!email} className="flex h-11 flex-1 items-center justify-center rounded-full border border-royal font-medium disabled:opacity-50">Remove</button>
        </div>
        {note && <p aria-live="polite" className="text-sm text-muted">{note}</p>}
      </section>
      <QuestionReview />
      <p className="text-xs text-dim">Payments live in the <a href="https://dashboard.stripe.com" className="text-gold-lite">Stripe dashboard</a>; accounts and data in <a href="https://supabase.com/dashboard" className="text-gold-lite">Supabase</a>.</p>
    </div>
  );
}
