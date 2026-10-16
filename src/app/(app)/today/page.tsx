'use client';
import { useProgress } from '@/lib/use-progress';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AiReading, closingQuestion } from '@/components/AiReading';
import { InstallPrompt } from '@/components/InstallPrompt';
import { JournalCard } from '@/components/Journal';
import { ShareIcon } from '@/components/icons';
import { Logo } from '@/components/Logo';
import { NudgeBanner } from '@/components/LinkedPeople';
import { MyFlame, MySigil } from '@/components/Rewards';
import { Bar, Eyebrow, Tag } from '@/components/ui';
import { useChart, useToday } from '@/lib/hooks';
import { handleFromSeed } from '@/lib/identity';
import { DAILY_ACTIVITY_CAP, XP, type Answer } from '@/lib/progress';
import { dailyQuestion } from '@/lib/questions';
import { useLinks } from '@/lib/use-links';
import { big3, cardUrl, shareCard } from '@/lib/share';
import { localToday, useAppStore } from '@/lib/store';

const ANSWERS: [Answer, string][] = [['nailed', 'Nailed it'], ['kinda', 'Kinda'], ['nope', 'Nope']];

export default function Today() {
  const { state, checkIn, record } = useAppStore();
  const { links } = useLinks();
  const profile = state.profile;
  const { reading, error } = useToday(profile);
  const { data } = useChart(profile);
  const { date } = localToday();
  const progress = useProgress();
  const today = state.checkIns[date];
  const [justAnswered, setJustAnswered] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [aiText, setAiText] = useState<string | null>(null);

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
    if (r !== 'cancelled') record(date, { share: true });
  };

  const segments = reading ? Math.round(reading.score) : 0;
  const act = state.activity?.[date] ?? {};
  const question = useMemo(() => (reading ? dailyQuestion(date, reading.systems) : null), [reading, date]);
  const answered = act.question?.split(':')[1] ?? null;

  // A Convergence day (all 7 agree) earns the Converged badge just for being here.
  useEffect(() => {
    if (reading?.agreeCount === 7 && !act.converged) record(date, { converged: true });
  }, [reading?.agreeCount, act.converged, date, record]);

  // In sync: you and a linked person both checked in today.
  useEffect(() => {
    if (today && links?.some((l) => l.today.checkedIn)) record(date, { sync: true });
  }, [today, links, date, record]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 lg:hidden"><Logo size={28} /><span className="rounded-full border border-gold px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-gold-lite">BETA</span></span>
          <span className="hidden font-mono text-xs tracking-[0.08em] text-gold-lite lg:block">{pretty} · TODAY&apos;S COSMIC COUNCIL</span>
          <div className="flex items-center gap-2">
            <Link href="/profile" aria-label={`${progress.streak}-night check-in streak`}
              className="flex h-9 items-center gap-1.5 rounded-full border border-royal bg-night pl-2 pr-3">
              <MyFlame /><span className="font-mono text-sm font-bold">{progress.streak}</span>
            </Link>
            <Link href="/chart" aria-label="My chart" className="rounded-full"><MySigil seed={profile.seed} size={40} /></Link>
          </div>
        </div>
        <Link href="/rewards" aria-label="Level progress and rewards" className="flex flex-col gap-1.5 lg:w-80 lg:self-end">
          <div className="flex justify-between gap-4 font-mono text-[11px] tracking-[0.06em]">
            <span><span className="text-muted lg:hidden">{pretty} · </span><span className="text-gold-lite">{progress.level.toUpperCase()}</span></span>
            <span className="text-muted">{progress.xp.toLocaleString('en-US')}{progress.nextLevel ? ` / ${progress.nextLevel.xp.toLocaleString('en-US')} XP` : ' XP'}</span>
          </div>
          <Bar value={progress.levelProgress} />
        </Link>
      </header>
      <NudgeBanner />

      {error && <p role="alert" className="text-mauve-lite">{error}</p>}
      {!reading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-night" aria-label="Loading today's reading" />
      ) : (
        <>
          {reading.agreeCount === 7 && (
            <section aria-label="Full Convergence" className="relative overflow-hidden rounded-3xl border-[1.5px] border-gold-lite bg-[radial-gradient(circle_at_50%_-10%,#6a4fc0_0%,#2a2380_35%,#0d0a35_80%)] px-5 py-6 text-center shadow-[0_0_30px_rgba(212,162,76,0.25)]">
              <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-gold-lite">✦ FULL CONVERGENCE ✦</p>
              <div aria-hidden="true" className="mt-3 flex justify-center gap-1.5">
                {Array.from({ length: 7 }, (_, i) => <span key={i} className="h-4 w-4 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffe2a6,#d4a24c_55%,#a2752c)] shadow-[0_0_10px_rgba(212,162,76,0.6)]" />)}
              </div>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">Every voice on the Council says the same thing today. No holdouts. It happens about as often as a blue moon, and you were here for it: <span className="font-semibold text-gold-lite">Converged badge earned.</span></p>
            </section>
          )}
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
                <div className="mb-2 flex max-w-[140px] flex-col items-end gap-1.5 text-right">
                  {reading.agreeCount >= 6 && <span className="rounded-full border border-gold px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.1em] text-gold-lite">{reading.agreeCount === 7 ? '✦ CONVERGENCE' : '✦ ALIGNMENT'}</span>}
                  <p className="text-[13px] leading-snug">{reading.agreeCount} of {reading.systems.length} voices are on the same page today.</p>
                </div>
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
                    <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-mauve-lite">{reading.systems.length - reading.agreeCount === 1 ? 'THE HOLDOUT' : 'THE HOLDOUTS'}</span>
                    <span className="text-sm leading-snug">{reading.holdoutText}</span>
                  </div>
                )}
              </div>
              <button type="button" onClick={shareScore}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold text-sm font-semibold hover:border-gold-lite">
                <ShareIcon className="text-gold-lite" />Share today&apos;s score
              </button>
              {shareStatus && <p aria-live="polite" className="-mt-2 text-center text-sm text-gold-lite">{shareStatus}</p>}
              <Link href="/convergence" className="-mt-1 text-center text-[13px] font-semibold text-gold-lite">See your glowing days ahead ✦</Link>
            </section>

            <section aria-labelledby="land" className="flex flex-col gap-3.5 rounded-3xl border border-royal bg-night p-5 order-last lg:order-none lg:self-start">
              <div>
                <h2 id="land" className="font-display text-xl font-bold">Did it land?</h2>
                <p className="mt-1 text-[13px] text-muted">One tap tonight. It trains your Council and keeps your streak alive.{progress.knockedBack ? ' You missed last night, so your streak slipped back one. Check in to keep it going.' : ''}</p>
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
                      <p className="font-mono text-xl font-bold text-gold-lite">+{progress.todayXp} XP today</p>
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
                    Thanks for reporting back. Answer today&apos;s question below for +{XP.question} more.
                  </p>
                </div>
              )}
            </section>

          <AiReading profile={profile} onText={setAiText} />
          <JournalCard date={date} prompt={aiText ? closingQuestion(aiText) : null} reading={{
            headline: reading.headline, score: reading.score, agreeCount: reading.agreeCount, voices: reading.systems.length,
            agreeText: reading.agreeText, holdoutText: reading.holdoutText, ai: aiText ?? undefined,
          }} />

          {question && (
            <section aria-labelledby="dq" className="flex flex-col gap-3 rounded-3xl border border-line bg-night p-5 lg:col-span-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="dq" className="font-display text-lg font-bold">Today&apos;s question</h2>
                <span className="font-mono text-[11px] text-gold-lite">+{XP.question} XP</span>
              </div>
              <p className="text-[15px] leading-relaxed">{question.prompt}</p>
              <div className="flex gap-2">
                {question.options.map((o) => (
                  <button key={o.id} type="button" onClick={() => record(date, { question: `${question.system}:${o.id}` })} aria-pressed={answered === o.id}
                    className={`min-h-11 flex-1 rounded-full border text-sm font-semibold ${answered === o.id ? 'border-gold-lite bg-royal' : 'border-royal hover:border-gold-lite'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
              {answered && <p role="status" className="text-xs text-gold-lite">Noted. Your answers build a record of how well each voice reads you.</p>}
            </section>
          )}

          <section aria-labelledby="xp" className="flex flex-col gap-2.5 rounded-3xl border border-line bg-night p-5 lg:col-span-3">
            <div className="flex items-baseline justify-between">
              <h2 id="xp" className="font-display text-lg font-bold">Today&apos;s XP</h2>
              <span className="font-mono text-sm font-bold text-gold-lite">{progress.todayXp} / {XP.checkIn + DAILY_ACTIVITY_CAP}</span>
            </div>
            <ul className="grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-4">
              {([
                ['Check in', !!today, XP.checkIn, null],
                ['Today\'s question', !!act.question, XP.question, null],
                ['Write in your journal', !!act.journal, XP.journal, '/journal'],
                ['Play a minigame', !!act.games?.length, XP.game, '/play'],
                ['Go deeper on a system', !!act.deep, XP.deep, '/chart'],
                ['Learn a new term', !!act.learn, XP.learn, '/learn#next'],
                ['Share a card', !!act.share, XP.share, null],
                ['Nudge a linked person', !!act.nudge, XP.nudge, '/compatibility'],
                ['In sync with a linked person', !!act.sync, XP.sync, '/compatibility'],
              ] as [string, boolean, number, string | null][]).map(([label, done, xp, href]) => {
                const inner = <><span aria-hidden="true" className={done ? 'text-gold-lite' : 'text-dim'}>{done ? '✦' : '○'}</span> <span className={done ? '' : 'text-muted'}>{label}</span> <span className="font-mono text-[11px] text-dim">+{xp}</span></>;
                return <li key={label} className="rounded-xl bg-deep px-3 py-2">{href && !done ? <Link href={href}>{inner}</Link> : inner}</li>;
              })}
            </ul>
            <p className="text-xs text-dim">Extras cap at {DAILY_ACTIVITY_CAP} XP a day. Weekly challenges on your <Link href="/profile" className="text-gold-lite">Profile</Link> add +{XP.challenge} each.</p>
          </section>

          <InstallPrompt />

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
