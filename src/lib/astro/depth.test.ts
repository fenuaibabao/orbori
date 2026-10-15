import { describe, expect, it } from 'vitest';
import { computeChart } from '.';
import { vimshottari } from './dasha';
import { chartDepth } from './depth';
import { mayanDepth } from './mayan-depth';
import { ageOn, karmicDebts, maturityNumber, nameLessons, nameNumbers, personalCycles, pinnaclesAndChallenges } from './numerology-depth';

const chart = computeChart({ date: '1994-07-10', time: '12:52', timeZone: 'America/Los_Angeles', latitude: 37.87, longitude: -122.27 });

describe('Vimshottari Dasha', () => {
  it('first period is the Moon nakshatra lord and the full cycle spans 120 years from its notional start', () => {
    const birth = new Date('1994-07-10T19:52:00Z');
    const d = vimshottari(chart.vedic.planets.moon.longitude, birth);
    expect(d[0].lord).toBe(chart.vedic.moonNakshatra.lord);
    const total = d.slice(0, 9).reduce((s, x) => s + x.years, 0);
    expect(total).toBe(120);
    // Consecutive periods touch.
    for (let i = 1; i < d.length; i++) expect(d[i].start).toBe(d[i - 1].end);
  });
  it('sub-periods of a full Mahadasha add up to it', () => {
    const d = vimshottari(10, new Date('2000-01-01T00:00:00Z'));
    const full = d[1];
    expect(full.antar[0].start).toBe(full.start);
    expect(full.antar[full.antar.length - 1].end).toBe(full.end);
  });
});

describe('Depth bundle', () => {
  const depth = chartDepth(chart, '2026-10-14');
  it('has 12 Placidus houses and every planet in one', () => {
    expect(depth.western.houseSystem).toBe('Placidus');
    expect(depth.western.cusps).toHaveLength(12);
    expect(depth.western.cusps![0].longitude).toBeCloseTo(chart.western.ascendant!.longitude, 6);
    for (const p of depth.western.planets) expect(p.house).toBeGreaterThanOrEqual(1);
  });
  it('element balance counts the 7 classic planets + Ascendant', () => {
    expect(Object.values(depth.western.balance.elements).reduce((s, n) => s + n, 0)).toBe(8);
  });
  it('has a current Dasha chapter', () => {
    expect(depth.vedic.current.maha).not.toBeNull();
    expect(depth.vedic.current.antar).not.toBeNull();
  });
  it('Four Pillars year is Wood Dog for 1994', () => {
    expect(depth.bazi.year.label).toBe('Yang Wood Dog');
  });
});

describe('Numerology and Mayan depth', () => {
  it('personal year for 7/10 in 2026: 7+1+1 = 9', () => {
    expect(personalCycles('1994-07-10', '2026-10-14').personalYear).toBe(9);
  });
  it('name numbers (Pythagorean)', () => {
    // A=1 B=2 ... ; "ABC" = 6, vowels A = 1, consonants B+C = 5
    expect(nameNumbers('abc')).toEqual({ expression: 6, soulUrge: 1, personality: 5 });
    expect(nameNumbers('---')).toBeNull();
  });
  it('trecena and cross are consistent with the 260-day count', () => {
    const m = mayanDepth('2012-12-21', '2026-10-14'); // 4 Ajpu
    expect(m.trecena.dayOfTrecena).toBe(4);
    expect(m.trecena.daySign).toBe('No\'j'); // 3 days before 4 Ajpu is 1 No'j
    expect(m.cross.destiny.label).toBe('12 Q\'anil'); // +8: 4+8 = 12; Ajpu (20th) + 8 = Q'anil (8th)
    expect(m.cross.conception.label).toBe('9 E\''); // −8: 4−8 → 9; Ajpu − 8 = E' (12th)
  });
});

describe('Numerology depth', () => {
  it('pinnacles and challenges for 1994-07-10 (Life Path 4)', () => {
    // month 7, day 1 (10→1), year 1994→23→5. P1=8, P2=6, P3=14→5, P4=12→3. C1=|7−1|=6, C2=|1−5|=4, C3=2, C4=2.
    const p = pinnaclesAndChallenges('1994-07-10', 4);
    expect(p.map((x) => x.pinnacle)).toEqual([8, 6, 5, 3]);
    expect(p.map((x) => x.challenge)).toEqual([6, 4, 2, 2]);
    expect(p[0].to).toBe(32);
    expect(p[1]).toMatchObject({ from: 33, to: 41 });
    expect(p[3]).toMatchObject({ from: 51, to: null });
  });
  it('karmic debts and lessons', () => {
    expect(karmicDebts('1990-01-16')).toEqual([{ source: 'Birthday', number: 16 }]);
    expect(karmicDebts('1994-07-10')).toEqual([{ source: 'Life Path', number: 13 }]); // 7+1+5
    expect(karmicDebts('1990-03-02')).toEqual([]);
    const l = nameLessons('abc')!;
    expect(l.lessons).toEqual([4, 5, 6, 7, 8, 9]);
    expect(l.hiddenPassion).toEqual([1, 2, 3]);
    expect(maturityNumber(4, 6)).toBe(1);
  });
  it('personal day and age', () => {
    expect(personalCycles('1994-07-10', '2026-10-15').personalDay).toBe(r9(r9(9 + 10) + 15));
    expect(ageOn('1994-07-10', '2026-07-09')).toBe(31);
    expect(ageOn('1994-07-10', '2026-07-10')).toBe(32);
  });
});
const r9 = (n: number) => { while (n > 9) n = String(n).split('').reduce((s, d) => s + +d, 0); return n; };
