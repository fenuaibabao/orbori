'use client';
import { useState } from 'react';

export interface Round { prompt: React.ReactNode; question?: string; options: string[]; answer: string; after?: string; optionLang?: string }

/** A multiple-choice game: one round at a time, a score at the end. */
export function QuizGame({ rounds, onFinish, onExit, verdict }: {
  rounds: Round[]; onFinish: (score: number, total: number) => void; onExit: () => void; verdict?: (score: number, total: number) => string;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const r = rounds[i];

  const choose = (o: string) => { if (picked) return; setPicked(o); if (o === r.answer) setScore((s) => s + 1); };
  const next = () => {
    if (i + 1 >= rounds.length) { setDone(true); onFinish(score, rounds.length); return; }
    setI(i + 1); setPicked(null);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="font-mono text-5xl font-bold text-gold-lite">{score}/{rounds.length}</p>
        <p className="font-display text-xl font-bold">{verdict?.(score, rounds.length) ?? (score === rounds.length ? 'Flawless.' : score >= rounds.length / 2 ? 'Nicely done.' : 'Every round teaches something. Try again?')}</p>
        <button type="button" onClick={onExit} className="mt-2 min-h-11 rounded-full bg-gold px-6 text-sm font-bold text-space">Back to games</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between font-mono text-[11px] tracking-[0.08em] text-muted">
        <span>ROUND {i + 1} OF {rounds.length}</span><span className="text-gold-lite">{score} RIGHT</span>
      </div>
      <div className="rounded-2xl bg-deep p-4">{r.prompt}</div>
      {r.question && <p className="text-sm text-muted">{r.question}</p>}
      <div className="grid grid-cols-2 gap-2">
        {r.options.map((o) => {
          const right = picked && o === r.answer;
          const wrong = picked === o && o !== r.answer;
          return (
            <button key={o} type="button" onClick={() => choose(o)} disabled={!!picked} lang={r.optionLang}
              className={`min-h-12 rounded-2xl border px-3 py-2 text-sm font-semibold ${right ? 'border-gold-lite bg-royal' : wrong ? 'border-mauve bg-deep text-mauve-lite' : 'border-line-2 bg-night hover:border-gold'} disabled:cursor-default`}>
              {right ? '✦ ' : wrong ? '✕ ' : ''}{o}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="text-sm leading-snug text-muted">{picked === r.answer ? 'Right.' : `It was ${r.answer}.`}{r.after ? ` ${r.after}` : ''}</p>
          <button type="button" onClick={next} className="min-h-11 shrink-0 rounded-full bg-gold px-5 text-sm font-bold text-space">{i + 1 >= rounds.length ? 'Finish' : 'Next'}</button>
        </div>
      )}
    </div>
  );
}
