'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ADVICE_LABEL } from '@/lib/convergence';
import { useAuth } from '@/lib/auth';
import { localToday, useAppStore } from '@/lib/store';
import { GroupCalendar } from './GroupCalendar';
import { Sigil } from './Sigil';

interface Star { id: string; me: boolean; linkId: string | null; handle: string; seed: number; checkedIn: boolean; score: number; agree: number; advice: string; sentMe: boolean; sentByMe: boolean }
interface Sky { name: string | null; stars: Star[]; edges: [string, string][]; lit: boolean; streak: number }
interface GroupDay { d: string; adv: string }

const W = 320, H = 280, CX = W / 2, CY = H / 2 - 4;
const nice = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

/** The live Constellation: you and your linked people, glowing when they've checked in tonight. */
export function LiveSky() {
  const { user, ready } = useAuth();
  const { state, record } = useAppStore();
  const { date, timeZone } = localToday();
  const [sky, setSky] = useState<Sky | null>(null);
  const [err, setErr] = useState('');
  const [sel, setSel] = useState<Star | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [days, setDays] = useState<GroupDay[] | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    fetch(`/api/constellation?date=${date}&tz=${encodeURIComponent(timeZone)}`)
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setSky(j); setName(j.name ?? ''); })
      .catch((e) => setErr(e.message));
  }, [date, timeZone]);
  useEffect(() => { if (ready && user) load(); }, [ready, user, load]);
  useEffect(() => {
    if (!sky || sky.stars.length < 2) return;
    fetch(`/api/constellation/days?today=${date}&tz=${encodeURIComponent(timeZone)}`).then((r) => r.json()).then((j) => setDays(j.days ?? [])).catch(() => setDays([]));
  }, [sky?.stars.length, date, timeZone]); // eslint-disable-line react-hooks/exhaustive-deps
  // A lit night earns the Full Sky badge.
  useEffect(() => { if (sky?.lit && !state.activity?.[date]?.fullSky) record(date, { fullSky: true }); }, [sky?.lit, date, record, state.activity]);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200); };
  const invite = async () => {
    const r = await fetch('/api/join', { method: 'POST' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return flash(j.error ?? 'Could not make an invite.');
    const link = `${window.location.origin}${j.path}`;
    const text = `Join my constellation on Orbori ✦`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Orbori', text, url: link }); return; }
    } catch { return; }
    try { await navigator.clipboard.writeText(link); flash('Invite link copied'); } catch { window.prompt('Copy your invite link:', link); }
  };
  const saveName = async () => {
    setEditing(false);
    const r = await fetch('/api/constellation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setSky((s) => (s ? { ...s, name: j.name } : s));
  };
  const send = async (s: Star) => {
    const r = await fetch('/api/links/nudge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: s.id, date }) });
    if (r.ok) {
      setSky((k) => (k ? { ...k, stars: k.stars.map((x) => (x.id === s.id ? { ...x, sentByMe: true } : x)) } : k));
      record(date, { nudge: true });
      flash(s.checkedIn ? `Sent ${s.handle} a ✦` : `Nudged ${s.handle} to check in`);
    }
    setSel(null);
  };

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    if (!sky) return m;
    const others = sky.stars.filter((s) => !s.me);
    m.set(sky.stars.find((s) => s.me)!.id, { x: CX, y: CY });
    others.forEach((s, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(others.length, 3) + 0.5;
      const r = 104 + (s.seed % 3) * 8;
      m.set(s.id, { x: CX + r * Math.cos(a), y: CY + r * 0.88 * Math.sin(a) });
    });
    return m;
  }, [sky]);

  if (!ready) return null;
  if (!user) {
    return (
      <section className="flex flex-col gap-2 rounded-[22px] border border-line bg-night p-[18px]">
        <h2 className="font-display text-[19px] font-bold">Your live constellation</h2>
        <p className="text-sm text-muted">Sign in to invite friends into your constellation and see who&apos;s glowing tonight.</p>
        <Link href="/signin?next=%2Fcompatibility" className="self-start text-sm font-semibold text-gold-lite">Sign in →</Link>
      </section>
    );
  }
  if (err) return err === 'nochart' ? null : <p role="alert" className="text-sm text-mauve-lite">{err}</p>;
  if (!sky) return <div className="h-80 animate-pulse rounded-[22px] bg-night" aria-label="Loading your constellation" />;

  const me = sky.stars.find((s) => s.me)!;
  const others = sky.stars.filter((s) => !s.me);
  const tonight = sky.stars.filter((s) => s.checkedIn).length;
  const lines: [string, string][] = [...others.map((o) => [me.id, o.id] as [string, string]), ...sky.edges.filter(([a, b]) => a !== me.id && b !== me.id)];
  const nextDay = days?.[0];

  return (
    <section aria-labelledby="sky" className={`relative flex flex-col gap-3 overflow-hidden rounded-[22px] border p-[18px] ${sky.lit ? 'border-gold-lite bg-[radial-gradient(circle_at_50%_30%,#4a3aa8_0%,#1c1752_50%,#161240)] shadow-[0_0_30px_rgba(212,162,76,0.2)]' : 'border-royal bg-night'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.12em] text-gold-lite">YOUR CONSTELLATION</p>
          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); saveName(); }} className="mt-1 flex gap-2">
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Name it, like The Lanai Crew"
                className="min-h-10 w-full rounded-xl border border-line-2 bg-deep px-3 text-[15px]" />
              <button type="submit" className="min-h-10 rounded-full bg-gold px-4 text-sm font-bold text-space">Save</button>
            </form>
          ) : (
            <h2 id="sky" className="font-display text-[22px] font-bold leading-tight">
              <button type="button" onClick={() => setEditing(true)} className="text-left">{sky.name ?? 'Name your constellation'} <span className="text-sm text-dim" aria-hidden="true">✎</span></button>
            </h2>
          )}
          <p className="mt-0.5 text-sm text-muted">
            {others.length === 0 ? 'Just you so far. Invite a friend to start your sky.'
              : sky.lit ? `All ${sky.stars.length} of you checked in tonight ✦` : `${tonight} of ${sky.stars.length} checked in tonight. Tap a star.`}
          </p>
        </div>
        {sky.streak > 0 && <span className="shrink-0 rounded-full border border-royal px-2.5 py-1 text-xs font-bold">🔥 {sky.streak} {sky.streak === 1 ? 'night' : 'nights'}</span>}
      </div>

      <div className="relative mx-auto" style={{ width: W, height: H }} role="group" aria-label={`Constellation with ${sky.stars.length} stars, ${tonight} checked in tonight`}>
        <svg width={W} height={H} className="absolute inset-0" aria-hidden="true">
          {Array.from({ length: 36 }, (_, i) => <circle key={i} cx={(i * 73) % W} cy={(i * 131) % H} r={(i % 3) * 0.4 + 0.5} fill="#ECE8F4" opacity={0.3} />)}
          {lines.map(([a, b]) => {
            const A = pos.get(a), B = pos.get(b); if (!A || !B) return null;
            const on = sky.lit || (sky.stars.find((s) => s.id === a)?.checkedIn && sky.stars.find((s) => s.id === b)?.checkedIn);
            return <line key={`${a}-${b}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={on ? '#D4A24C' : '#2E2A6E'} strokeWidth={on ? 1.6 : 1.2} opacity={on ? 0.85 : 1} />;
          })}
        </svg>
        {sky.stars.map((s) => {
          const p = pos.get(s.id)!; const size = s.me ? 58 : 42;
          return (
            <button key={s.id} type="button" onClick={() => setSel(s)} aria-label={`${s.me ? 'You' : s.handle}${s.checkedIn ? ', checked in tonight' : ', not checked in yet'}`}
              className="absolute flex w-[86px] flex-col items-center gap-1" style={{ left: p.x - 43, top: p.y - size / 2 }}>
              <span className={`rounded-full transition ${s.checkedIn || sky.lit ? 'star-glow' : 'opacity-40 grayscale'}`}><Sigil seed={s.seed} size={size} /></span>
              <span className="max-w-[86px] truncate font-mono text-[10px] tracking-[0.04em] text-muted">{s.me ? 'YOU' : s.handle.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {sky.lit && others.length > 0 && (
        <p className="rounded-2xl border border-gold-lite/60 bg-deep/70 px-4 py-3 text-center text-sm"><b className="font-display text-base">Your constellation is lit ✦</b><br /><span className="text-muted">Everyone checked in tonight. Full Sky badge earned.</span></p>
      )}

      {others.length > 0 && (
        <div className="rounded-2xl bg-deep p-3">
          <p className="font-mono text-[10px] tracking-[0.12em] text-gold-lite">CONSTELLATION DAYS</p>
          {days === null ? <p className="mt-1 text-xs text-dim">Reading everyone&apos;s year ahead…</p>
            : !nextDay ? <p className="mt-1 text-sm text-muted">No day in the next year where all of you line up. They&apos;re rare; a smaller group finds more.</p>
            : (
              <>
                <p className="mt-1 text-xs text-dim">Days when everyone&apos;s Council gives the same strong advice. {days.length} in the next year; the next is {nice(nextDay.d)}.</p>
                <GroupCalendar days={days} today={date} names={sky.stars.map((s) => (s.me ? 'You' : s.handle))} group={sky.name} />
              </>
            )}
        </div>
      )}

      <button type="button" onClick={invite} className="flex min-h-11 items-center justify-center rounded-full border border-gold text-sm font-semibold">＋ Invite someone to your constellation</button>

      {sel && (
        <div className="fixed inset-0 z-30" role="dialog" aria-modal="true" aria-label={sel.me ? 'You' : sel.handle}>
          <button type="button" aria-label="Close" onClick={() => setSel(null)} className="absolute inset-0 bg-space/70 backdrop-blur-sm" />
          <div className="orb-sheet absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[28px] border-t border-line-2 bg-deep px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 lg:bottom-6 lg:rounded-[28px] lg:border">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-2" />
            <p className="font-mono text-[10px] tracking-[0.12em] text-gold-lite">{sel.checkedIn ? '✦ CHECKED IN TONIGHT' : 'NOT CHECKED IN YET'}</p>
            <h3 className="mt-1 font-display text-xl font-bold">{sel.me ? 'You' : sel.handle}</h3>
            {sel.me ? (
              <p className="mt-2 text-sm text-muted">{sky.lit ? 'Your whole constellation is lit tonight.' : `${sky.stars.length - tonight} still to go before your constellation lights up.`}</p>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-2xl bg-night p-3"><b className="block font-mono text-2xl text-gold-lite">{sel.score.toFixed(1)}</b><span className="text-[11px] text-dim">their score today</span></div>
                  <div className="rounded-2xl bg-night p-3"><b className="block font-mono text-2xl text-gold-lite">{me.score.toFixed(1)}</b><span className="text-[11px] text-dim">your score today</span></div>
                </div>
                <p className="mt-3 text-sm text-muted">Your Councils agree on <b className="text-starlight">{sel.agree} of 7</b> voices today. Theirs says <b className="text-starlight">{ADVICE_LABEL[sel.advice]?.toLowerCase()}</b>.</p>
                {sel.sentMe && <p className="mt-2 rounded-xl border border-gold px-3 py-2 text-sm text-gold-lite">✦ {sel.handle} sent you a star today.</p>}
                <button type="button" disabled={sel.sentByMe} onClick={() => send(sel)} className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-gold text-sm font-bold text-space disabled:opacity-50">
                  {sel.sentByMe ? 'Sent today ✦' : sel.checkedIn ? 'Send a ✦' : 'Nudge them to check in'}
                </button>
              </>
            )}
            <button type="button" onClick={() => setSel(null)} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border border-line-2 text-sm font-semibold text-muted">Close</button>
          </div>
        </div>
      )}
      {toast && <p role="status" className="fixed bottom-28 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-starlight px-4 py-2 text-xs font-bold text-space">✓ {toast}</p>}
    </section>
  );
}
