/**
 * Chol Q'ij depth: the trecena (13-day period) you were born in, and the Mayan
 * cross: conception and destiny are 8 days before/after the birth day, the two
 * sides 6 days before/after. Mark Elmy does not publish a cross method; this is
 * the widely used K'iche' form, and day-keepers may read it differently.
 */
import { signIndex, tzolkin, tzolkinAt } from './mayan';

const mod = (n: number, m: number) => ((n % m) + m) % m;
const shift = (number: number, idx: number, days: number) => tzolkinAt(mod(number - 1 + days, 13) + 1, mod(idx + days, 20));

export function mayanDepth(birthDate: string) {
  const t = tzolkin(birthDate);
  const idx = signIndex(t.daySign);
  const start = shift(t.number, idx, -(t.number - 1)); // the most recent day numbered 1
  return {
    trecena: { daySign: start.daySign, english: start.english, dayOfTrecena: t.number },
    cross: {
      conception: shift(t.number, idx, -8),
      destiny: shift(t.number, idx, 8),
      left: shift(t.number, idx, -6),
      right: shift(t.number, idx, 6),
    },
  };
}
