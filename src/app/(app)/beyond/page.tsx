'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MySigil } from '@/components/Rewards';
import { SkyOfNights } from '@/components/SkyOfNights';
import { Bar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CELESTIAL_LETTER, CONVERGENT_LETTER } from '@/lib/letters';
import { isOwnerEmail } from '@/lib/owner';
import { isConvergent, sevenPaths } from '@/lib/paths';
import { setPrefs, usePrefs, type SigilDesign } from '@/lib/prefs';
import { starRank, STAR_RANKS } from '@/lib/progress';
import { localToday, useAppStore } from '@/lib/store';
import { useProgress } from '@/lib/use-progress';

interface Data {
  number: number | null; public: boolean;
  ask: { question: string; answer: string } | null; reflection: string | null;
  poll: { id: string; question: string; options: string[]; mine: string | null; counts: Record<string, number> };
  submissions: { id: string; text: string; status: string }[];
  gifts: { earned: number; links: { code: string; redeemed: boolean }[] };
}
const LINES = ['#D4A24C', '#ECE8F4', '#9EF0C8', '#C8B6FF', '#F6A7C1', '#8FC0F0'];
const card = 'flex flex-col gap-3 rounded-3xl border border-line bg-night p-5';
const btn = 'flex min-h-11 items-center justify-center self-start rounded-full bg-gold px-5 text-sm font-bold text-space disabled:opacity-60';

export default function Beyond() {
  const { state } = useAppStore();
  const p = useProgress();
  const prefs = usePrefs();
  const { user, ready } = useAuth();
  const allowed = p.levelIndex >= 4 || isOwnerEmail(user?.email);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [consent, setConsent] = useState(false);
  const [mine, setMine] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const paths = useMemo(() => sevenPaths({ checkIns: state.checkIns, activity: state.activity ?? {}, birthDate: state.profile.input.date }), [state]);
  const convergent = isConvergent(paths);
  const rank = starRank(p.xp);

  const load = useCallback(async () => {
    const r = await fetch('/api/celestial');
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error ?? 'Could not open the sky.'); return; }
    setData(d);
    if (d.number && d.number !== prefs.celestialNo) setPrefs({ celestialNo: d.number });
  }, [prefs.celestialNo]);
  useEffect(() => { if (allowed && user) load(); }, [allowed, user, load]);

  const post = async (action: string, extra: Record<string, unknown>) => {
    setBusy(action); setNote(null);
    const r = await fetch('/api/celestial', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const d = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) { setNote(d.error ?? 'Something went wrong.'); return null; }
    await load();
    return d;
  };

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p aria-hidden="true" className="text-3xl text-gold-lite">✦</p>
        <h1 className="font-display text-2xl font-bold">The sky keeps its secrets.</h1>
        <p className="max-w-xs text-sm text-muted">Keep going.</p>
        <Link href="/rewards" className="text-sm font-semibold text-gold-lite">Back to rewards</Link>
      </div>
    );
  }

  if (!prefs.revealed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-space px-8 text-center">
        <SkyOfNights dates={Object.keys(state.checkIns)} className="anim-fade absolute inset-0 h-full w-full opacity-70" />
        <p className="anim-rise relative font-mono text-xs tracking-[0.2em] text-gold-lite">CELESTIAL</p>
        <h1 className="anim-fade relative font-display text-4xl font-bold leading-tight">The sky doesn&apos;t end here.</h1>
        <p className="anim-fade relative max-w-sm text-muted">Every star behind you is a night you showed up. Seven paths open now, and the ranks of the sky go on past Celestial.</p>
        <button type="button" onClick={() => setPrefs({ revealed: true })} className="relative min-h-12 rounded-full bg-gold px-8 font-bold text-space">Step through</button>
      </div>
    );
  }

  const design: SigilDesign = prefs.sigil ?? { sides: 5, inner: true, ring: true, line: '#D4A24C', accent: '#C8B6FF' };
  const setDesign = (patch: Partial<SigilDesign>) => setPrefs({ sigil: { ...design, ...patch } });
  const total = data ? Object.values(data.poll.counts).reduce((a, b) => a + b, 0) : 0;
  const giftsLeft = data ? data.gifts.earned - data.gifts.links.length : 0;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header className="relative overflow-hidden rounded-3xl border border-gold bg-night p-6">
        <SkyOfNights dates={Object.keys(state.checkIns)} className="absolute inset-0 h-full w-full opacity-60" />
        <div className="relative flex items-center gap-4">
          <MySigil seed={state.profile.seed} size={72} />
          <div className="flex-1">
            <p className="font-mono text-[11px] tracking-[0.14em] text-gold-lite">BEYOND CELESTIAL</p>
            <h1 className="font-display text-[28px] font-bold leading-tight">{data?.number ? `Celestial #${data.number}` : 'Celestial'}</h1>
            <p className="text-sm text-muted">{rank.rank ? `Star rank: ${rank.rank}` : 'Your star rank begins at Comet'}{rank.next ? ` · ${(rank.next.xp - p.xp).toLocaleString('en-US')} XP to ${rank.next.name}` : ' · the whole sky'}{convergent ? ' · Convergent' : ''}</p>
          </div>
        </div>
        <div className="relative mt-4"><Bar value={rank.next ? (p.xp - (rank.rank ? STAR_RANKS.find((r) => r.name === rank.rank)!.xp : 12000)) / (rank.next.xp - (rank.rank ? STAR_RANKS.find((r) => r.name === rank.rank)!.xp : 12000)) : 1} /></div>
        <p className="relative mt-2 font-mono text-[10px] tracking-[0.08em] text-dim">{STAR_RANKS.map((r) => r.name.toUpperCase()).join(' · ')}</p>
      </header>

      {!user && ready && (
        <p className="rounded-2xl border border-gold bg-night p-4 text-sm">Sign in to claim your Celestial number and the features below. <Link href={`/signin?next=${encodeURIComponent('/beyond')}`} className="font-semibold text-gold-lite">Sign in ›</Link></p>
      )}
      {err && <p role="alert" className="text-sm text-mauve-lite">{err}</p>}
      {note && <p role="status" className="rounded-xl bg-night px-4 py-3 text-sm text-mauve-lite">{note}</p>}

      <Link href="/astrocartography" className="flex min-h-14 items-center gap-3 rounded-3xl border border-gold bg-night px-5 py-3">
        <span aria-hidden="true" className="text-xl text-gold-lite">◍</span>
        <span className="flex-1"><span className="block font-display text-lg font-bold">Astrocartography</span><span className="text-sm text-muted">Your planet lines across the world.</span></span>
        <span className="text-gold-lite">›</span>
      </Link>

      <section aria-labelledby="paths" className={card}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="paths" className="font-display text-xl font-bold">The Seven Paths</h2>
          <span className="font-mono text-[11px] text-gold-lite">{paths.filter((x) => x.done).length} / 7</span>
        </div>
        <p className="text-sm text-muted">One path for each tradition, walked through curiosity rather than XP. Finish all seven to become Convergent. Each path you finish also earns a month of Plus to give away.</p>
        <ul className="flex flex-col gap-2">
          {paths.map((path) => {
            const done = path.quests.filter((q) => q.done).length;
            return (
              <li key={path.id}>
                <details className={`group rounded-2xl ${path.done ? 'border border-gold' : ''} bg-deep`}>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3">
                    <span aria-hidden="true" className={path.done ? 'text-gold-lite' : 'text-dim'}>{path.done ? '✦' : '○'}</span>
                    <span className="flex-1 font-semibold">{path.title}</span>
                    <span className="font-mono text-[11px] text-muted">{done}/{path.quests.length}</span>
                    <span aria-hidden="true" className="text-dim group-open:rotate-90">›</span>
                  </summary>
                  <ul className="flex flex-col gap-2.5 px-4 pb-4">
                    {path.quests.map((q) => (
                      <li key={q.label} className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between gap-3"><span className={q.done ? 'text-starlight' : 'text-muted'}>{q.done ? '✦ ' : ''}{q.label}</span><span className="shrink-0 font-mono text-[11px] text-dim">{q.progress}/{q.goal}</span></div>
                        <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${(q.progress / q.goal) * 100}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-dim">&ldquo;Student&rdquo; on purpose: these titles mark your learning in Orbori, not standing in any tradition. Real teachers and keepers earn their names in their own communities.</p>
      </section>

      <section aria-labelledby="looks" className={card}>
        <h2 id="looks" className="font-display text-xl font-bold">Your looks</h2>
        <div className="flex flex-col gap-4 rounded-2xl bg-deep p-4">
          <div className="flex items-center gap-4">
            <MySigil seed={state.profile.seed} size={64} />
            <div className="flex flex-1 flex-col gap-2 text-sm">
              <label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={!!prefs.sigil} onChange={(e) => setPrefs({ sigil: e.target.checked ? design : null })} className="h-5 w-5 accent-[var(--color-gold)]" />Design my own sigil</label>
              <label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={prefs.sigilMotion} onChange={(e) => setPrefs({ sigilMotion: e.target.checked })} className="h-5 w-5 accent-[var(--color-gold)]" />Let it turn and glow</label>
            </div>
          </div>
          {prefs.sigil && (
            <div className="flex flex-col gap-3 text-sm">
              <label className="flex items-center gap-3">Points <input type="range" min={3} max={8} value={design.sides} onChange={(e) => setDesign({ sides: +e.target.value })} className="flex-1 accent-[var(--color-gold)]" /><span className="w-4 font-mono">{design.sides}</span></label>
              <div className="flex flex-wrap gap-4">
                <label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={design.inner} onChange={(e) => setDesign({ inner: e.target.checked })} className="h-5 w-5 accent-[var(--color-gold)]" />Inner star</label>
                <label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={design.ring} onChange={(e) => setDesign({ ring: e.target.checked })} className="h-5 w-5 accent-[var(--color-gold)]" />Inner ring</label>
              </div>
              {(['line', 'accent'] as const).map((k) => (
                <div key={k} role="radiogroup" aria-label={k === 'line' ? 'Main color' : 'Accent color'} className="flex items-center gap-2">
                  <span className="w-16 text-muted">{k === 'line' ? 'Main' : 'Accent'}</span>
                  {LINES.map((c) => <button key={c} type="button" role="radio" aria-checked={design[k] === c} aria-label={c} onClick={() => setDesign({ [k]: c })} className={`h-8 w-8 rounded-full border-2 ${design[k] === c ? 'border-starlight' : 'border-transparent'}`} style={{ background: c }} />)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPrefs({ theme: prefs.theme === 'aurora' ? 'night' : 'aurora' })} aria-pressed={prefs.theme === 'aurora'}
            className={`min-h-11 rounded-full border px-4 text-sm ${prefs.theme === 'aurora' ? 'border-gold-lite bg-royal' : 'border-line-2'}`}>Aurora theme</button>
          <button type="button" onClick={() => setPrefs({ card: prefs.card === 'foil' ? 'classic' : 'foil' })} aria-pressed={prefs.card === 'foil'}
            className={`min-h-11 rounded-full border px-4 text-sm ${prefs.card === 'foil' ? 'border-gold-lite bg-royal' : 'border-line-2'}`}>Celestial Foil cards</button>
        </div>
        <p className="text-xs text-dim">The sky behind your name up top is yours alone: one star for every night you checked in, with streaks joined into constellations.</p>
      </section>

      {user && data && (
        <>
          <section aria-labelledby="ask" className={card}>
            <h2 id="ask" className="font-display text-xl font-bold">Ask the Council</h2>
            {data.ask ? (
              <>
                <p className="text-sm italic text-muted">&ldquo;{data.ask.question}&rdquo;</p>
                {data.ask.answer.split(/\n\s*\n/).map((t, i) => <p key={i} className="text-[15px] leading-relaxed">{t}</p>)}
                <p className="text-xs text-dim">A new question opens every Monday. Written by AI from today&apos;s Council; reflections, not predictions or advice.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">One personal question a week. All seven voices weigh in.</p>
                <label htmlFor="ask-q" className="sr-only">Your question</label>
                <textarea id="ask-q" value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 400))} rows={3} placeholder="What should I keep in mind as I start something new this month?"
                  className="rounded-2xl border border-line-2 bg-deep p-3 text-[15px] placeholder:text-dim" />
                <button type="button" disabled={busy === 'ask' || question.trim().length < 8} className={btn}
                  onClick={() => { const { date, timeZone } = localToday(); post('ask', { question, input: state.profile.input, date, timeZone }); }}>
                  {busy === 'ask' ? 'The Council is speaking…' : 'Ask'}
                </button>
              </>
            )}
          </section>

          <section aria-labelledby="reflect" className={card}>
            <h2 id="reflect" className="font-display text-xl font-bold">Your month, reflected</h2>
            {data.reflection ? data.reflection.split(/\n\s*\n/).map((t, i) => <p key={i} className="text-[15px] leading-relaxed">{t}</p>) : (
              <>
                <p className="text-sm text-muted">Once a month, the AI can read this month&apos;s journal entries beside your daily readings and write you a private reflection. Your journal is never sent anywhere unless you ask for this.</p>
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]" />Send this month&apos;s journal entries to the AI (Anthropic) once, to write my reflection.</label>
                <button type="button" disabled={!consent || busy === 'reflect'} onClick={() => post('reflect', { consent })} className={btn}>{busy === 'reflect' ? 'Reading your month…' : 'Reflect on my month'}</button>
              </>
            )}
          </section>

          <section aria-labelledby="shape" className={card}>
            <h2 id="shape" className="font-display text-xl font-bold">Shape Orbori</h2>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm text-muted">{data.poll.question}</legend>
              {data.poll.options.map((o) => {
                const n = data.poll.counts[o] ?? 0;
                return (
                  <button key={o} type="button" onClick={() => post('vote', { choice: o })} aria-pressed={data.poll.mine === o}
                    className={`relative min-h-12 overflow-hidden rounded-2xl border px-4 text-left text-sm ${data.poll.mine === o ? 'border-gold-lite' : 'border-line-2'}`}>
                    {data.poll.mine && <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-royal/70" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />}
                    <span className="relative flex justify-between gap-3"><span>{data.poll.mine === o ? '✦ ' : ''}{o}</span>{data.poll.mine && <span className="font-mono text-[11px] text-muted">{n}</span>}</span>
                  </button>
                );
              })}
            </fieldset>
            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <label htmlFor="mine" className="text-sm text-muted">Write a journal question for everyone. Once approved, it shows on Today with your handle.</label>
              <input id="mine" value={mine} onChange={(e) => setMine(e.target.value.slice(0, 200))} placeholder="What did you notice today that you usually rush past?"
                className="h-12 rounded-2xl border border-line-2 bg-deep px-4 text-[15px] placeholder:text-dim" />
              <button type="button" disabled={busy === 'submit'} onClick={async () => { if (await post('submit', { text: mine })) setMine(''); }} className={btn}>Submit</button>
              {data.submissions.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm">
                  {data.submissions.map((s) => <li key={s.id} className="flex justify-between gap-3"><span className="text-muted">{s.text}</span><span className={`shrink-0 font-mono text-[10px] ${s.status === 'approved' ? 'text-gold-lite' : s.status === 'rejected' ? 'text-mauve-lite' : 'text-dim'}`}>{s.status.toUpperCase()}</span></li>)}
                </ul>
              )}
            </div>
          </section>

          <section aria-labelledby="gifts" className={card}>
            <h2 id="gifts" className="font-display text-xl font-bold">Months of Plus to give</h2>
            <p className="text-sm text-muted">Every path you finish earns a month of Plus for someone who doesn&apos;t have it. {data.gifts.earned === 0 ? 'Finish your first path to earn one.' : `You've earned ${data.gifts.earned}.`}</p>
            {data.gifts.links.map((g) => (
              <p key={g.code} className="break-all rounded-xl bg-deep px-3 py-2 font-mono text-xs text-muted">{g.redeemed ? '✦ opened · ' : ''}{origin}/gift/{g.code}</p>
            ))}
            {giftsLeft > 0 && <button type="button" disabled={busy === 'gift-month'} onClick={() => post('gift-month', {})} className={btn}>Make a gift link</button>}
          </section>

          <section aria-labelledby="hall" className={card}>
            <h2 id="hall" className="font-display text-xl font-bold">Hall of the Sky</h2>
            <label className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" checked={data.public} onChange={(e) => post('hall', { public: e.target.checked })} className="h-5 w-5 accent-[var(--color-gold)]" />List me in the Hall of the Sky (handle, sigil and number only)</label>
            <Link href="/hall" className="self-start text-sm font-semibold text-gold-lite">Visit the Hall ›</Link>
          </section>
        </>
      )}

      <section aria-labelledby="letter" className={card}>
        <h2 id="letter" className="font-display text-xl font-bold">A letter from the founder</h2>
        <div className="whitespace-pre-line rounded-2xl bg-deep p-4 text-[15px] leading-relaxed text-muted">{CELESTIAL_LETTER}</div>
        <h3 className="font-semibold">{convergent ? 'For the Convergent' : 'A second letter waits at the end of the Seven Paths.'}</h3>
        {convergent && <div className="whitespace-pre-line rounded-2xl border border-gold bg-deep p-4 text-[15px] leading-relaxed text-muted">{CONVERGENT_LETTER}</div>}
      </section>

      <section aria-labelledby="merch" className={card}>
        <h2 id="merch" className="font-display text-xl font-bold">Celestial merch</h2>
        <p className="text-sm text-muted">Something you can hold is being designed for Celestials. When it&apos;s ready, you&apos;ll be asked where to send it. We won&apos;t ask for your address until then.</p>
      </section>
    </div>
  );
}
