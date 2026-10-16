'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { MIN_CIRCLE, REACTIONS, type ReactionId } from '@/lib/circles';
import { XP } from '@/lib/progress';
import { localToday, useAppStore } from '@/lib/store';

interface CircleView {
  key: string; name: string; blurb: string; members: number; open: boolean;
  today: { checked: number; nailed: number; kinda: number; nope: number; avg: number | null } | null;
  week: { checkins: number; goal: number; won: boolean } | null;
  reactions: Record<ReactionId, number> | null; mine: ReactionId | null;
}
interface Data { optOut: boolean; monday: string; question: { q: string; a: [string, string, string] }; circles: CircleView[] }

/** The Cosmos, step one: anonymous Circles from your chart. Counted, never named. */
export default function Cosmos() {
  const { state, winCircle } = useAppStore();
  const { user, ready } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { date } = localToday();

  const load = useCallback(() => {
    fetch('/api/cosmos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input: state.profile.input, date }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setData(d); })
      .catch((e) => setErr(e.message));
  }, [state.profile.input, date]);
  useEffect(() => { if (user) load(); }, [user, load]);

  // A Circle that hit its weekly goal pays everyone in it +40 XP, once.
  useEffect(() => {
    if (!data) return;
    for (const c of data.circles) if (c.week?.won) winCircle(data.monday, c.key);
  }, [data, winCircle]);

  const post = async (body: Record<string, unknown>) => {
    await fetch('/api/cosmos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, date }) });
    load();
  };

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl">
      <header>
        <h1 className="font-display text-[26px] font-bold">The Cosmos</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">Your Circles: everyone on Orbori who shares a piece of your chart. You&apos;re counted, never named. Stats appear once a Circle has {MIN_CIRCLE} people.</p>
      </header>

      {ready && !user && (
        <p className="rounded-2xl border border-gold bg-night p-4 text-sm">The Cosmos needs an account so your Circles can count you. <Link href={`/signin?next=${encodeURIComponent('/cosmos')}`} className="font-semibold text-gold-lite">Sign in ›</Link></p>
      )}
      {err && err !== 'signin' && <p role="alert" className="text-sm text-mauve-lite">{err}</p>}
      {user && !data && !err && <div className="h-48 animate-pulse rounded-3xl bg-night" aria-label="Loading your Circles" />}

      {data && (
        <>
          <p className="rounded-2xl bg-night px-4 py-3 text-sm"><span className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">TONIGHT&apos;S CIRCLE QUESTION</span><br />{data.question.q} {REACTIONS.map((r, i) => <span key={r.id} className="mr-2 whitespace-nowrap text-muted">{r.emoji} {data.question.a[i]}</span>)}</p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.circles.map((c) => {
              const t = c.today;
              const total = t ? t.nailed + t.kinda + t.nope : 0;
              const reacted = (c.reactions ? Object.values(c.reactions).reduce((a, b) => a + b, 0) : 0);
              return (
                <li key={c.key} className="flex flex-col gap-3 rounded-3xl border border-royal bg-night p-5">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-display text-xl font-bold">{c.name}</h2>
                      <span className="font-mono text-[11px] text-muted">{c.open ? `${c.members.toLocaleString('en-US')} here` : `${c.members} of ${MIN_CIRCLE}`}</span>
                    </div>
                    <p className="text-sm text-muted">{c.blurb}</p>
                  </div>

                  {!c.open ? (
                    <div className="flex flex-col gap-2 rounded-2xl bg-deep p-3 text-sm text-muted">
                      <p>This Circle is still gathering. Stats open at {MIN_CIRCLE} people so nobody can be picked out.</p>
                      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${(c.members / MIN_CIRCLE) * 100}%` }} /></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5 rounded-2xl bg-deep p-3 text-sm">
                        <p className="text-muted">Today {t!.checked} checked in{t!.avg != null ? ` · Council average ${t!.avg.toFixed(1)}` : ''}</p>
                        {total > 0 && (
                          <>
                            <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-line">
                              <span className="bg-gold" style={{ width: `${(t!.nailed / total) * 100}%` }} /><span className="bg-royal" style={{ width: `${(t!.kinda / total) * 100}%` }} /><span className="bg-mauve" style={{ width: `${(t!.nope / total) * 100}%` }} />
                            </div>
                            <p className="text-xs text-dim">{Math.round((t!.nailed / total) * 100)}% nailed it · {Math.round((t!.kinda / total) * 100)}% kinda · {Math.round((t!.nope / total) * 100)}% nope</p>
                          </>
                        )}
                      </div>
                      {c.week && (
                        <div className="flex flex-col gap-1.5 text-sm">
                          <div className="flex justify-between gap-2"><span className={c.week.won ? 'text-gold-lite' : 'text-muted'}>{c.week.won ? '✦ Weekly challenge won' : 'Weekly challenge'}: {c.week.checkins} / {c.week.goal} check-ins</span><span className="font-mono text-[11px] text-gold-lite">+{XP.challenge} XP</span></div>
                          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (c.week.checkins / c.week.goal) * 100)}%` }} /></div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-2" role="group" aria-label={`Answer tonight's question for ${c.name}`}>
                    {REACTIONS.map((r, i) => (
                      <button key={r.id} type="button" onClick={() => post({ action: 'react', circle: c.key, reaction: r.id })} aria-pressed={c.mine === r.id}
                        className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border text-sm ${c.mine === r.id ? 'border-gold-lite bg-royal' : 'border-line-2 hover:border-gold'}`}>
                        <span aria-hidden="true">{r.emoji}</span><span className="sr-only">{data.question.a[i]}</span>
                        {c.mine && c.reactions && reacted >= 5 && <span className="font-mono text-[11px] text-muted">{Math.round((c.reactions[r.id] / reacted) * 100)}%</span>}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={!data.optOut} onChange={(e) => post({ action: 'optout', value: !e.target.checked })} className="h-5 w-5 accent-[var(--color-gold)]" />
            Count my check-ins in my Circles&apos; stats (always anonymous)
          </label>
          <p className="text-xs text-dim">Posts in Circles are coming once The Cosmos is busier.</p>
        </>
      )}
    </div>
  );
}
