import * as A from 'astronomy-engine';
import type { ChineseZodiac } from './types';

export const ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const;

const SYNODIC = 29.530588853;
const DAY_MS = 86400000;

/** Day number (days since 1970-01-01) of an instant in China Standard Time (UTC+8). */
const chinaDay = (t: A.AstroTime) => Math.floor((t.date.getTime() + 8 * 3600000) / DAY_MS);

/** Most recent new moon whose China date is on or before the China date of `t`. */
function newMoonOnOrBefore(t: A.AstroTime): A.AstroTime {
  let nm = A.SearchMoonPhase(0, t.AddDays(-32), 40)!;
  let next = A.SearchMoonPhase(0, nm.AddDays(1), 40)!;
  while (chinaDay(next) <= chinaDay(t)) {
    nm = next;
    next = A.SearchMoonPhase(0, nm.AddDays(1), 40)!;
  }
  return nm;
}

function decemberSolstice(year: number): A.AstroTime {
  return A.Seasons(year).dec_solstice;
}

/** Does the lunar month starting at `start` (ending before `end`) contain a principal solar term (zhongqi)? */
function hasZhongqi(start: A.AstroTime, end: A.AstroTime): boolean {
  // The month runs from the China date of its new moon (00:00 CST) up to the next one.
  const dayStart = A.MakeTime(new Date(chinaDay(start) * DAY_MS - 8 * 3600000));
  const lon0 = A.SunPosition(dayStart).elon;
  const target = ((Math.floor(lon0 / 30) + 1) * 30) % 360;
  const zq = A.SearchSunLongitude(target, dayStart, 40);
  return !!zq && chinaDay(zq) < chinaDay(end);
}

const cache = new Map<number, Date>();

/** Lunar New Year (start of month 1) in Gregorian `year`, by the modern Chinese calendar rules. */
export function lunarNewYear(year: number): Date {
  const hit = cache.get(year);
  if (hit) return hit;
  const m11 = newMoonOnOrBefore(decemberSolstice(year - 1));
  const m11Next = newMoonOnOrBefore(decemberSolstice(year));
  const months = Math.round((m11Next.ut - m11.ut) / SYNODIC);
  const starts: A.AstroTime[] = [m11];
  for (let i = 1; i <= months; i++) starts.push(A.SearchMoonPhase(0, starts[i - 1].AddDays(1), 40)!);

  let monthsToNewYear = 2;
  if (months === 13) {
    // Leap sui: the first month without a principal term is the leap month.
    for (let i = 1; i < months; i++) {
      if (!hasZhongqi(starts[i], starts[i + 1])) {
        if (i <= 2) monthsToNewYear = 3; // leap 11th or 12th month pushes New Year back
        break;
      }
    }
  }
  const ny = starts[monthsToNewYear];
  const d = new Date(chinaDay(ny) * DAY_MS); // UTC midnight of the China calendar date
  cache.set(year, d);
  return d;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Chinese zodiac for a civil birth date, using the Lunar New Year boundary. */
export function chineseZodiac(birthDate: string): ChineseZodiac {
  const year = +birthDate.slice(0, 4);
  const lny = lunarNewYear(year);
  const zodiacYear = birthDate < isoDay(lny) ? year - 1 : year;
  const start = zodiacYear === year ? lny : lunarNewYear(year - 1);
  const offset = (((zodiacYear - 4) % 60) + 60) % 60;
  return {
    animal: ANIMALS[offset % 12],
    element: ELEMENTS[Math.floor((offset % 10) / 2)],
    polarity: offset % 2 === 0 ? 'Yang' : 'Yin',
    lunarYearStart: isoDay(start),
  };
}
