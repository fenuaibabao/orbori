/**
 * The Cosmos, step one: Circles you belong to automatically, from your chart.
 * Nobody is ever named in a Circle; stats only appear once 10 people are in it.
 */
import type { Chart } from './astro/types';
import { SIGNS } from './astro/types';

export interface Circle { key: string; name: string; blurb: string }
export const MIN_CIRCLE = 10;

const PLURAL: Record<string, string> = { Ox: 'Oxen', Goat: 'Goats', Sheep: 'Sheep' };
const plural = (a: string) => PLURAL[a] ?? `${a}s`;
const ELEMENT = ['Fire', 'Earth', 'Air', 'Water'] as const;
const slug = (s: string) => s.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase().replace(/^-|-$/g, '');

function age(birth: string, today: string) {
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

export function circlesFor(chart: Chart, today: string): Circle[] {
  const sun = chart.western.planets.sun.sign;
  const el = ELEMENT[SIGNS.indexOf(sun) % 4];
  const c = chart.chinese, t = chart.tzolkin, h = chart.hawaiian;
  const a = age(chart.input.date, today);
  const out: Circle[] = [
    { key: `sun-element:${el.toLowerCase()}`, name: `${el} Suns`, blurb: `Everyone born with the Sun in a ${el.toLowerCase()} sign.` },
    { key: `chinese:${slug(c.element)}-${slug(c.animal)}`, name: `${c.element} ${plural(c.animal)}`, blurb: `Born in a ${c.element} ${c.animal} year.` },
    { key: `nawal:${slug(t.daySign)}`, name: `People of ${t.daySign}`, blurb: `Born on a ${t.daySign} (${t.english}) day of the Chol Q'ij.` },
    { key: `moon-night:${h.night}`, name: `Born on ${h.name}`, blurb: `Born on night ${h.night} of the Hawaiian moon.` },
    { key: `life-path:${chart.numerology.lifePath}`, name: `Life Path ${chart.numerology.lifePath}s`, blurb: `Everyone walking Life Path ${chart.numerology.lifePath}.` },
  ];
  if ((a >= 27 && a <= 30) || (a >= 56 && a <= 60)) out.push({ key: `saturn-return:${a >= 56 ? 2 : 1}`, name: a >= 56 ? 'Second Saturn Return' : 'Saturn Return Survivors', blurb: 'In the years when Saturn comes back to where it was at your birth.' });
  return out;
}

/** The daily Circle question, answered with three reactions. */
export const REACTIONS = [
  { id: 'comet', emoji: '☄️' },
  { id: 'moon', emoji: '🌕' },
  { id: 'fire', emoji: '🔥' },
] as const;
export type ReactionId = (typeof REACTIONS)[number]['id'];

const QUESTIONS: { q: string; a: [string, string, string] }[] = [
  { q: 'How is your energy tonight?', a: ['Racing', 'Steady', 'Burning bright'] },
  { q: 'Did the stars get you right today?', a: ['Wildly off', 'Close enough', 'Spot on'] },
  { q: 'What kind of day was it?', a: ['Chaotic', 'Calm', 'Electric'] },
  { q: 'How connected did you feel to people today?', a: ['Out in orbit', 'Quietly close', 'Totally in sync'] },
  { q: 'How brave were you today?', a: ['Took a leap', 'Held my ground', 'Lit something up'] },
  { q: 'What do you need tomorrow?', a: ['A change', 'Rest', 'A spark'] },
  { q: 'How did you treat yourself today?', a: ['Pushed hard', 'Gently', 'Like royalty'] },
];
export function circleQuestion(date: string) {
  const n = Math.floor(Date.parse(`${date}T12:00:00Z`) / 86400000);
  return QUESTIONS[((n % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length];
}

/** Weekly Circle challenge: enough check-ins between everyone in the Circle. */
export const challengeGoal = (members: number) => Math.max(MIN_CIRCLE, Math.ceil(members * 3));
