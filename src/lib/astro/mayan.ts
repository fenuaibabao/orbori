import type { Tzolkin } from './types';
import { julianDayNumber, parseDate } from './util';

/** Goodman–Martinez–Thompson correlation, the count K'iche' day-keepers in Guatemala keep today. */
export const GMT_CORRELATION = 584283;

/**
 * The 20 nawales of the Chol Q'ij (Tzolk'in), K'iche' first, spelled as K'iche'
 * day-keeper Mark Elmy writes them (thefourpillars.net). English glosses follow the
 * K'iche' meanings; the Yucatec name is kept for people who know that tradition.
 */
export const DAY_SIGNS: { kiche: string; english: string; yucatec: string }[] = [
  { kiche: 'Imox', english: 'Water', yucatec: 'Imix' },
  { kiche: "Iq'", english: 'Wind', yucatec: "Ik'" },
  { kiche: "Aq'ab'al", english: 'Dawn', yucatec: "Ak'bal" },
  { kiche: "K'at", english: 'Net', yucatec: "K'an" },
  { kiche: 'Kan', english: 'Serpent', yucatec: 'Chikchan' },
  { kiche: 'Kame', english: 'Death', yucatec: 'Kimi' },
  { kiche: 'Kej', english: 'Deer', yucatec: "Manik'" },
  { kiche: "Q'anil", english: 'Seed', yucatec: 'Lamat' },
  { kiche: 'Toj', english: 'Offering', yucatec: 'Muluk' },
  { kiche: "Tz'i", english: 'Dog', yucatec: 'Ok' },
  { kiche: "B'atz'", english: 'Thread', yucatec: 'Chuwen' },
  { kiche: "E'", english: 'Road', yucatec: "Eb'" },
  { kiche: 'Aj', english: 'Cane', yucatec: "B'en" },
  { kiche: 'Ix', english: 'Jaguar', yucatec: 'Ix' },
  { kiche: "Tz'ikin", english: 'Bird', yucatec: 'Men' },
  { kiche: 'Ajmak', english: 'Forgiveness', yucatec: "Kib'" },
  { kiche: "No'j", english: 'Knowledge', yucatec: "Kab'an" },
  { kiche: 'Tijax', english: 'Obsidian', yucatec: "Etz'nab'" },
  { kiche: 'Kawok', english: 'Storm', yucatec: 'Kawak' },
  { kiche: 'Ajpu', english: 'Sun', yucatec: 'Ajaw' },
];

export const signIndex = (kiche: string) => DAY_SIGNS.findIndex((s) => s.kiche === kiche);

export function tzolkinAt(number: number, idx: number): Tzolkin {
  const s = DAY_SIGNS[idx];
  return { number, daySign: s.kiche, english: s.english, yucatec: s.yucatec, label: `${number} ${s.kiche}` };
}

/** Chol Q'ij day for a civil date. The count is anchored on 4 Ajpu (JDN 584283). */
export function tzolkin(birthDate: string): Tzolkin {
  const { year, month, day } = parseDate(birthDate);
  const n = julianDayNumber(year, month, day) - GMT_CORRELATION;
  const number = (((n + 3) % 13) + 13) % 13 + 1;
  return tzolkinAt(number, (((n + 19) % 20) + 20) % 20);
}

/** Civil date for a Julian Day Number (proleptic Gregorian), as YYYY-MM-DD. */
export function dateFromJdn(jdn: number): string {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const jdn = (date: string) => { const { year, month, day } = parseDate(date); return julianDayNumber(year, month, day); };
export const tzolkinAtJdn = (j: number): Tzolkin => tzolkin(dateFromJdn(j));

/**
 * The four directions and their colors in the K'iche' tradition. The 20 nawales
 * cycle East, North, West, South starting from Imox.
 */
export const DIRECTIONS = [
  { direction: 'East', color: 'Red', kiche: "Relib'al Q'ij" },
  { direction: 'North', color: 'White', kiche: "Xukut Kaj" },
  { direction: 'West', color: 'Black', kiche: "Uqajib'al Q'ij" },
  { direction: 'South', color: 'Yellow', kiche: "Xukut Ulew" },
] as const;
export const directionOf = (idx: number) => DIRECTIONS[idx % 4];

/**
 * The Macehual Q'ij, the highland Maya solar year: exactly 365 days, no leap days,
 * so its new year drifts one day earlier against the Gregorian calendar every four
 * years. Each year is carried by a Mam (year bearer), always one of E', No'j, Iq'
 * or Kej. Anchored on the seating of 11 E' on 19 February 2023, as kept by the
 * K'iche' day-keepers Mark Elmy counts with (thefourpillars.net); 1 Kej was seated
 * on 18 February 2026. The five days before each new year are the Tz'apin Q'ij,
 * closing days of retreat.
 */
const MAM_EPOCH = julianDayNumber(2023, 2, 19);
export const SOLAR_YEAR = 365;

export interface YearBearer { mam: Tzolkin; seated: string; ends: string; tzapinStart: string; nextSeated: string; nextMam: Tzolkin }

/** The Mam carrying the solar year that contains `date`. */
export function yearBearer(date: string): YearBearer {
  const j = jdn(date);
  const k = Math.floor((j - MAM_EPOCH) / SOLAR_YEAR);
  const seated = MAM_EPOCH + k * SOLAR_YEAR;
  return {
    mam: tzolkinAtJdn(seated),
    seated: dateFromJdn(seated),
    ends: dateFromJdn(seated + SOLAR_YEAR - 1),
    tzapinStart: dateFromJdn(seated + SOLAR_YEAR - 5),
    nextSeated: dateFromJdn(seated + SOLAR_YEAR),
    nextMam: tzolkinAtJdn(seated + SOLAR_YEAR),
  };
}

/** True during the five Tz'apin Q'ij days that close a solar year. */
export function isTzapinQij(date: string): boolean {
  const y = yearBearer(date);
  return date >= y.tzapinStart;
}

/** Next occurrence (on or after `date`) of a given day, e.g. 8 B'atz'. */
export function nextDay(date: string, number: number, daySign: string): string {
  const t = tzolkin(date);
  const idx = signIndex(daySign);
  const cur = signIndex(t.daySign);
  // Solve n ≡ idx−cur (mod 20), n ≡ number−t.number (mod 13) by search over 260.
  for (let n = 0; n < 260; n++) if ((cur + n) % 20 === idx && ((t.number - 1 + n) % 13) + 1 === number) return dateFromJdn(jdn(date) + n);
  throw new Error('unreachable');
}

/** The 13 days of the trecena containing `date`, with civil dates. */
export function trecenaDays(date: string): { date: string; day: Tzolkin }[] {
  const t = tzolkin(date);
  const start = jdn(date) - (t.number - 1);
  return Array.from({ length: 13 }, (_, i) => ({ date: dateFromJdn(start + i), day: tzolkinAtJdn(start + i) }));
}
