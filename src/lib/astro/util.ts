import { SIGNS, type Placement } from './types';

export const norm360 = (x: number) => ((x % 360) + 360) % 360;
export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

export function placement(longitude: number, retrograde = false): Placement {
  const lon = norm360(longitude);
  const idx = Math.floor(lon / 30);
  return { longitude: lon, sign: SIGNS[idx], degree: lon - idx * 30, retrograde };
}

/** Julian Day Number (integer, noon-based) of a proleptic Gregorian civil date. */
export function julianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  );
}

export function parseDate(date: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date "${date}" (expected YYYY-MM-DD)`);
  return { year: +m[1], month: +m[2], day: +m[3] };
}
