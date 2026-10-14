import type { BirthInput } from './astro/types';

/** Validate untrusted birth input from a request body. Throws with a friendly message. */
export function parseBirthInput(body: unknown): BirthInput {
  const b = body as Partial<BirthInput> | null;
  if (!b || typeof b !== 'object') throw new Error('Missing birth details.');
  const { date, time, timeZone, latitude, longitude } = b;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Birth date looks off.');
  const y = +date.slice(0, 4);
  if (y < 1900 || y > 2100) throw new Error('Birth year must be between 1900 and 2100.');
  if (time !== null && (typeof time !== 'string' || !/^\d{1,2}:\d{2}$/.test(time))) throw new Error('Birth time looks off.');
  if (typeof timeZone !== 'string' || timeZone.length > 64) throw new Error('Pick a birth city from the list.');
  if (typeof latitude !== 'number' || Math.abs(latitude) > 90) throw new Error('Pick a birth city from the list.');
  if (typeof longitude !== 'number' || Math.abs(longitude) > 180) throw new Error('Pick a birth city from the list.');
  return { date, time: time ?? null, timeZone, latitude, longitude };
}
