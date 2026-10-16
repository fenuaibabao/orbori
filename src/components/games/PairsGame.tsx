'use client';
import { useEffect, useState } from 'react';
import { shuffle } from '@/lib/games';

interface Card { key: string; pair: string; face: string; side: 'a' | 'b' }

/** Memory game: flip two cards, keep them if they belong together. Fewer moves is better. */
export function PairsGame({ pairs, onFinish, onExit, hint, aLang }: {
  pairs: { a: string; b: string }[]; onFinish: (moves: number) => void; onExit: () => void; hint: string; aLang?: string;
}) {
  const [cards] = useState<Card[]>(() => shuffle(pairs.flatMap((p) => [
    { key: `${p.a}-a`, pair: p.a, face: p.a, side: 'a' as const },
    { key: `${p.a}-b`, pair: p.a, face: p.b, side: 'b' as const },
  ])));
  const [up, setUp] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const done = matched.size === pairs.length;

  useEffect(() => {
    if (up.length !== 2) return;
    const [a, b] = up.map((k) => cards.find((c) => c.key === k)!);
    const same = a.pair === b.pair;
    const t = setTimeout(() => { if (same) setMatched((m) => new Set(m).add(a.pair)); setUp([]); }, same ? 350 : 900);
    return () => clearTimeout(t);
  }, [up, cards]);
  useEffect(() => { if (done) onFinish(moves); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (c: Card) => {
    if (up.length === 2 || up.includes(c.key) || matched.has(c.pair)) return;
    const next = [...up, c.key];
    setUp(next);
    if (next.length === 2) setMoves((m) => m + 1);
  };

  if (done) {
    const n = pairs.length;
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="font-mono text-5xl font-bold text-gold-lite">{moves}</p>
        <p className="font-display text-xl font-bold">{moves <= n + 2 ? 'A memory like the night sky.' : moves <= n * 2 ? `All ${n} pairs found.` : 'Found them all. It gets easier every time.'}</p>
        <p className="text-sm text-muted">moves to match {n} pairs</p>
        <button type="button" onClick={onExit} className="mt-2 min-h-11 rounded-full bg-gold px-6 text-sm font-bold text-space">Back to games</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between font-mono text-[11px] tracking-[0.08em] text-muted">
        <span>{matched.size} OF {pairs.length} PAIRS</span><span className="text-gold-lite">{moves} MOVES</span>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => {
          const shown = up.includes(c.key) || matched.has(c.pair);
          return (
            <li key={c.key}>
              <button type="button" onClick={() => flip(c)} aria-label={shown ? `${c.face}${matched.has(c.pair) ? ', matched' : ''}` : 'Hidden card'}
                className={`flex aspect-[4/3] w-full items-center justify-center rounded-2xl border p-2 text-center text-sm font-semibold transition-colors ${matched.has(c.pair) ? 'border-gold bg-royal/60 text-gold-lite' : shown ? 'border-gold-lite bg-royal' : 'border-line-2 bg-deep hover:border-gold'}`}>
                {shown ? <span lang={c.side === 'a' ? aLang : undefined} className={c.side === 'a' ? 'font-display text-base' : 'text-muted'}>{c.face}</span> : <span aria-hidden="true" className="text-2xl text-gold">✦</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-dim">{hint}</p>
    </div>
  );
}
