import { DateTime } from 'luxon';
import type { Chart } from '../astro/types';
import { chineseSignal, hash, mayanSignal, numerologySignal, vedicSignal, westernSignal } from './signals';
import { MOOD, type Advice, type CouncilReading, type Mood, type SystemSignal } from './types';

export * from './types';

const HEADLINES: Record<Advice, string[]> = {
  speak: ['Say the thing. Out loud. Before lunch.', 'Your voice is the move today.', 'Unmute yourself. The room wants your take.'],
  act: ['Make the move. The sky is holding the door.', 'Start it today. Perfect is a myth.', 'Go first. Fortune favors the early text.'],
  connect: ['Text them back. Then text someone new.', 'People day. Lead with warmth.', 'Your crew is your luck today.'],
  build: ['Head down, hands busy. Future you says thanks.', 'Quiet grind, loud results.', 'Lay one brick perfectly.'],
  slow: ['Do less, better. The universe is buffering.', 'Pause is a power move today.', 'Read twice, send once.'],
  release: ['Unsubscribe from something. Emotionally, too.', 'Let one thing go so the rest can move.', 'Close a tab in your life.'],
};
const AGREE: Record<Advice, string> = {
  speak: 'Speak up. Clear the air. Your words land softer than you think.',
  act: 'Take initiative. Momentum beats overthinking today.',
  connect: 'Lean on your people. Warmth comes back multiplied.',
  build: 'Focus and structure. Small, steady work compounds.',
  slow: 'Ease off. Rest is strategy, not surrender.',
  release: 'Let something go. Endings make room.',
};
const ADVICE_VERB: Record<Advice, string> = {
  speak: 'says speak up', act: 'says make a move', connect: 'says lean on your people', build: 'says keep your head down',
  slow: 'says wait', release: 'says let it go',
};
const SHORT: Record<string, string> = {
  western: 'Western', vedic: 'Vedic', chinese: 'The Chinese zodiac', numerology: 'Numerology', mayan: "The Tzolk'in",
};

const BASE: Record<number, number> = { 1: 1.5, 2: 3.2, 3: 5.3, 4: 7.4, 5: 9.2 };

/**
 * Today's Cosmic Council for a natal chart.
 * @param date civil date "YYYY-MM-DD" where the user is today
 * @param timeZone the user's current zone (used to pick local noon)
 */
export function cosmicCouncil(chart: Chart, date: string, timeZone: string): CouncilReading {
  const noon = DateTime.fromISO(`${date}T12:00`, { zone: timeZone }).toJSDate();
  const key = `${date}|${chart.input.date}`;
  const systems: SystemSignal[] = [
    westernSignal(chart, noon, key),
    vedicSignal(chart, noon),
    chineseSignal(chart, date, key),
    numerologySignal(chart, date),
    mayanSignal(chart, date),
  ];

  // Majority mood, ties broken by total intensity.
  const moods = new Map<Mood, { n: number; w: number }>();
  for (const s of systems) {
    const m = moods.get(MOOD[s.advice]) ?? { n: 0, w: 0 };
    moods.set(MOOD[s.advice], { n: m.n + 1, w: m.w + s.intensity });
  }
  const [topMood, top] = [...moods.entries()].sort((a, b) => b[1].n - a[1].n || b[1].w - a[1].w)[0];
  const agreeing = systems.filter((s) => MOOD[s.advice] === topMood);

  // Majority advice within the winning mood.
  const advCount = new Map<Advice, number>();
  for (const s of agreeing) advCount.set(s.advice, (advCount.get(s.advice) ?? 0) + s.intensity + 1);
  const majority = [...advCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const sameAdvice = agreeing.filter((s) => s.advice === majority).length / agreeing.length;
  const intensity = agreeing.reduce((s, x) => s + x.intensity, 0) / agreeing.length;

  const raw = BASE[top.n] + (sameAdvice - 0.5) * 0.9 + (intensity - 0.5) * 0.8;
  const score = Math.round(Math.max(1, Math.min(10, raw)) * 10) / 10;

  const dissent = systems.filter((s) => MOOD[s.advice] !== topMood);
  let holdoutText: string | null = null;
  if (dissent.length === 1) holdoutText = `${SHORT[dissent[0].system]} ${ADVICE_VERB[dissent[0].advice]}. Noted.${top.n >= 4 ? ' Overruled.' : ''}`;
  else if (dissent.length > 1) holdoutText = dissent.map((s) => `${SHORT[s.system]} ${ADVICE_VERB[s.advice]}`).join('; ') + '.';

  const headlines = HEADLINES[majority];
  return {
    date,
    score,
    headline: headlines[hash(key) % headlines.length],
    majority,
    agreeCount: top.n,
    agreeText: AGREE[majority],
    holdoutText,
    systems: systems.map((s) => ({
      ...s,
      agrees: MOOD[s.advice] === topMood,
      why: MOOD[s.advice] !== topMood && s.basis !== s.headline ? `Why the split: ${s.basis}.` : undefined,
    })),
  };
}
