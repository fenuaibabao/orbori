'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FlameIcon, ShareIcon } from '@/components/icons';
import { Logo } from '@/components/Logo';
import { Sigil } from '@/components/Sigil';
import { Bar, Eyebrow, Tag } from '@/components/ui';
import { useChart, useToday } from '@/lib/hooks';
import { handleFromSeed } from '@/lib/identity';
import { computeProgress, type Answer } from '@/lib/progress';
import { big3, cardUrl, shareCard } from '@/lib/share';
import { localToday, useAppStore } from '@/lib/store';

const ANSWERS: [Answer, string][] = [['nailed', 'Nailed it'], ['kinda', 'Kinda'], ['nope', 'Nope']];

export default function Today() {
  const { state, checkIn } = useAppStore();
  const profile = state.profile;
  const { reading, error } = useToday(profile);
  const { data } = useChart(profile);
  const { date } = localToday();
  const progress = useMemo(() => computeProgress(state.checkIns, date), [state.checkIns, date]);
  const today = state.checkIns[date];
  const [justAnswered, setJustAnswered] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  const pretty = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase().replace(',', ' ·');

  const answer = (a: Answer) => {
    if (!reading) return;
    checkIn(date, a, reading.score);
    setJustAnswered(true);
  };

  const shareScore = async () => {
    if (!reading || !data) return;
    setShareStatus('Preparing your card…');
    const url = cardUrl('score', {
      handle: handleFromSeed(profile.seed), seed: profile.seed, big3: big3(data.chart),
      score: reading.score.toFixed(1), headline: reading.headline, date: pretty, agree: reading.agreeCount,
    });
    const r = await shareCard(url, `My Convergence Score today: ${reading.score.toFixed(1)}/10`, 'orbori-today.png');
    setShareStatus(r === 'downloaded' ? 'Saved to your downloads.' : r === 'shared' ? 'Shared.' : '');
  };

  const segments = reading ? Math.round(reading.score) : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="lg:hidden"><Logo size={28} /></span>
          <span className="hidden font-mono text-xs tracking-[0.08em] text-gold-lite lg:block">{pretty} · TODAY&apos;S COSMIC COUNCIL</span>
          <div className="flex items-center gap-2">
            <Link href="/profile" aria-label={`${progress.streak}-night check-in streak`}
              className="flex h-9 items-center gap-1.5 rounded-full border border-royal bg-night pl-2 pr-3">
              <FlameIcon /><span className="font-mono text-sm font-bold">{progress.streak}</span>
            </Link>
            <Link href="/chart" aria-label="My chart" className="rounded-full"><Sigil seed={profile.seed} size={40} /></Link>
          </div>
        </div>
        <Link href="/profile" aria-label="Level progress" className="flex flex-col gap-1.5 lg:w-80 lg:self-end">
          <div className="flex justify-between gap-4 font-mono text-[11px] tracking-[0.06em]">
            <span><span className="text-muted lg:hidden">{pretty} · </span><span className="text-gold-lite">{progress.level.toUpperCase()}</span></span>
            <span className="text-muted">{progress.xp.toLocaleString('en-US')}{progress.nextLevel ? ` / ${progress.nextLevel.xp.toLocaleString('en-US')} XP` : ' XP'}</span>
          </div>
          <Bar value={progress.levelProgress} />
        </Link>
      </header>

      {error && <p role="alert" className="text-mauve-lite">{error}</p>}
      {!reading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-night" aria-label="Loading today's reading" />
      ) : (
        <>
          <section aria-labelledby="council" className="flex flex-col gap-1">
            <div className="lg:hidden"><Eyebrow>TODAY&apos;S COSMIC COUNCIL</Eyebrow></div>
            <h1 id="council" className="font-display text-[28px] font-bold leading-[1.15] lg:text-[40px]">{reading.headline}</h1>
          </section>

          {/* Mobile: score, systems, then the check-in last. Desktop: score + check-in side by side. */}
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:gap-4">
            <section aria-label="Convergence score" className="flex flex-col gap-4 rounded-3xl border border-royal bg-night p-[22px] lg:col-span-2">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-[13px] font-semibold text-muted">Convergence Score</p>
                  <p className="whitespace-nowrap font-mono font-bold leading-none text-gold-lite">
                    <span className="text-[72px] lg:text-[88px]">{reading.score.toFixed(1)}</span>
                    <span className="text-xl text-dim"> /10</span>
                  </p>
                </div>
                <p className="mb-2 max-w-[130px] text-right text-[13px] leading-snug">{reading.agreeCount} of 5 systems are on the same page today.</p>
              </div>
              <div aria-hidden="true" className="grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className={`h-2 rounded ${i < segments ? 'bg-gold' : 'bg-line'}`} />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1 rounded-[14px] bg-deep p-3">
                  <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-gold-lite">WHERE THEY AGREE</span>
                  <span className="text-sm leading-snug">{reading.agreeText}</span>
                </div>
                {reading.holdoutText && (
                  <div className="flex flex-col gap-1 rounded-[14px] bg-deep p-3">
                    <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-mauve-lite">{reading.agreeCount === 4 ? 'THE HOLDOUT' : 'THE HOLDOUTS'}</span>
                    <span className="text-sm leading-snug">{reading.holdoutText}</span>
                  </div>
                )}
              </div>
              <button type="button" onClick={shareScore}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold text-sm font-semibold hover:border-gold-lite">
                <ShareIcon className="text-gold-lite" />Share today&apos;s score
              </button>
              {shareStatus && <p aria-live="polite" className="-mt-2 text-center text-sm text-gold-lite">{shareStatus}</p>}
            </section>

            <section aria-labelledby="land" className="flex flex-col gap-3.5 rounded-3xl border border-royal bg-night p-5 order-last lg:order-none lg:self-start">
              <div>
                <h2 id="land" className="font-display text-xl font-bold">Did it land?</h2>
                <p className="mt-1 text-[13px] text-muted">One tap tonight. It trains your Council and keeps your streak alive.</p>
              </div>
              <div className="flex gap-2">
                {ANSWERS.map(([a, label]) => (
                  <button key={a} type="button" onClick={() => answer(a)} aria-pressed={today?.answer === a}
                    className={`min-h-12 flex-1 rounded-full border text-sm font-semibold ${today?.answer === a ? 'border-gold-lite bg-royal' : 'border-royal hover:border-gold-lite'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {today && (
                <div role="status" className={`${justAnswered ? 'anim-pop' : ''} flex flex-col gap-3 rounded-[18px] border border-gold bg-deep p-4`}>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-xl bg-night p-2.5 text-center">
                      <p className="font-mono text-xl font-bold text-gold-lite">+10 XP</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {progress.nextLevel ? `${progress.level}, ${(progress.nextLevel.xp - progress.xp).toLocaleString('en-US')} to ${progress.nextLevel.name}` : progress.level}
                      </p>
                    </div>
                    <div className="flex-1 rounded-xl bg-night p-2.5 text-center">
                      <p className="font-mono text-xl font-bold text-gold-lite">{progress.streak} {progress.streak === 1 ? 'night' : 'nights'}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{progress.streak < 7 ? `Streak +1 · 7-Night Watch at 7` : progress.streak < 30 ? 'Streak +1 · 30-night badge at 30' : 'Streak +1 · legendary'}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-snug text-muted">
                    Thanks for reporting back. Your Circle&apos;s crowd stats arrive with The Cosmos.
                  </p>
                </div>
              )}
            </section>

          <section aria-labelledby="systems" className="flex flex-col gap-3 lg:col-span-3 lg:mt-2">
            <h2 id="systems" className="font-display text-xl font-bold">What each system says</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reading.systems.map((s) => (
                <article key={s.system} className={`flex flex-col gap-2.5 rounded-[20px] bg-night p-[18px] ${s.agrees ? '' : 'border border-mauve'}`}>
                  <div className="flex items-center justify-between">
                    <Tag>{s.label}</Tag>
                    <span className={`font-mono text-[11px] font-bold tracking-[0.06em] ${s.agrees ? 'text-gold-lite' : 'text-mauve-lite'}`}>
                      {s.agrees ? '● AGREES' : '◐ DISSENTS'}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-semibold">{s.headline}</h3>
                  <p className="text-sm leading-relaxed text-muted">{s.body}</p>
                  {s.why && <p className="text-[13px] text-mauve-lite">{s.why}</p>}
                </article>
              ))}
            </div>
          </section>
          </div>
        </>
      )}
    </div>
  );
}
