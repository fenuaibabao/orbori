/**
 * Convergence and Alignment: the rare days the Cosmic Council speaks with (almost)
 * one voice. Convergence = all 7 voices agree. Alignment = 6 of 7, one holdout.
 * Pure functions over Orbori's own engine, so the forecast is exactly what Today
 * will say when the day arrives.
 */
import { DateTime } from 'luxon';
import { cosmicCouncil } from './council';
import type { Advice } from './council/types';
import type { Chart } from './astro/types';

/** [system, agrees (1/0), advice, headline] */
export type Voice = [string, 0 | 1, Advice, string];
export interface GlowDay { d: string; n: 6 | 7; adv: Advice; score: number; head: string; agree: string; v: Voice[] }

export const ADVICE_LABEL: Record<string, string> = {
  act: 'Make a move', speak: 'Speak up', connect: 'Lean on your people', build: 'Keep your head down', slow: 'Wait', release: 'Let it go',
};
export const VOICE_NAME: Record<string, string> = {
  western: 'Western', vedic: 'Jyotish', chinese: 'Four Pillars', numerology: 'Numerology', mayan: "Chol Q'ij", hawaiian: 'Hawaiian moon', islamic: 'Lunar mansions',
};
/** "the Chol Q'ij", "Western", … for use mid-sentence. */
export const voiceInSentence = (sys: string) => (['mayan', 'hawaiian', 'islamic', 'chinese'].includes(sys) ? 'the ' : '') + VOICE_NAME[sys];

export const addDays = (date: string, n: number) => DateTime.fromISO(date, { zone: 'utc' }).plus({ days: n }).toISODate()!;

/** Every Alignment and Convergence from `from` for `days` days. */
export function glowingDays(chart: Chart, from: string, days: number, timeZone: string): GlowDay[] {
  const out: GlowDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i);
    const r = cosmicCouncil(chart, d, timeZone);
    if (r.agreeCount < 6) continue;
    out.push({
      d, n: r.agreeCount as 6 | 7, adv: r.majority, score: r.score, head: r.headline, agree: r.agreeText,
      v: r.systems.map((s) => [s.system, s.agrees ? 1 : 0, s.advice, s.headline] as Voice),
    });
  }
  return out;
}

/** The next full Convergence from `from`, looking up to `maxDays` ahead (slow: ~1s per year). */
export function findConvergence(chart: Chart, from: string, maxDays: number, timeZone: string): GlowDay | null {
  for (let i = 0; i < maxDays; i++) {
    const d = addDays(from, i);
    const r = cosmicCouncil(chart, d, timeZone);
    if (r.agreeCount === 7) return glowingDays(chart, d, 1, timeZone)[0];
  }
  return null;
}

/** The one-line story of a glowing day, used in calendars and notifications. */
export function glowSummary(g: GlowDay): string {
  const hold = g.v.find((v) => !v[1]);
  return g.n === 7
    ? 'All 7 voices of the Cosmic Council agree. Not one differs. As rare as a blue moon.'
    : `6 of 7 voices agree. Only ${voiceInSentence(hold![0])} differs and says ${ADVICE_LABEL[hold![2]].toLowerCase()}.`;
}
