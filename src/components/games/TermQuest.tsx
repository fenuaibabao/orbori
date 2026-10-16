'use client';
import { useEffect, useState } from 'react';
import { makeQuest, type QuestQuestion } from '@/lib/games';

const SECONDS = 15;

/** Guess the term from its definition. Hard mode: same-tradition options and a 15-second clock. */
export function TermQuest({ hard, onFinish, onExit }: { hard: boolean; onFinish: (score: number, total: number) => void; onExit: () => void }) {
  const [qs] = useState<QuestQuestion[]>(() => makeQuest(hard ? 8 : 6, hard));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [done, setDone] = useState(false);
  const q = qs[i];

  useEffect(() => {
    if (!hard || picked || done) return;
    if (left <= 0) { setPicked('__timeout'); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [hard, left, picked, done]);

  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    if (o === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= qs.length) { setDone(true); onFinish(score, qs.length); return; }
    setI(i + 1); setPicked(null); setLeft(SECONDS);
  };

  if (done) {
    const great = score / qs.length >= 0.8;
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="font-mono text-5xl font-bold text-gold-lite">{score}/{qs.length}</p>
        <p className="font-display text-xl font-bold">{great ? 'A true seeker.' : score >= qs.length / 2 ? 'Nicely done.' : 'Every term is a door. Try again?'}</p>
        <button type="button" onClick={onExit} className="mt-2 min-h-11 rounded-full bg-gold px-6 text-sm font-bold text-space">Back to games</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.08em] text-muted">
        <span>QUESTION {i + 1} OF {qs.length} · {q.system.toUpperCase()}</span>
        {hard ? <span className={left <= 5 && !picked ? 'text-mauve-lite' : 'text-gold-lite'} aria-live="polite">{picked ? '' : `${left}s`}</span> : <span className="text-gold-lite">{score} RIGHT</span>}
      </div>
      <p className="rounded-2xl bg-deep p-4 text-[15px] leading-relaxed">{q.clue}</p>
      <p className="text-sm text-muted">Which term is this?</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {q.options.map((o) => {
          const right = picked && o === q.answer;
          const wrong = picked === o && o !== q.answer;
          return (
            <button key={o} type="button" onClick={() => choose(o)} disabled={!!picked}
              className={`min-h-12 rounded-2xl border px-4 py-2 text-left text-sm font-semibold ${right ? 'border-gold-lite bg-royal' : wrong ? 'border-mauve bg-deep text-mauve-lite' : 'border-line-2 bg-night hover:border-gold'} disabled:cursor-default`}>
              {right ? '✦ ' : wrong ? '✕ ' : ''}{o}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="text-sm text-muted">{picked === q.answer ? 'Right.' : picked === '__timeout' ? `Time's up. It was ${q.answer}.` : `It was ${q.answer}.`}</p>
          <button type="button" onClick={next} className="min-h-11 rounded-full bg-gold px-5 text-sm font-bold text-space">{i + 1 >= qs.length ? 'Finish' : 'Next'}</button>
        </div>
      )}
    </div>
  );
}
