/**
 * Four Pillars of Destiny (BaZi).
 * - Year pillar changes at Lichun (Sun at 315°), not at Lunar New Year.
 * - Month pillar changes at the 12 "jie" solar terms (Sun at 315°, 345°, 15° …).
 * - Day pillar from the civil birth date (midnight boundary).
 * - Hour pillar from 2-hour blocks starting 23:00 (Rat); 23:00–23:59 uses the
 *   next day's stem for the hour ("late Rat" convention).
 * Clock time is used as given (no true-solar-time correction).
 */
import * as A from 'astronomy-engine';
import { ANIMALS } from './chinese';
import { julianDayNumber, parseDate } from './util';

export const STEMS = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
export const STEM_HANZI = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
export const BRANCH_HANZI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export type Element = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
const STEM_ELEMENT: Element[] = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
const BRANCH_ELEMENT: Element[] = ['Water', 'Earth', 'Wood', 'Wood', 'Earth', 'Fire', 'Fire', 'Earth', 'Metal', 'Metal', 'Earth', 'Water'];

export interface Pillar {
  stem: number;
  branch: number;
  /** e.g. "Jia Xu" */
  name: string;
  hanzi: string;
  element: Element;
  polarity: 'Yang' | 'Yin';
  animal: string;
  /** e.g. "Yang Wood Dog" */
  label: string;
}

export interface Bazi {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  dayMaster: { element: Element; polarity: 'Yang' | 'Yin'; stem: string };
  /** Count of the visible stems and branches by element (6 or 8 characters). */
  elements: Record<Element, number>;
  strongest: Element;
  missing: Element[];
}

function pillar(stem: number, branch: number): Pillar {
  const element = STEM_ELEMENT[stem];
  const polarity = stem % 2 === 0 ? 'Yang' : 'Yin';
  return {
    stem, branch,
    name: `${STEMS[stem]} ${BRANCHES[branch]}`,
    hanzi: `${STEM_HANZI[stem]}${BRANCH_HANZI[branch]}`,
    element, polarity, animal: ANIMALS[branch],
    label: `${polarity} ${element} ${ANIMALS[branch]}`,
  };
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Sexagenary index (0 = Jia Zi) of a civil date's day pillar. */
export function dayIndex(date: string): number {
  const { year, month, day } = parseDate(date);
  return mod(julianDayNumber(year, month, day) - 11, 60);
}

/** Instant of Lichun (start of spring, Sun at 315°) in a Gregorian year. */
export function lichun(year: number): Date {
  return A.SearchSunLongitude(315, A.MakeTime(new Date(Date.UTC(year, 0, 25))), 30)!.date;
}

export function bazi(instant: Date, date: string, time: string | null): Bazi {
  const civilYear = +date.slice(0, 4);
  // Year: compare the birth instant with that year's Lichun instant.
  const solarYear = instant < lichun(civilYear) ? civilYear - 1 : civilYear;
  const yIdx = mod(solarYear - 4, 60);
  const year = pillar(yIdx % 10, yIdx % 12);

  // Month: Tiger month starts at 315°, each month 30° further.
  const lon = A.SunPosition(A.MakeTime(instant)).elon;
  const offset = Math.floor(mod(lon - 315, 360) / 30); // 0 = Tiger month
  const tigerStem = mod((year.stem % 5) * 2 + 2, 10);
  const month = pillar(mod(tigerStem + offset, 10), mod(2 + offset, 12));

  const dIdx = dayIndex(date);
  const day = pillar(dIdx % 10, dIdx % 12);

  let hour: Pillar | null = null;
  if (time) {
    const [h] = time.split(':').map(Number);
    const branch = Math.floor((h + 1) / 2) % 12;
    const stemBase = h === 23 ? (dIdx + 1) % 10 : day.stem;
    const ratStem = (stemBase % 5) * 2;
    hour = pillar(mod(ratStem + branch, 10), branch);
  }

  const elements: Record<Element, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  for (const p of [year, month, day, hour]) {
    if (!p) continue;
    elements[STEM_ELEMENT[p.stem]]++;
    elements[BRANCH_ELEMENT[p.branch]]++;
  }
  const order = (Object.keys(elements) as Element[]).sort((a, b) => elements[b] - elements[a]);
  return {
    year, month, day, hour,
    dayMaster: { element: day.element, polarity: day.polarity, stem: STEMS[day.stem] },
    elements,
    strongest: order[0],
    missing: order.filter((e) => elements[e] === 0),
  };
}
