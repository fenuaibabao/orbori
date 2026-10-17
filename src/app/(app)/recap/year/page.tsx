'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { activityXp, LEVELS, XP } from '@/lib/progress';
import { isUnlocked } from '@/lib/rewards';
import { localToday, useAppStore } from '@/lib/store';
import { useProgress } from '@/lib/use-progress';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const toDay = (d: string) => Date.parse(`${d}T00:00:00Z`) / 86400000;
const pretty = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Your year in the stars (an Oracle reward). */
export default function YearRecap() {
  const { state } = useAppStore();
  const p = useProgress();
  const { date: today } = localToday();
  const years = useMemo(() => {
    const ys = new Set([today.slice(0, 4), ...Object.keys(state.checkIns).map((d) => d.slice(0, 4)), ...Object.keys(state.journal ?? {}).map((d) => d.slice(0, 4))]);
    return [...ys].sort().reverse();
  }, [state.checkIns, state.journal, today]);
  const [year, setYear] = useState(years[0]);

  const y = useMemo(() => {
    const inYear = (d: string) => d.startsWith(year);
    const days = Object.keys(state.checkIns).filter(inYear).sort();
    const perMonth = MONTHS.map((_, i) => days.filter((d) => +d.slice(5, 7) === i + 1).length);
    let best = 0, run = 0, prev: number | null = null;
    for (const d of days) { const n = toDay(d); run = prev !== null && n - prev === 1 ? run + 1 : 1; best = Math.max(best, run); prev = n; }
    const rated = days.filter((d) => state.checkIns[d].answer !== 'seen').length;
    const nailed = days.filter((d) => state.checkIns[d].answer === 'nailed').length;
    const top = [...days].sort((a, b) => state.checkIns[b].score - state.checkIns[a].score)[0];
    const acts = Object.entries(state.activity ?? {}).filter(([d]) => inYear(d));
    const journal = Object.entries(state.journal ?? {}).filter(([d, e]) => inYear(d) && e.text.trim());
    const words = journal.reduce((s, [, e]) => s + e.text.trim().split(/\s+/).length, 0);
    const xp = days.length * XP.checkIn + acts.reduce((s, [, a]) => s + activityXp(a), 0);
    return {
      nights: days.length, perMonth, best, nailed, rated, top, xp, words, entries: journal.length,
      terms: acts.reduce((s, [, a]) => s + (a.terms?.length ?? 0), 0),
      games: acts.reduce((s, [, a]) => s + (a.games?.length ?? 0), 0),
      busiest: perMonth.indexOf(Math.max(...perMonth)),
    };
  }, [state, year]);

  if (!isUnlocked(p.levelIndex, 'year-recap')) {
    return (
      <div className="flex flex-col gap-4 lg:max-w-3xl">
        <h1 className="font-display text-[26px] font-bold">Your year in the stars</h1>
        <p className="text-muted">Your yearly recap unlocks at Oracle ({LEVELS[3].xp.toLocaleString('en-US')} XP). You&apos;re {(LEVELS[3].xp - p.xp).toLocaleString('en-US')} XP away.</p>
        <Link href="/rewards" className="self-start text-sm font-semibold text-gold-lite">See all rewards ›</Link>
      </div>
    );
  }

  const max = Math.max(1, ...y.perMonth);
  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.1em] text-gold-lite">ORACLE REWARD</p>
          <h1 className="font-display text-[26px] font-bold">Your {year} in the stars</h1>
        </div>
        {years.length > 1 && (
          <div role="tablist" aria-label="Year" className="flex gap-1.5">
            {years.map((x) => <button key={x} type="button" role="tab" aria-selected={x === year} onClick={() => setYear(x)} className={`min-h-10 rounded-full border px-3.5 font-mono text-sm ${x === year ? 'border-gold-lite bg-royal' : 'border-line-2 text-muted'}`}>{x}</button>)}
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {[
          ['Nights checked in', String(y.nights)], ['Longest streak', `${y.best} ${y.best === 1 ? 'night' : 'nights'}`], ['XP earned', `+${y.xp.toLocaleString('en-US')}`],
          ['Journal entries', `${y.entries} · ${y.words.toLocaleString('en-US')} words`], ['Terms explored', String(y.terms)], ['Games finished', String(y.games)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-night p-3.5">
            <p className="font-mono text-lg font-bold text-gold-lite">{v}</p>
            <p className="mt-0.5 text-xs text-muted">{k}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="months" className="flex flex-col gap-3 rounded-3xl bg-night p-5">
        <h2 id="months" className="font-display text-lg font-bold">Nights by month</h2>
        <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`Check-ins by month: ${MONTHS.map((m, i) => `${m} ${y.perMonth[i]}`).join(', ')}`}>
          {y.perMonth.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-dim">{n || ''}</span>
              <div className={`w-full rounded-t-md ${i === y.busiest && n ? 'bg-gold-lite' : 'bg-gold/70'}`} style={{ height: `${(n / max) * 100}px`, minHeight: n ? 4 : 0 }} />
              <span className="text-[10px] text-muted">{MONTHS[i][0]}</span>
            </div>
          ))}
        </div>
      </section>

      {y.nights > 0 && (
        <p className="rounded-2xl border border-gold bg-night p-4 text-[15px] leading-relaxed">
          {y.perMonth[y.busiest] > 0 && <>{MONTHS[y.busiest]} was your most faithful month. </>}
          {y.rated > 0 && <>On the {y.rated} {y.rated === 1 ? 'day' : 'days'} you rated, the Council read you right {y.nailed} {y.nailed === 1 ? 'time' : 'times'} ({Math.round((y.nailed / y.rated) * 100)}%).</>}
          {y.top && <> Your brightest day was {pretty(y.top)}, scoring {state.checkIns[y.top].score.toFixed(1)}.</>}
        </p>
      )}
      <Link href="/recap" className="self-start text-sm font-semibold text-gold-lite">See this week ›</Link>
    </div>
  );
}
