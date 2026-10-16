'use client';
import { buzz } from '@/lib/haptics';
import { useState } from 'react';
import { ANIMALS } from '@/lib/astro/chinese';
import { shuffle } from '@/lib/games';

/** Chinese zodiac: tap the twelve animals in the order they finished the Great Race. */
export function GreatRace({ onFinish, onExit }: { onFinish: (mistakes: number) => void; onExit: () => void }) {
  const [grid] = useState(() => shuffle([...ANIMALS]));
  const [n, setN] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [miss, setMiss] = useState<string | null>(null);
  const done = n === ANIMALS.length;

  const tap = (a: string) => {
    if (done || ANIMALS.indexOf(a) < n) return;
    if (a === ANIMALS[n]) {
      setN(n + 1); setMiss(null);
      if (n + 1 === ANIMALS.length) { buzz('win'); onFinish(mistakes); } else buzz('right');
    } else { setMistakes((m) => m + 1); setMiss(a); buzz('wrong'); }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="font-mono text-5xl font-bold text-gold-lite">{mistakes}</p>
        <p className="font-display text-xl font-bold">{mistakes === 0 ? 'You know the race by heart.' : mistakes <= 4 ? 'Across the river with a few splashes.' : 'Every animal made it home.'}</p>
        <p className="text-sm text-muted">{mistakes === 1 ? 'mistake' : 'mistakes'} · Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig</p>
        <button type="button" onClick={onExit} className="mt-2 min-h-11 rounded-full bg-gold px-6 text-sm font-bold text-space">Back to games</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between font-mono text-[11px] tracking-[0.08em] text-muted">
        <span>{n} OF 12 HOME</span><span className="text-gold-lite">{mistakes} MISTAKES</span>
      </div>
      <p className="text-sm text-muted">The Jade Emperor called a race across the river; the order the animals finished set the zodiac. Tap them in order, first to last.</p>
      <ol aria-label="Finished so far" className="flex min-h-9 flex-wrap gap-1.5">
        {ANIMALS.slice(0, n).map((a, i) => <li key={a} className="rounded-full bg-royal px-2.5 py-1 font-mono text-[11px]">{i + 1}. {a}</li>)}
      </ol>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {grid.map((a) => {
          const home = ANIMALS.indexOf(a) < n;
          return (
            <li key={a}>
              <button type="button" onClick={() => tap(a)} disabled={home}
                className={`min-h-14 w-full rounded-2xl border text-sm font-semibold ${home ? 'border-gold bg-royal/50 text-gold-lite' : miss === a ? 'border-mauve bg-deep text-mauve-lite' : 'border-line-2 bg-deep hover:border-gold'}`}>
                {home ? `✦ ${a}` : a}
              </button>
            </li>
          );
        })}
      </ul>
      {miss && <p role="status" className="text-sm text-mauve-lite">Not yet: {miss} finished {ANIMALS.indexOf(miss) + 1}{['st', 'nd', 'rd'][ANIMALS.indexOf(miss)] ?? 'th'}.</p>}
    </div>
  );
}
