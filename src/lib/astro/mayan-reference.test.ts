import { describe, expect, it } from 'vitest';
import { tzolkin } from './mayan';
import { mayanDepth } from './mayan-depth';

// Mark Elmy's published Chol Q'ij calendar for October 2026 (thefourpillars.net/october-2026),
// in his spellings. Orbori must match a living K'iche' day-keeper's count exactly.
const OCTOBER_2026 = [
  "5 E'", '6 Aj', '7 Ix', "8 Tz'ikin", '9 Ajmak', "10 No'j", '11 Tijax', '12 Kawok', '13 Ajpu', '1 Imox',
  "2 Iq'", "3 Aq'ab'al", "4 K'at", '5 Kan', '6 Kame', '7 Kej', "8 Q'anil", '9 Toj', "10 Tz'i", "11 B'atz'",
  "12 E'", '13 Aj', '1 Ix', "2 Tz'ikin", '3 Ajmak', "4 No'j", '5 Tijax', '6 Kawok', '7 Ajpu', '8 Imox', "9 Iq'",
];

describe("Chol Q'ij matches Mark Elmy's published count", () => {
  it.each(OCTOBER_2026.map((d, i) => [`2026-10-${String(i + 1).padStart(2, '0')}`, d]))('%s is %s', (date, expected) => {
    expect(tzolkin(date).label).toBe(expected);
  });
  it('the Imox trecena runs 10–22 October 2026', () => {
    expect(mayanDepth('2026-10-10').trecena.daySign).toBe('Imox');
    expect(mayanDepth('2026-10-22').trecena.daySign).toBe('Imox');
    expect(mayanDepth('2026-10-23').trecena.daySign).toBe('Ix');
  });
});
