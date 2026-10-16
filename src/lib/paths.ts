/**
 * The Seven Paths: the secret track that opens at Celestial. One path per
 * tradition, each finished through quests rather than raw XP. Pure functions,
 * so the server can check them too (path gifts can't be faked from a browser).
 *
 * Titles are "Student of …" on purpose: we never hand out titles that belong to
 * initiated roles in these traditions.
 */
import type { ActivityLog, CheckIn } from './progress';
import { GLOSSARY } from './glossary';
import { julianDayNumber, parseDate } from './astro/util';
import { tzolkin } from './astro/mayan';
import { lifePath, reduce } from './astro/numerology';

export type PathId = 'western' | 'vedic' | 'chinese' | 'numerology' | 'mayan' | 'hawaiian' | 'islamic';
export interface Quest { label: string; progress: number; goal: number; done: boolean }
export interface Path { id: PathId; tradition: string; title: string; game: string; quests: Quest[]; done: boolean }

const jdn = (d: string) => { const { year, month, day } = parseDate(d); return julianDayNumber(year, month, day); };

/** Night of the lunar month (1–30) from the mean synodic month. Close enough for quests. */
export function lunarNight(date: string): number {
  const age = ((jdn(date) + 0.5 - 2451550.26) % 29.530588853 + 29.530588853) % 29.530588853;
  return Math.min(30, Math.floor(age) + 1);
}
const PHASE = (n: number) => (n <= 2 || n >= 29 ? 'new' : n >= 7 && n <= 9 ? 'first quarter' : n >= 14 && n <= 16 ? 'full' : n >= 21 && n <= 23 ? 'last quarter' : null);
const ANIMAL_OF = (d: string) => (((jdn(d) - 11) % 60) + 60) % 60 % 12;
const WEEKDAY = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();
function personalDay(birth: string, date: string) {
  const b = parseDate(birth), t = parseDate(date);
  const r9 = (n: number) => { while (n > 9) n = String(n).split('').reduce((s, x) => s + +x, 0); return n; };
  const year = r9(r9(b.month) + r9(b.day) + r9(t.year));
  return reduce(r9(year + t.month) + r9(t.day));
}

const META: { id: PathId; tradition: string; system: string; game: string; gameName: string }[] = [
  { id: 'western', tradition: 'Western astrology', system: 'Western', game: 'western', gameName: 'Sign School' },
  { id: 'vedic', tradition: 'Jyotish', system: 'Vedic', game: 'vedic', gameName: 'Graha Pairs' },
  { id: 'chinese', tradition: 'the Four Pillars', system: 'Chinese', game: 'chinese', gameName: 'The Great Race' },
  { id: 'numerology', tradition: 'numerology', system: 'Numerology', game: 'numerology', gameName: 'Life Path Sprint' },
  { id: 'mayan', tradition: 'the Chol Q\'ij', system: 'Mayan', game: 'pairs', gameName: 'Nawal Pairs' },
  { id: 'hawaiian', tradition: 'the Kaulana Mahina', system: 'Hawaiian', game: 'hawaiian', gameName: 'Moon Nights' },
  { id: 'islamic', tradition: 'the lunar mansions and Abjad', system: 'Islamic', game: 'islamic', gameName: 'Abjad Letters' },
];

export interface PathInput { checkIns: Record<string, CheckIn>; activity: ActivityLog; birthDate: string }

export function sevenPaths({ checkIns, activity, birthDate }: PathInput): Path[] {
  const nights = Object.keys(checkIns);
  const acts = Object.values(activity);
  const seen = new Set(acts.flatMap((a) => a.terms ?? []));
  const q = (label: string, progress: number, goal: number): Quest => ({ label, progress: Math.min(goal, progress), goal, done: progress >= goal });

  const flavor: Record<PathId, Quest> = {
    western: q('Check in on all four Moon phases: new, first quarter, full, last quarter', new Set(nights.map((d) => PHASE(lunarNight(d))).filter(Boolean)).size, 4),
    vedic: q('Check in on every day of the week, each ruled by its graha', new Set(nights.map(WEEKDAY)).size, 7),
    chinese: q('Check in on all twelve animal days', new Set(nights.map(ANIMAL_OF)).size, 12),
    numerology: (() => {
      const lp = lifePath(birthDate).lifePath;
      const target = lp > 9 ? reduce(String(lp).split('').reduce((s, x) => s + +x, 0)) : lp;
      return q(`Check in on 3 days whose Personal Day is your Life Path number (${lp})`, nights.filter((d) => { const pd = personalDay(birthDate, d); return pd === lp || pd === target; }).length, 3);
    })(),
    mayan: (() => {
      const byTrecena = new Map<number, number>();
      for (const d of nights) { const start = jdn(d) - (tzolkin(d).number - 1); byTrecena.set(start, (byTrecena.get(start) ?? 0) + 1); }
      return q('Check in on 10 days of a single trecena', Math.max(0, ...byTrecena.values()), 10);
    })(),
    hawaiian: q('Check in on the bright nights of the full moon (Akua, Hoku, Māhealani) 3 times', nights.filter((d) => [14, 15, 16].includes(lunarNight(d))).length, 3),
    islamic: q('Check in on 20 different nights of the lunar month', new Set(nights.map(lunarNight)).size, 20),
  };

  return META.map((m) => {
    const terms = GLOSSARY.filter((g) => g.system === m.system);
    const quests = [
      q(`Open every ${m.system === 'Mayan' ? 'Chol Q\'ij' : m.system} term in Learn`, terms.filter((t) => seen.has(t.id)).length, terms.length),
      q(`Explore ${m.tradition} in depth on 5 days`, acts.filter((a) => a.deepOn?.includes(m.id)).length, 5),
      q(`Finish ${m.gameName} on 7 days`, acts.filter((a) => a.games?.includes(m.game)).length, 7),
      q(`Play a perfect game of ${m.gameName} 3 times`, acts.filter((a) => a.perfect?.includes(m.game)).length, 3),
      flavor[m.id],
    ];
    return { id: m.id, tradition: m.tradition, title: `Student of ${m.tradition.startsWith('the ') ? m.tradition : m.tradition[0].toUpperCase() + m.tradition.slice(1)}`, game: m.game, quests, done: quests.every((x) => x.done) };
  });
}

export const isConvergent = (paths: Path[]) => paths.every((p) => p.done);
