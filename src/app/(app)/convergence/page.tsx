'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ADVICE_LABEL, VOICE_NAME, voiceInSentence, type GlowDay } from '@/lib/convergence';
import { useAuth } from '@/lib/auth';
import { localToday, useAppStore } from '@/lib/store';

type Data =
  | { access: true; counts: { alignments: number; convergences: number }; days: GlowDay[]; next: GlowDay | null; token: string }
  | { access: false; counts: { alignments: number; convergences: number }; hasNext: boolean };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const nice = (d: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('en-US', opts);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
const Orbs = ({ v, size = 14 }: { v: GlowDay['v'] | null; size?: number }) => (
  <div aria-hidden="true" className="flex justify-center gap-1.5">
    {Array.from({ length: 7 }, (_, i) => (
      <span key={i} style={{ width: size, height: size }} className={`rounded-full ${!v || v[i][1] ? 'bg-[radial-gradient(circle_at_35%_30%,#ffe2a6,#d4a24c_55%,#a2752c)] shadow-[0_0_8px_rgba(212,162,76,0.55)]' : 'bg-line-2'}`} />
    ))}
  </div>
);

/** Convergence Calendar: the days the Council agrees, a year ahead. */
export default function ConvergencePage() {
  const { state } = useAppStore();
  const { user, ready: authReady } = useAuth();
  const { date: today } = localToday();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState<GlowDay | null>(null);
  const [sheet, setSheet] = useState<'day' | 'add' | null>(null);
  const [month, setMonth] = useState(() => ({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 }));
  const [toast, setToast] = useState('');

  const load = (reset = false) => {
    setError('');
    fetch('/api/convergence', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input: state.profile!.input, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, today, reset }) })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error === 'signin' ? 'signin' : j.error || 'Could not load your forecast.'); return j; })
      .then((j) => { setData(j); if (reset) flash('New private link made. Re-add your calendar.'); })
      .catch((e) => setError(e.message));
  };
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200); };
  const byDate = useMemo(() => new Map((data?.access ? [...data.days, ...(data.next ? [data.next] : [])] : []).map((g) => [g.d, g])), [data]);
  const lastMonth = useMemo(() => {
    const last = data?.access ? [...byDate.keys()].sort().at(-1) : null;
    return last ? (+last.slice(0, 4)) * 12 + (+last.slice(5, 7) - 1) : month.y * 12 + month.m + 11;
  }, [byDate, data]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstMonth = +today.slice(0, 4) * 12 + (+today.slice(5, 7) - 1);
  const cur = month.y * 12 + month.m;
  const go = (d: number) => { const n = cur + d; setMonth({ y: Math.floor(n / 12), m: n % 12 }); };

  const feed = data?.access ? `https://www.orbori.app/api/cal/${data.token}.ics` : '';
  const webcal = feed.replace(/^https:/, 'webcal:');
  const copy = async () => { try { await navigator.clipboard.writeText(feed); flash('Copied your private calendar link'); } catch { flash(feed); } };
  const open = (g: GlowDay) => { setSel(g); setSheet('day'); };
  const close = () => { setSheet(null); setSel(null); };
  useEffect(() => {
    if (!sheet) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [sheet]);

  const header = (
    <header>
      <p className="font-mono text-[11px] tracking-[0.14em] text-gold-lite">CONVERGENCE CALENDAR</p>
      <h1 className="font-display text-[26px] font-bold leading-tight">When the sky speaks with one voice</h1>
      <p className="mt-1 text-sm text-muted">Orbori runs your chart a year ahead and finds the rare days the seven traditions line up. <b className="text-starlight">Convergence</b>: all 7 agree. <b className="text-starlight">Alignment</b>: 6 of 7, with one holdout.</p>
    </header>
  );

  if (!authReady) return <div className="flex flex-col gap-5 lg:max-w-3xl">{header}<div className="h-72 animate-pulse rounded-3xl bg-night" /></div>;
  if (!user) {
    return <div className="flex flex-col gap-5 lg:max-w-3xl">{header}
      <div className="rounded-3xl bg-night p-5 text-sm text-muted">Sign in to see your Convergence Calendar. <Link href="/profile" className="font-semibold text-gold-lite">Go to Me →</Link></div></div>;
  }
  if (error) return <div className="flex flex-col gap-5 lg:max-w-3xl">{header}<p role="alert" className="text-mauve-lite">{error === 'signin' ? 'Sign in to see your forecast.' : error}</p></div>;
  if (!data) return <div className="flex flex-col gap-5 lg:max-w-3xl">{header}<div className="h-72 animate-pulse rounded-3xl bg-night" aria-label="Reading the year ahead" /><p className="text-center text-xs text-dim">Reading the year ahead…</p></div>;

  if (!data.access) {
    return (
      <div className="flex flex-col gap-5 lg:max-w-3xl">{header}
        <div className="relative">
          <div aria-hidden="true" className="pointer-events-none select-none opacity-50 blur-[5px]">
            <div className="rounded-3xl border border-gold-lite bg-night p-5 text-center"><Orbs v={null} /><p className="mt-2 font-display text-xl font-bold">Tue · Mar 7</p></div>
            <div className="mt-3 grid grid-cols-7 gap-1">{Array.from({ length: 28 }, (_, i) => <span key={i} className={`aspect-square rounded-xl ${i % 9 === 4 ? 'bg-royal' : 'bg-night'}`} />)}</div>
          </div>
          <div className="absolute inset-x-0 top-8 mx-auto max-w-sm rounded-3xl border border-line-2 bg-night p-5 text-center shadow-xl">
            <p className="text-2xl">✦</p>
            <h2 className="mt-1 font-display text-lg font-bold">{data.counts.alignments} Alignments{data.counts.convergences ? ` and ${data.counts.convergences} Convergence` : ''} this year{!data.counts.convergences && data.hasNext ? ', and your next Convergence is already mapped' : ''}</h2>
            <p className="mt-2 text-sm text-muted">Yearly members see exactly when, a full year out, and can add them all to their calendar.</p>
            <Link href="/plus" className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-gold text-sm font-bold text-space">Go yearly</Link>
          </div>
        </div>
      </div>
    );
  }

  const first = new Date(month.y, month.m, 1).getDay();
  const n = new Date(month.y, month.m + 1, 0).getDate();
  const key = (d: number) => `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const inMonth = [...byDate.keys()].filter((d) => d.startsWith(key(1).slice(0, 7))).length;
  const upcoming = [...byDate.values()].filter((g) => g.d >= today).sort((a, b) => a.d.localeCompare(b.d));
  const nextAfter = upcoming.find((g) => g.d > key(n));
  const next = data.next;

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <div className="flex items-start justify-between gap-3">{header}</div>
      <button type="button" onClick={() => setSheet('add')} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold text-sm font-bold text-space sm:self-start sm:px-6">＋ Add all to my calendar</button>

      {next && (
        <button type="button" onClick={() => open(next)} className="rounded-3xl border border-gold-lite bg-[radial-gradient(circle_at_50%_0%,#3b3399_0%,#141048_60%,#0d0a35)] px-5 py-5 text-center shadow-[0_0_30px_rgba(212,162,76,0.15)]">
          <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-gold-lite">{next.d === today ? 'TODAY IS A CONVERGENCE' : 'YOUR NEXT CONVERGENCE'}</p>
          <div className="mt-2"><Orbs v={next.v} size={16} /></div>
          <p className="mt-2 font-display text-[22px] font-bold">{nice(next.d, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).replace(',', ' ·')}</p>
          <p className="mt-1 text-sm text-muted">All 7 voices: <b className="text-starlight">{ADVICE_LABEL[next.adv].toLowerCase()}</b></p>
          <div className="mt-3 flex justify-center gap-2">
            <span className="min-w-[70px] rounded-xl border border-line-2 bg-deep/70 px-3 py-1.5"><b className="block text-lg">{daysBetween(today, next.d)}</b><span className="text-[10px] tracking-[0.08em] text-dim">DAYS</span></span>
            <span className="rounded-xl border border-line-2 bg-deep/70 px-3 py-1.5"><b className="block text-lg">🌕</b><span className="text-[10px] tracking-[0.08em] text-dim">RARE AS A BLUE MOON</span></span>
          </div>
        </button>
      )}

      <section aria-label="Calendar" className="rounded-3xl bg-night p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => go(-1)} disabled={cur <= firstMonth} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-full border border-line-2 disabled:opacity-30">‹</button>
          <h2 className="font-display text-lg font-bold" aria-live="polite">{MONTHS[month.m]} {month.y}</h2>
          <button type="button" onClick={() => go(1)} disabled={cur >= lastMonth} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-full border border-line-2 disabled:opacity-30">›</button>
        </div>
        <div aria-hidden="true" className="grid grid-cols-7 gap-1 pb-1 text-center font-mono text-[10px] font-bold tracking-[0.06em] text-dim">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: first }, (_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: n }, (_, i) => {
            const k = key(i + 1), g = byDate.get(k), past = k < today;
            const cls = g ? (g.n === 7
              ? 'glow-cv font-black text-space bg-[radial-gradient(circle_at_40%_35%,#ffe9b8,#d4a24c_55%,#a2752c)] shadow-[0_0_18px_rgba(212,162,76,0.8),0_0_36px_rgba(212,162,76,0.4)]'
              : 'glow-al font-extrabold text-starlight bg-[radial-gradient(circle_at_50%_40%,rgba(212,162,76,0.45),#343e9f_70%)] shadow-[inset_0_0_0_1.5px_#d4a24c,0_0_16px_rgba(212,162,76,0.4)]')
              : past ? 'text-[#4a4580]' : 'text-muted';
            return g ? (
              <button key={k} type="button" onClick={() => open(g)} aria-label={`${nice(k)}: ${g.n === 7 ? 'Convergence' : 'Alignment'}`}
                className={`aspect-square rounded-xl text-sm ${cls} ${sel?.d === k ? 'outline outline-2 outline-offset-1 outline-starlight' : ''} ${past ? 'opacity-50' : ''}`}>{i + 1}</button>
            ) : (
              <span key={k} className={`grid aspect-square place-items-center rounded-xl text-sm font-semibold ${cls} ${k === today ? 'outline outline-[1.5px] outline-royal text-starlight' : ''}`}>{i + 1}</span>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-dim">
          <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-royal shadow-[inset_0_0_0_1.5px_#d4a24c]" />Alignment · 6 of 7</span>
          <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-gold-lite shadow-[0_0_8px_#d4a24c]" />Convergence · 7 of 7</span>
        </div>
        <p className="mt-3 rounded-2xl bg-deep px-3 py-2.5 text-xs text-muted">
          {inMonth ? <><b className="text-starlight">{inMonth} glowing {inMonth === 1 ? 'day' : 'days'}</b> this month. Tap {inMonth === 1 ? 'it' : 'one'} to see what&apos;s happening.</>
            : nextAfter ? <>No glowing days this month. Next: <b className="text-starlight">{nice(nextAfter.d)}</b>.</> : <>No more glowing days in this forecast yet. It rolls forward every month.</>}
        </p>
      </section>
      <p className="text-center text-xs text-dim">{data.counts.alignments} Alignments and {data.counts.convergences} Convergence{data.counts.convergences === 1 ? '' : 's'} in the next 12 months. A forecast of tendencies, not fate.</p>

      {sheet && (
        <div className="fixed inset-0 z-30" role="dialog" aria-modal="true" aria-label={sheet === 'add' ? 'Add to your calendar' : 'Glowing day'}>
          <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 bg-space/70 backdrop-blur-sm" />
          <div className="orb-sheet absolute inset-x-0 bottom-0 mx-auto max-h-[86dvh] max-w-xl overflow-y-auto rounded-t-[28px] border-t border-line-2 bg-deep px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 lg:bottom-6 lg:rounded-[28px] lg:border">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-2" />
            {sheet === 'day' && sel ? (() => {
              const hold = sel.v.find((v) => !v[1]); const left = daysBetween(today, sel.d);
              return (
                <>
                  <span className={`inline-block rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] ${sel.n === 7 ? 'bg-gold-lite text-space' : 'border border-gold text-gold-lite'}`}>{sel.n === 7 ? '✦ CONVERGENCE · 7 OF 7' : 'ALIGNMENT · 6 OF 7'}</span>
                  <h2 className="mt-2.5 font-display text-[22px] font-bold leading-tight">{sel.head}</h2>
                  <p className="mt-1 text-xs text-dim">{nice(sel.d)} · {left === 0 ? 'today' : left > 0 ? `in ${left} days` : `${-left} days ago`}</p>
                  <div className="mt-3 flex justify-start"><Orbs v={sel.v} /></div>
                  <p className="mt-2 text-sm text-muted">{sel.agree}{hold ? <> Only {voiceInSentence(hold[0])} holds out and says <b className="text-mauve-lite">{ADVICE_LABEL[hold[2]].toLowerCase()}</b>.</> : ' No holdouts. The whole Council speaks with one voice.'}</p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {sel.v.map((v) => (
                      <li key={v[0]} className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${v[1] ? 'border-line bg-night' : 'border-[#6b4a55] bg-[#1f1238]'}`}>
                        <b className="min-w-[96px]">{VOICE_NAME[v[0]]}</b><span className="flex-1 text-dim">{v[3]}</span>
                        <em className={`whitespace-nowrap not-italic font-bold ${v[1] ? 'text-gold-lite' : 'text-mauve-lite'}`}>{v[1] ? '✦ agrees' : 'holds out'}</em>
                      </li>
                    ))}
                  </ul>
                  <a href={`/api/cal/${data.token}.ics?date=${sel.d}`} className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-gold text-sm font-bold text-space">＋ Add this day to my calendar</a>
                  <button type="button" onClick={close} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border border-line-2 text-sm font-semibold text-muted">Close</button>
                </>
              );
            })() : (
              <>
                <span className="inline-block rounded-full bg-gold-lite px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-space">ADD TO YOUR CALENDAR</span>
                <h2 className="mt-2.5 font-display text-[22px] font-bold leading-tight">Every glowing day, in the calendar you already use</h2>
                <p className="mt-2 text-sm text-muted">Each one arrives as an all-day event with a reminder the evening before. As the forecast rolls forward, new days appear on their own.</p>
                {[
                  { href: webcal, icon: '📅', name: 'Apple Calendar', note: 'iPhone, iPad and Mac' },
                  { href: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`, icon: 'G', name: 'Google Calendar', note: 'Android and the web' },
                  { href: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feed)}&name=${encodeURIComponent('Orbori glowing days')}`, icon: 'O', name: 'Outlook', note: 'Work or personal' },
                ].map((o) => (
                  <a key={o.name} href={o.href} target={o.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                    className="mt-2 flex items-center gap-3 rounded-2xl border border-line bg-night p-3 text-sm font-bold">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-royal">{o.icon}</span>
                    <span>{o.name}<span className="block text-xs font-medium text-dim">{o.note}</span></span>
                  </a>
                ))}
                <button type="button" onClick={copy} className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-line bg-night p-3 text-left text-sm font-bold">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-royal">🔗</span>
                  <span>Copy calendar link<span className="block text-xs font-medium text-dim">For any other calendar app</span></span>
                </button>
                <p className="mt-3 text-xs text-dim">Your calendar link is private to you. It only carries the dates and the Council&apos;s advice, never your birth details or journal. Shared it by accident? <button type="button" onClick={() => { close(); load(true); }} className="font-semibold text-gold-lite underline">Make a new link</button> (the old one stops working).</p>
                <button type="button" onClick={close} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-line-2 text-sm font-semibold text-muted">Close</button>
              </>
            )}
          </div>
        </div>
      )}
      {toast && <p role="status" className="fixed bottom-28 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-starlight px-4 py-2 text-xs font-bold text-space">✓ {toast}</p>}
    </div>
  );
}
