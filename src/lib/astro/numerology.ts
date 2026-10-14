import type { Numerology } from './types';
import { parseDate } from './util';

const MASTER = new Set([11, 22, 33]);

/** Repeatedly sum digits until a single digit or a master number remains. */
export function reduce(n: number): number {
  while (n > 9 && !MASTER.has(n)) {
    n = String(n).split('').reduce((s, d) => s + +d, 0);
  }
  return n;
}

/** Life Path: reduce month, day and year separately, add, reduce again (masters kept). */
export function lifePath(birthDate: string): Numerology {
  const { year, month, day } = parseDate(birthDate);
  const n = reduce(reduce(month) + reduce(day) + reduce(year));
  return { lifePath: n, isMasterNumber: MASTER.has(n) };
}
