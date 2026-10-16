'use client';
import { useState } from 'react';
import { NawalPairs } from '@/components/games/NawalPairs';
import { TermQuest } from '@/components/games/TermQuest';
import { XP } from '@/lib/progress';
import { isUnlocked } from '@/lib/rewards';
import { localToday, useAppStore } from '@/lib/store';
import { useProgress } from '@/lib/use-progress';

const bestKey = 'orbori.pairs.best';
const readBest = () => { try { return Number(localStorage.getItem(bestKey)) || null; } catch { return null; } };

export default function Play() {
  const { state, finishGame } = useAppStore();
  const p = useProgress();
  const { date } = localToday();
  const played = state.activity?.[date]?.games ?? [];
  const [game, setGame] = useState<null | 'quest' | 'quest-hard' | 'pairs'>(null);
  const [best, setBest] = useState<number | null>(() => (typeof window === 'undefined' ? null : readBest()));
  const hardOpen = isUnlocked(p.levelIndex, 'hard-mode');

  const xpTag = (id: string) => (
    <span className={`font-mono text-[11px] ${played.includes(id) ? 'text-gold-lite' : 'text-dim'}`}>{played.includes(id) ? '✦ played today' : `+${XP.game} XP today`}</span>
  );

  if (game) {
    return (
      <div className="flex flex-col gap-4 lg:max-w-2xl">
        <button type="button" onClick={() => setGame(null)} className="self-start text-sm font-semibold text-muted hover:text-starlight">‹ All games</button>
        <h1 className="font-display text-2xl font-bold">{game === 'pairs' ? 'Nawal Pairs' : game === 'quest-hard' ? 'Term Quest · Hard' : 'Term Quest'}</h1>
        <div className="rounded-3xl bg-night p-5">
          {game === 'pairs'
            ? <NawalPairs onExit={() => setGame(null)} onFinish={(moves) => {
                finishGame(date, 'pairs');
                if (!best || moves < best) { setBest(moves); try { localStorage.setItem(bestKey, String(moves)); } catch { /* private mode */ } }
              }} />
            : <TermQuest hard={game === 'quest-hard'} onExit={() => setGame(null)} onFinish={() => finishGame(date, 'quest')} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header>
        <h1 className="font-display text-[26px] font-bold">Play</h1>
        <p className="mt-1 text-sm text-muted">Quick games for learning the traditions. Each one earns +{XP.game} XP the first time you finish it each day.</p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <article className="flex flex-col gap-3 rounded-3xl border border-royal bg-night p-5">
          <div className="flex items-baseline justify-between gap-2"><h2 className="font-display text-xl font-bold">Term Quest</h2>{xpTag('quest')}</div>
          <p className="text-sm leading-relaxed text-muted">Read a definition from any of the seven traditions and pick the term it describes. Six questions.</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <button type="button" onClick={() => setGame('quest')} className="min-h-11 rounded-full bg-gold px-5 text-sm font-bold text-space">Play</button>
            <button type="button" onClick={() => hardOpen && setGame('quest-hard')} disabled={!hardOpen}
              className="min-h-11 rounded-full border border-gold px-5 text-sm font-semibold disabled:border-line-2 disabled:text-dim">
              {hardOpen ? 'Hard mode' : 'Hard mode · Mystic'}
            </button>
          </div>
        </article>
        <article className="flex flex-col gap-3 rounded-3xl border border-royal bg-night p-5">
          <div className="flex items-baseline justify-between gap-2"><h2 className="font-display text-xl font-bold">Nawal Pairs</h2>{xpTag('pairs')}</div>
          <p className="text-sm leading-relaxed text-muted">A memory game with the Chol Q&apos;ij: match six K&apos;iche&apos; nawales to their meanings in as few moves as you can.</p>
          <div className="mt-auto flex items-center justify-between gap-2">
            <button type="button" onClick={() => setGame('pairs')} className="min-h-11 rounded-full bg-gold px-5 text-sm font-bold text-space">Play</button>
            {best && <span className="font-mono text-[11px] text-dim">BEST: {best} MOVES</span>}
          </div>
        </article>
      </div>
    </div>
  );
}
