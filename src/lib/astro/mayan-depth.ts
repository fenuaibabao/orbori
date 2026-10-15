/**
 * Chol Q'ij depth: the trecena (13-day period) you were born in, the Mayan cross,
 * the Mam (year bearer) of your birth year and of this year, your nawal's direction,
 * and the next Wajxaqib' B'atz'. Mark Elmy does not publish a cross method; the
 * cross here is the widely used K'iche' form (conception and destiny 8 days
 * before/after, the two sides 6 days before/after), and day-keepers may read it differently.
 */
import { directionOf, isTzapinQij, nextDay, signIndex, trecenaDays, tzolkin, tzolkinAt, yearBearer } from './mayan';

const mod = (n: number, m: number) => ((n % m) + m) % m;
const shift = (number: number, idx: number, days: number) => tzolkinAt(mod(number - 1 + days, 13) + 1, mod(idx + days, 20));

export function mayanDepth(birthDate: string, today: string) {
  const t = tzolkin(birthDate);
  const idx = signIndex(t.daySign);
  const start = shift(t.number, idx, -(t.number - 1)); // the most recent day numbered 1
  const now = tzolkin(today);
  const todayTrecena = trecenaDays(today);
  return {
    direction: directionOf(idx),
    trecena: { daySign: start.daySign, english: start.english, dayOfTrecena: t.number, days: trecenaDays(birthDate) },
    cross: {
      conception: shift(t.number, idx, -8),
      destiny: shift(t.number, idx, 8),
      left: shift(t.number, idx, -6),
      right: shift(t.number, idx, 6),
    },
    birthMam: yearBearer(birthDate),
    today: {
      date: today,
      day: now,
      trecena: { daySign: todayTrecena[0].day.daySign, dayOfTrecena: now.number, days: todayTrecena },
      mam: yearBearer(today),
      tzapinQij: isTzapinQij(today),
      nextWajxaqibBatz: nextDay(today, 8, "B'atz'"),
    },
  };
}
