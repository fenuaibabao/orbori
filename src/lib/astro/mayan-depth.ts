/**
 * Tzolk'in depth: the trecena (13-day "week") you were born in, and the Mayan
 * cross used by many K'iche' day-keepers: conception and destiny are 8 days
 * before/after the birth day, the two sides 6 days before/after. Practice varies
 * between communities; this follows the widely published K'iche' form.
 */
import { DAY_SIGNS, tzolkin } from './mayan';

const mod = (n: number, m: number) => ((n % m) + m) % m;

function shift(number: number, signIdx: number, days: number) {
  const s = DAY_SIGNS[mod(signIdx + days, 20)];
  const n = mod(number - 1 + days, 13) + 1;
  return { number: n, daySign: s.yucatec, kicheName: s.kiche, english: s.english, label: `${n} ${s.english}` };
}

export function mayanDepth(birthDate: string) {
  const t = tzolkin(birthDate);
  const idx = DAY_SIGNS.findIndex((s) => s.yucatec === t.daySign);
  // The trecena starts on the most recent day numbered 1.
  const trecenaStart = shift(t.number, idx, -(t.number - 1));
  return {
    trecena: { sign: trecenaStart.english, daySign: trecenaStart.daySign, kicheName: trecenaStart.kicheName, dayOfTrecena: t.number },
    cross: {
      conception: shift(t.number, idx, -8),
      destiny: shift(t.number, idx, 8),
      left: shift(t.number, idx, -6),
      right: shift(t.number, idx, 6),
    },
  };
}
