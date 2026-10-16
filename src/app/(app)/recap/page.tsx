'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { activityXp, XP, type Answer } from '@/lib/progress';
import { isUnlocked } from '@/lib/rewards';
import { localToday, useAppStore } from '@/lib/store';
import { useProgress } from '@/lib/use-progress';

const ANSWER: Record<Answer, string> = { nailed: 'Nailed it', kinda: 'Kinda', nope: 'Nope' };
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const dayName = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Week in the stars: the last seven days side by side (a Mystic reward). */
export default function Recap() {
  const { state } = useAppStore();
  const p = useProgress();
  const { date: today } = localToday();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)), [today]);

  const rows = days.map((d) => {
    const c = state.checkIns[d];
    const j = state.journal?.[d];
    const a = state.activity?.[d];
    return { d, c, j, a, xp: (c ? XP.checkIn : 0) + activityXp(a) };
  });
  const checked = rows.filter((r) => r.c);
  const best = [...checked].sort((x, y) => y.c!.score - x.c!.score)[0];
  const nailed = checked.filter((r) => r.c!.answer === 'nailed').length;
  const weekXp = rows.reduce((s, r) => s + r.xp, 0);
  const wrote = rows.filter((r) => r.j?.text.trim()).length;
  const terms = rows.reduce((s, r) => s + (r.a?.terms?.length ?? 0), 0);
  const games = rows.reduce((s, r) => s + (r.a?.games?.length ?? 0), 0);

  if (!isUnlocked(p.levelIndex, 'week-recap')) {
    return (
      <div className="flex flex-col gap-4 lg:max-w-3xl">
        <h1 className="font-display text-[26px] font-bold">Week in the stars</h1>
        <p className="text-muted">Your weekly recap unlocks at Mystic (800 XP). You&apos;re {(800 - p.xp).toLocaleString('en-US')} XP away.</p>
        <Link href="/rewards" className="self-start text-sm font-semibold text-gold-lite">See all rewards ›</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header>
        <p className="font-mono text-[11px] tracking-[0.1em] text-gold-lite">{dayName(days[0]).toUpperCase()} – {dayName(today).toUpperCase()}</p>
        <h1 className="font-display text-[26px] font-bold">Week in the stars</h1>
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          ['Nights checked in', `${checked.length} / 7`],
          ['XP this week', `+${weekXp}`],
          ['Journal entries', String(wrote)],
          ['Terms & games', `${terms} · ${games}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-night p-3.5">
            <p className="font-mono text-xl font-bold text-gold-lite">{v}</p>
            <p className="mt-0.5 text-xs text-muted">{k}</p>
          </div>
        ))}
      </div>

      {checked.length > 0 && (
        <p className="rounded-2xl border border-gold bg-night p-4 text-[15px] leading-relaxed">
          {best && <>Your highest-scoring day was <strong className="text-gold-lite">{dayName(best.d)}</strong> at {best.c!.score.toFixed(1)}. </>}
          The Council landed for you {nailed} {nailed === 1 ? 'time' : 'times'} out of {checked.length}
          {checked.length >= 3 ? (nailed / checked.length >= 0.6 ? ', a week when the stars read you well.' : nailed / checked.length <= 0.3 ? ', a week that kept its own counsel. Worth noticing what was different.' : ', a mixed week, which is honest.') : '.'}
        </p>
      )}

      <ol className="flex flex-col gap-2.5">
        {rows.slice().reverse().map(({ d, c, j, xp }) => (
          <li key={d} className="flex flex-col gap-2 rounded-2xl bg-night p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">{dayName(d).toUpperCase()}{d === today ? ' · TODAY' : ''}</h2>
              <span className="font-mono text-[11px] text-dim">{xp ? `+${xp} XP` : '—'}</span>
            </div>
            {j?.reading && <p className="text-sm"><span className="font-mono text-gold-lite">{j.reading.score.toFixed(1)}</span> <span className="text-muted">· {j.reading.headline}</span></p>}
            {c ? <p className="text-sm text-muted">Checked in: <strong className="text-starlight">{ANSWER[c.answer]}</strong>{!j?.reading ? ` · score ${c.score.toFixed(1)}` : ''}</p> : <p className="text-sm text-dim">No check-in.</p>}
            {j?.text.trim() && <p className="line-clamp-3 whitespace-pre-wrap text-sm italic leading-relaxed text-muted">&ldquo;{j.text.trim()}&rdquo;</p>}
          </li>
        ))}
      </ol>
      <Link href="/journal" className="self-start text-sm font-semibold text-gold-lite">Open your journal ›</Link>
    </div>
  );
}
