'use client';
import { useState } from 'react';
import { GreatRace } from '@/components/games/GreatRace';
import { Moon } from '@/components/games/Moon';
import { PairsGame } from '@/components/games/PairsGame';
import { QuizGame, type Round } from '@/components/games/QuizGame';
import { TermQuest } from '@/components/games/TermQuest';
import { GRAHA_PAIRS, hawaiianRounds, islamicRounds, nawalPairs, numerologyRounds, shuffle, westernRounds, type PlainRound } from '@/lib/games';
import { XP } from '@/lib/progress';
import { isUnlocked } from '@/lib/rewards';
import { localToday, useAppStore } from '@/lib/store';
import { useProgress } from '@/lib/use-progress';

type GameId = 'western' | 'vedic' | 'chinese' | 'numerology' | 'pairs' | 'hawaiian' | 'islamic' | 'quest';
const GAMES: { id: GameId; tradition: string; name: string; blurb: string }[] = [
  { id: 'western', tradition: 'Western', name: 'Sign School', blurb: 'Element, mode or ruling planet: how well do you know the twelve signs?' },
  { id: 'vedic', tradition: 'Vedic', name: 'Graha Pairs', blurb: 'A memory game: match the Sanskrit names of the grahas to their planets.' },
  { id: 'chinese', tradition: 'Chinese', name: 'The Great Race', blurb: 'Tap the twelve animals in the order they crossed the river.' },
  { id: 'numerology', tradition: 'Numerology', name: 'Life Path Sprint', blurb: 'Work out the Life Path number of six birthdays.' },
  { id: 'pairs', tradition: 'Mayan', name: 'Nawal Pairs', blurb: 'A memory game: match K\'iche\' nawales to their meanings.' },
  { id: 'hawaiian', tradition: 'Hawaiian', name: 'Moon Nights', blurb: 'Name the night of the Kaulana Mahina from the shape of the moon.' },
  { id: 'islamic', tradition: 'Islamic', name: 'Abjad Letters', blurb: 'Learn the number carried by each Arabic letter.' },
  { id: 'quest', tradition: 'All seven', name: 'Term Quest', blurb: 'Read a definition from any tradition and pick the term it describes.' },
];

const toRounds = (rs: PlainRound[]): Round[] => rs.map((r) => ({
  ...r,
  prompt: r.night ? <div className="flex justify-center"><Moon night={r.night} /></div>
    : r.letter ? <p lang="ar" dir="rtl" className="text-center font-display text-7xl leading-tight">{r.letter}</p>
    : <p className="text-center font-display text-3xl font-bold">{r.prompt}</p>,
}));

const bestKey = (id: string) => `orbori.best.${id}`;
const readBest = (id: string) => { try { return Number(localStorage.getItem(bestKey(id))) || null; } catch { return null; } };
const saveBest = (id: string, v: number, lowerIsBetter: boolean) => {
  const b = readBest(id);
  if (b === null || (lowerIsBetter ? v < b : v > b)) try { localStorage.setItem(bestKey(id), String(v)); } catch { /* private mode */ }
};

export default function Play() {
  const { state, finishGame } = useAppStore();
  const p = useProgress();
  const { date } = localToday();
  const played = state.activity?.[date]?.games ?? [];
  const [game, setGame] = useState<GameId | 'quest-hard' | null>(null);
  const [round, setRound] = useState(0);
  const hardOpen = isUnlocked(p.levelIndex, 'hard-mode');
  const open = (g: GameId | 'quest-hard') => { setRound((r) => r + 1); setGame(g); };
  const exit = () => setGame(null);
  const done = (id: GameId, perfect = false) => () => finishGame(date, id, perfect);

  if (game) {
    const meta = GAMES.find((g) => g.id === (game === 'quest-hard' ? 'quest' : game))!;
    return (
      <div className="flex flex-col gap-4 lg:max-w-2xl">
        <button type="button" onClick={exit} className="self-start text-sm font-semibold text-muted hover:text-starlight">‹ All games</button>
        <div>
          <p className="font-mono text-[11px] tracking-[0.1em] text-gold-lite">{meta.tradition.toUpperCase()}</p>
          <h1 className="font-display text-2xl font-bold">{meta.name}{game === 'quest-hard' ? ' · Hard' : ''}</h1>
        </div>
        <div key={round} className="rounded-3xl bg-night p-5">
          {game === 'western' && <QuizGame rounds={toRounds(westernRounds())} onExit={exit} onFinish={(s, t) => { done('western', s === t)(); saveBest('western', s, false); }} />}
          {game === 'numerology' && <QuizGame rounds={toRounds(numerologyRounds())} onExit={exit} onFinish={(s, t) => { done('numerology', s === t)(); saveBest('numerology', s, false); }} />}
          {game === 'hawaiian' && <QuizGame rounds={toRounds(hawaiianRounds())} onExit={exit} onFinish={(s, t) => { done('hawaiian', s === t)(); saveBest('hawaiian', s, false); }} />}
          {game === 'islamic' && <QuizGame rounds={toRounds(islamicRounds())} onExit={exit} onFinish={(s, t) => { done('islamic', s === t)(); saveBest('islamic', s, false); }} />}
          {game === 'vedic' && <PairsGame pairs={shuffle(GRAHA_PAIRS).slice(0, 6)} hint="Match each Sanskrit graha to its planet." onExit={exit} onFinish={(m) => { done('vedic', m <= 8)(); saveBest('vedic', m, true); }} />}
          {game === 'pairs' && <PairsGame pairs={nawalPairs()} hint="Match each K'iche' nawal to its meaning." onExit={exit} onFinish={(m) => { done('pairs', m <= 8)(); saveBest('pairs', m, true); }} />}
          {game === 'chinese' && <GreatRace onExit={exit} onFinish={(m) => { done('chinese', m === 0)(); saveBest('chinese', m, true); }} />}
          {(game === 'quest' || game === 'quest-hard') && <TermQuest hard={game === 'quest-hard'} onExit={exit} onFinish={(s, t) => { done('quest', s === t)(); saveBest('quest', s, false); }} />}
        </div>
      </div>
    );
  }

  const bestLabel = (id: GameId) => {
    const b = typeof window === 'undefined' ? null : readBest(id);
    if (b === null) return null;
    return ['vedic', 'pairs'].includes(id) ? `BEST: ${b} MOVES` : id === 'chinese' ? `BEST: ${b} MISTAKES` : `BEST: ${b} RIGHT`;
  };

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl">
      <header>
        <h1 className="font-display text-[26px] font-bold">Play</h1>
        <p className="mt-1 text-sm text-muted">A quick game for every tradition. Each earns +{XP.game} XP the first time you finish it each day ({played.length} of {GAMES.length} played today).</p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {GAMES.map((g) => {
          const did = played.includes(g.id);
          const best = bestLabel(g.id);
          return (
            <article key={g.id} className="flex flex-col gap-2.5 rounded-3xl border border-royal bg-night p-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-[11px] tracking-[0.1em] text-gold-lite">{g.tradition.toUpperCase()}</p>
                <span className={`font-mono text-[11px] ${did ? 'text-gold-lite' : 'text-dim'}`}>{did ? '✦ played today' : `+${XP.game} XP`}</span>
              </div>
              <h2 className="font-display text-xl font-bold">{g.name}</h2>
              <p className="text-sm leading-relaxed text-muted">{g.blurb}</p>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <button type="button" onClick={() => open(g.id)} className="min-h-11 rounded-full bg-gold px-5 text-sm font-bold text-space">Play</button>
                {g.id === 'quest' && (
                  <button type="button" onClick={() => hardOpen && open('quest-hard')} disabled={!hardOpen}
                    className="min-h-11 rounded-full border border-gold px-5 text-sm font-semibold disabled:border-line-2 disabled:text-dim">{hardOpen ? 'Hard mode' : 'Hard mode · Mystic'}</button>
                )}
                {best && <span className="ml-auto font-mono text-[11px] text-dim">{best}</span>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
