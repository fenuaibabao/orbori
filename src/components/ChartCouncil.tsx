'use client';
import { useMemo } from 'react';
import type { Chart } from '@/lib/astro/types';
import { chartRead, THEME, TRADITION_NAME, TRADITIONS } from '@/lib/council/chart-read';

const Chev = () => (
  <span aria-hidden="true" className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gold text-space transition-transform group-open:rotate-180">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

/** The Council on you: what the seven traditions agree on about your whole chart. */
export function ChartCouncil({ chart }: { chart: Chart }) {
  const r = useMemo(() => chartRead(chart), [chart]);
  return (
    <section aria-labelledby="council-you" className="flex flex-col gap-3">
      <div className="rounded-3xl border border-gold bg-[radial-gradient(120%_90%_at_50%_0%,#2b2380_0%,var(--color-night)_70%)] p-5 shadow-[0_0_30px_rgba(212,162,76,0.18)]">
        <p className="font-mono text-[10px] font-bold tracking-[0.13em] text-gold-lite">THE COUNCIL ON YOU</p>
        <h2 id="council-you" className="mt-2 font-display text-[23px] font-bold leading-tight">{r.headline}</h2>
        <p className="mt-1.5 text-sm text-muted">All seven traditions read your birth chart. Here&apos;s what most of them see.</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label={`${r.agreeCount} of 7 agree`}>
          {TRADITIONS.map((t) => (
            <span key={t} title={TRADITION_NAME[t]}
              className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold ${r.agree[t] ? 'bg-gold text-space shadow-[0_0_10px_rgba(212,162,76,0.6)]' : 'bg-differ text-white'}`}>
              {TRADITION_NAME[t][0]}
            </span>
          ))}
          <span className="ml-auto font-mono text-[13px] font-extrabold text-gold-lite">{r.agreeCount} OF 7 AGREE</span>
        </div>
      </div>

      <h3 className="mt-1 font-display text-[17px] font-bold">What they agree on</h3>
      {r.themes.map((th, i) => (
        <details key={th.trait} open={i === 0} className="group overflow-hidden rounded-[18px] border border-line bg-night">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 [&::-webkit-details-marker]:hidden">
            <span className="w-12 flex-none"><b className="block font-mono text-lg text-gold-lite">{th.count}/7</b><span className="text-[10px] text-muted">agree</span></span>
            <span className="flex-1"><b className="block text-[15px]">{THEME[th.trait].title}</b><span className="text-[13px] text-muted">{THEME[th.trait].sub}</span></span>
            <Chev />
          </summary>
          <ul className="px-3.5 pb-3">
            {th.voices.map((v) => (
              <li key={v.tradition} className="flex gap-2.5 border-t border-line py-2 text-[13px]">
                <i className="mt-1.5 h-2 w-2 flex-none rounded-full bg-gold" />
                <span><b>{TRADITION_NAME[v.tradition]}</b> <span className="text-muted">· {v.why}</span></span>
              </li>
            ))}
          </ul>
        </details>
      ))}

      {r.differs.length > 0 && <h3 className="mt-1 font-display text-[17px] font-bold">Where {r.differs.length === 1 ? 'one differs' : `${r.differs.length} differ`}</h3>}
      {r.differs.map((d) => (
        <div key={d.tradition} className="rounded-[18px] border border-differ bg-[rgba(229,72,77,0.08)] p-3.5">
          <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-differ-lite">◐ DIFFERS · {TRADITION_NAME[d.tradition].toUpperCase()}</p>
          <p className="mt-1.5 text-sm">
            <b>{TRADITION_NAME[d.tradition]} sees you as {d.traits.map((t) => THEME[t].adj).join(' and ')}.</b>{' '}
            <span className="text-muted">{d.why} Both can be true: it&apos;s another side of you.</span>
          </p>
        </div>
      ))}
    </section>
  );
}
