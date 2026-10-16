'use client';
import { useEffect, useState } from 'react';
import { DAY_SIGNS } from '@/lib/astro/mayan';
import { shuffle } from '@/lib/games';

interface Card { key: string; nawal: string; face: string; kind: 'name' | 'meaning' }

/** Match each K'iche' nawal with its meaning. Fewer moves is better. */
export function NawalPairs({ onFinish, onExit }: { onFinish: (moves: number) => void; onExit: () => void }) {
  const [cards] = useState<Card[]>(() => {
    const six = shuffle(DAY_SIGNS).slice(0, 6);
    return shuffle(six.flatMap((s) => [
      { key: `${s.kiche}-n`, nawal: s.kiche, face: s.kiche, kind: 'name' as const },
      { key: `${s.kiche}-m`, nawal: s.kiche, face: s.english, kind: 'meaning' as const },
    ]));
  });
  const [up, setUp] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const done = matched.size === 6;

  useEffect(() => {
    if (up.length !== 2) return;
    const [a, b] = up.map((k) => cards.find((c) => c.key === k)!);
    const t = setTimeout(() => {
      if (a.nawal === b.nawal) setMatched((m) => new Set(m).add(a.nawal));
      setUp([]);
    }, a.nawal === b.nawal ? 350 : 900);
    return () => clearTimeout(t);
  }, [up, cards]);

  useEffect(() => { if (done) onFinish(moves); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (c: Card) => {
    if (up.length === 2 || up.includes(c.key) || matched.has(c.nawal)) return;
    const next = [...up, c.key];
    setUp(next);
    if (next.length === 2) setMoves((m) => m + 1);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="font-mono text-5xl font-bold text-gold-lite">{moves}</p>
        <p className="font-display text-xl font-bold">{moves <= 8 ? 'A day-keeper\'s memory.' : moves <= 12 ? 'All six pairs found.' : 'Found them all. Practice makes the count familiar.'}</p>
        <p className="text-sm text-muted">moves to match six nawales</p>
        <button type="button" onClick={onExit} className="mt-2 min-h-11 rounded-full bg-gold px-6 text-sm font-bold text-space">Back to games</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between font-mono text-[11px] tracking-[0.08em] text-muted">
        <span>{matched.size} OF 6 PAIRS</span><span className="text-gold-lite">{moves} MOVES</span>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => {
          const shown = up.includes(c.key) || matched.has(c.nawal);
          return (
            <li key={c.key}>
              <button type="button" onClick={() => flip(c)} aria-label={shown ? `${c.face}${matched.has(c.nawal) ? ', matched' : ''}` : 'Hidden card'}
                className={`flex aspect-[4/3] w-full items-center justify-center rounded-2xl border p-2 text-center text-sm font-semibold transition-colors ${matched.has(c.nawal) ? 'border-gold bg-royal/60 text-gold-lite' : shown ? 'border-gold-lite bg-royal' : 'border-line-2 bg-deep hover:border-gold'}`}>
                {shown ? <span className={c.kind === 'name' ? 'font-display text-base' : 'text-muted'}>{c.face}</span> : <span aria-hidden="true" className="text-2xl text-gold">✦</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-dim">Match each K&apos;iche&apos; nawal to its meaning.</p>
    </div>
  );
}
