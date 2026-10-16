'use client';
import { useMemo, useState } from 'react';
import { DAY_SIGNS, directionOf, signIndex, tzolkin } from '@/lib/astro/mayan';
import { NAWAL_PROFILE, NUMBER_LINE, TONE_PROFILE, TZOLKIN_LINE } from '@/lib/content';
import { localToday } from '@/lib/store';

const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const nice = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Learn all 13 tones and 20 nawales, with yours and today's marked. Free for everyone. */
export function CholQijLibrary({ birth }: { birth: { number: number; daySign: string } }) {
  const today = localToday().date;
  const now = useMemo(() => tzolkin(today), [today]);
  const [view, setView] = useState<'nawal' | 'tone'>('nawal');
  const [nawal, setNawal] = useState(now.daySign);
  const [tone, setTone] = useState(now.number);

  /** Next date (from tomorrow) when a nawal or a tone comes round again. */
  const nextNawal = (sign: string) => addDays(today, ((signIndex(sign) - signIndex(now.daySign) + 19) % 20) + 1);
  const nextTone = (n: number) => addDays(today, ((n - now.number + 12) % 13) + 1);

  const s = DAY_SIGNS[signIndex(nawal)];
  const p = NAWAL_PROFILE[nawal];
  const dir = directionOf(signIndex(nawal));
  const t = TONE_PROFILE[tone];
  const tag = (mine: boolean, isToday: boolean) => (
    <>
      {mine && <span className="rounded-full border border-mauve px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-mauve-lite">YOURS</span>}
      {isToday && <span className="rounded-full border border-gold px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-gold-lite">TODAY</span>}
    </>
  );

  return (
    <section aria-labelledby="cq-library" className="flex flex-col gap-4 rounded-[22px] bg-night p-[18px]">
      <div>
        <h2 id="cq-library" className="font-display text-[19px] font-bold">Learn the count</h2>
        <p className="mt-1 text-sm text-muted">The Chol Q&apos;ij turns 13 tones with 20 nawales, making 260 days. Tap any one to explore it.</p>
      </div>
      <div role="tablist" aria-label="Tones or nawales" className="flex gap-1.5">
        {([['nawal', 'The 20 nawales'], ['tone', 'The 13 tones']] as const).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)}
            className={`min-h-10 rounded-full border px-4 text-sm font-medium ${view === k ? 'border-gold-lite bg-royal text-starlight' : 'border-line-2 text-muted hover:text-starlight'}`}>{label}</button>
        ))}
      </div>

      {view === 'nawal' ? (
        <div role="tabpanel" aria-label="The 20 nawales" className="flex flex-col gap-4">
          <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {DAY_SIGNS.map((d) => {
              const on = d.kiche === nawal;
              const mine = d.kiche === birth.daySign;
              const isToday = d.kiche === now.daySign;
              return (
                <li key={d.kiche}>
                  <button type="button" aria-pressed={on} onClick={() => setNawal(d.kiche)}
                    className={`flex min-h-14 w-full flex-col items-center justify-center rounded-xl border px-1 py-2 text-center ${on ? 'border-gold-lite bg-royal' : mine ? 'border-mauve bg-deep' : isToday ? 'border-gold bg-deep' : 'border-line bg-deep hover:border-line-2'}`}>
                    <span className="text-[13px] font-semibold leading-tight">{d.kiche}</span>
                    <span className="text-[10px] leading-tight text-dim">{d.english}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <article aria-live="polite" className="flex flex-col gap-3 rounded-2xl bg-deep p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold">{s.kiche}</h3>
              <span className="text-sm text-muted">{s.english}</span>
              {tag(nawal === birth.daySign, nawal === now.daySign)}
            </div>
            <p className="text-sm leading-relaxed">{TZOLKIN_LINE[nawal]}</p>
            <dl className="flex flex-col gap-2.5 text-sm leading-relaxed">
              <div><dt className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">GIFT</dt><dd className="text-muted">{p.gift}</dd></div>
              <div><dt className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">SHADOW</dt><dd className="text-muted">{p.shadow}</dd></div>
              <div><dt className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">CALLING</dt><dd className="text-muted">{p.calling}</dd></div>
            </dl>
            <p className="text-xs text-dim">
              Nawal {signIndex(nawal) + 1} of 20 · {dir.direction}, {dir.color.toLowerCase()} ({dir.kiche}) ·{' '}
              {nawal === now.daySign ? `today is ${now.label}` : `next ${s.kiche} day: ${nice(nextNawal(nawal))}`}
            </p>
          </article>
        </div>
      ) : (
        <div role="tabpanel" aria-label="The 13 tones" className="flex flex-col gap-4">
          <ul className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 md:grid-cols-13">
            {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => {
              const on = n === tone;
              const mine = n === birth.number;
              const isToday = n === now.number;
              return (
                <li key={n}>
                  <button type="button" aria-pressed={on} aria-label={`Tone ${n}, ${TONE_PROFILE[n].kiche}`} onClick={() => setTone(n)}
                    className={`flex min-h-14 w-full flex-col items-center justify-center rounded-xl border py-2 ${on ? 'border-gold-lite bg-royal' : mine ? 'border-mauve bg-deep' : isToday ? 'border-gold bg-deep' : 'border-line bg-deep hover:border-line-2'}`}>
                    <span className="font-mono text-lg font-bold leading-none">{n}</span>
                    <span className="mt-1 text-[10px] leading-tight text-dim">{TONE_PROFILE[n].kiche}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <article aria-live="polite" className="flex flex-col gap-3 rounded-2xl bg-deep p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold">{tone} · {t.kiche}</h3>
              <span className="text-sm text-muted">{NUMBER_LINE[tone]} · {t.strength.toLowerCase()}</span>
              {tag(tone === birth.number, tone === now.number)}
            </div>
            <p className="text-sm leading-relaxed">{t.essence}</p>
            <dl className="flex flex-col gap-2.5 text-sm leading-relaxed">
              <div><dt className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">ON A {tone} DAY</dt><dd className="text-muted">{t.day}</dd></div>
              <div><dt className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">BORN ON A {tone}</dt><dd className="text-muted">{t.born}</dd></div>
            </dl>
            <p className="text-xs text-dim">
              {t.strength === 'Gentle' ? 'Low numbers (1–5) are often called gentle.' : t.strength === 'Balanced' ? 'Middle numbers (6–9) are often called balanced.' : 'High numbers (10–13) are often called strong.'}{' '}
              {tone === now.number ? `Today is ${now.label}.` : `Next ${tone} day: ${nice(nextTone(tone))}.`}
            </p>
          </article>
        </div>
      )}
      <p className="text-xs text-dim">In Orbori&apos;s words, following K&apos;iche&apos; day-keeping. Meanings vary between communities and day-keepers.</p>
    </section>
  );
}
