import { describe, expect, it } from 'vitest';
import { directionOf, isTzapinQij, nextDay, signIndex, trecenaDays, tzolkin, yearBearer } from './mayan';
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
    expect(mayanDepth('2026-10-10', '2026-10-15').trecena.daySign).toBe('Imox');
    expect(mayanDepth('2026-10-22', '2026-10-15').trecena.daySign).toBe('Imox');
    expect(mayanDepth('2026-10-23', '2026-10-15').trecena.daySign).toBe('Ix');
  });
});

describe("Mam (year bearer) matches Mark Elmy's solar count", () => {
  it.each([
    ['2023-02-19', "11 E'", '2023-02-19'], ['2023-06-19', "11 E'", '2023-02-19'],
    ['2026-02-18', '1 Kej', '2026-02-18'], ['2026-10-15', '1 Kej', '2026-02-18'],
    ['2019-02-20', "7 E'", '2019-02-20'], ['2020-02-19', "7 E'", '2019-02-20'], ['2020-02-20', "8 No'j", '2020-02-20'],
    ['1971-03-04', "11 E'", '1971-03-04'], ['1994-07-10', '8 Kej', '1994-02-26'],
  ])('%s is carried by %s, seated %s', (date, mam, seated) => {
    const y = yearBearer(date);
    expect(y.mam.label).toBe(mam);
    expect(y.seated).toBe(seated);
  });
  it('the Tz\'apin Q\'ij of 2026 runs 13–17 February', () => {
    expect(isTzapinQij('2026-02-12')).toBe(false);
    expect(isTzapinQij('2026-02-13')).toBe(true);
    expect(isTzapinQij('2026-02-17')).toBe(true);
    expect(isTzapinQij('2026-02-18')).toBe(false);
    expect(tzolkin('2026-02-17').label).toBe('13 Kame');
  });
  it('year bearers rotate E\', No\'j, Iq\', Kej and the number rises by one', () => {
    expect(yearBearer('2024-06-01').mam.label).toBe("12 No'j");
    expect(yearBearer('2025-06-01').mam.label).toBe("13 Iq'");
  });
  it('finds the next Wajxaqib\' B\'atz\' and lays out a trecena', () => {
    const next = nextDay('2026-10-15', 8, "B'atz'");
    expect(tzolkin(next).label).toBe("8 B'atz'");
    expect(next > '2026-10-15').toBe(true);
    const days = trecenaDays('2026-10-15');
    expect(days[0]).toMatchObject({ date: '2026-10-10' });
    expect(days[0].day.label).toBe('1 Imox');
    expect(days[12].day.label).toBe('13 Aj');
    expect(directionOf(signIndex('Imox')).direction).toBe('East');
    expect(directionOf(signIndex("Iq'")).direction).toBe('North');
  });
});
