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
