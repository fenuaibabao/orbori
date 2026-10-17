'use client';
import { useMemo, useState } from 'react';
import { ADVICE_LABEL } from '@/lib/convergence';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const nice = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

/** Constellation Days as a calendar: the days glow; tap one to see it and add it to your calendar. */
export function GroupCalendar({ days, today, names, group }: { days: { d: string; adv: string }[]; today: string; names: string[]; group: string | null }) {
  const byDate = useMemo(() => new Map(days.map((g) => [g.d, g])), [days]);
  const first = +today.slice(0, 4) * 12 + (+today.slice(5, 7) - 1);
  const lastDay = days.at(-1)?.d ?? today;
  const last = Math.max(first, +lastDay.slice(0, 4) * 12 + (+lastDay.slice(5, 7) - 1));
  const startAt = days[0] ? +days[0].d.slice(0, 4) * 12 + (+days[0].d.slice(5, 7) - 1) : first;
  const [cur, setCur] = useState(startAt);
  const [sel, setSel] = useState<string | null>(days[0]?.d ?? null);
  const y = Math.floor(cur / 12), m = cur % 12;
  const pad = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
  const key = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const chosen = sel ? byDate.get(sel) : null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setCur(cur - 1)} disabled={cur <= first} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-2 disabled:opacity-30">‹</button>
        <p className="font-display text-base font-bold" aria-live="polite">{MONTHS[m]} {y}</p>
        <button type="button" onClick={() => setCur(cur + 1)} disabled={cur >= last} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-2 disabled:opacity-30">›</button>
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-dim">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: pad }, (_, i) => <span key={`p${i}`} />)}
        {Array.from({ length: n }, (_, i) => {
          const k = key(i + 1), g = byDate.get(k), past = k < today;
          return g ? (
            <button key={k} type="button" onClick={() => setSel(k)} aria-label={`${nice(k)}: Constellation Day`} aria-pressed={sel === k}
              className={`glow-cv aspect-square rounded-xl text-sm font-black text-space bg-[radial-gradient(circle_at_40%_35%,#ffe9b8,#d4a24c_55%,#a2752c)] shadow-[0_0_16px_rgba(212,162,76,0.7)] ${sel === k ? 'outline outline-2 outline-offset-1 outline-starlight' : ''}`}>{i + 1}</button>
          ) : (
            <span key={k} className={`grid aspect-square place-items-center rounded-xl text-sm ${past ? 'text-[#4a4580]' : 'text-muted'} ${k === today ? 'outline outline-[1.5px] outline-royal text-starlight' : ''}`}>{i + 1}</span>
          );
        })}
      </div>
      {chosen ? (
        <div className="rounded-2xl border border-gold-lite bg-night p-3">
          <span className="inline-block rounded-full bg-gold-lite px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.12em] text-space">CONSTELLATION DAY</span>
          <p className="mt-1.5 font-semibold">{nice(chosen.d)} · everyone: <span className="text-gold-lite">{ADVICE_LABEL[chosen.adv].toLowerCase()}</span></p>
          <p className="mt-1 text-xs text-muted">All {names.length} of your Councils give the same strong advice that day.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{names.map((h) => <span key={h} className="rounded-full bg-deep px-2 py-1 text-[11px]">✦ {h}</span>)}</div>
          <a href={`/api/constellation/ics?date=${chosen.d}&adv=${chosen.adv}&name=${encodeURIComponent(group ?? '')}`} className="mt-2 inline-block text-xs font-semibold text-gold-lite">＋ Add to my calendar</a>
        </div>
      ) : <p className="text-xs text-dim">{days.length} Constellation {days.length === 1 ? 'Day' : 'Days'} in the next year. Tap a glowing date.</p>}
    </div>
  );
}
