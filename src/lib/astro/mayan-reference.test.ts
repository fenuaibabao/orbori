import { describe, expect, it } from 'vitest';
import { tzolkin } from './mayan';
import { mayanDepth } from './mayan-depth';

// Daily Chol Q'ij posts by K'iche' day-keeper Mark Elmy (thefourpillars.net), October 2026.
const PUBLISHED: [string, string][] = [
  ['2026-10-07', '11 Tijax'], ['2026-10-08', '12 Kawoq'], ['2026-10-09', '13 Ajpu'], ['2026-10-10', '1 Imox'],
  ['2026-10-11', "2 Iq'"], ['2026-10-12', "3 Aq'ab'al"], ['2026-10-13', "4 K'at"], ['2026-10-14', '5 Kan'],
];

describe("Tzolk'in matches a living day-keeper's count", () => {
  it.each(PUBLISHED)('%s is %s', (date, expected) => {
    const t = tzolkin(date);
    expect(`${t.number} ${t.kicheName}`).toBe(expected);
  });
  it('the Imox trecena runs 10–22 October 2026', () => {
    expect(mayanDepth('2026-10-10').trecena.kicheName).toBe('Imox');
    expect(mayanDepth('2026-10-22').trecena.kicheName).toBe('Imox');
    expect(mayanDepth('2026-10-23').trecena.kicheName).not.toBe('Imox');
  });
});
