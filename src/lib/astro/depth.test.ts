import * as A from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { moonPhase, nextSolarReturn, partOfFortune, progressions, transits } from './western-depth';
import { dignity, panchanga, pratyantar, saturnTransit } from './vedic-depth';
import { SIGNS, type Placement, type Sign } from './types';
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

describe('Western depth', () => {
  it('Moon phase: full moon of 17 Oct 2024 (11:26 UTC) and new moon of 2 Oct 2024', () => {
    const full = computeChart({ date: '2024-10-17', time: '13:00', timeZone: 'UTC', latitude: 0, longitude: 0 });
    const ph = moonPhase(full.western.planets.sun.longitude, full.western.planets.moon.longitude, A.MakeTime(new Date('2024-10-17T13:00:00Z')));
    expect(ph.name).toBe('Full Moon');
    expect(Math.abs(ph.elongation - 180)).toBeLessThan(1);
    expect(ph.illumination).toBe(100);
    const nw = computeChart({ date: '2024-10-02', time: '20:00', timeZone: 'UTC', latitude: 0, longitude: 0 });
    expect(moonPhase(nw.western.planets.sun.longitude, nw.western.planets.moon.longitude, A.MakeTime(new Date('2024-10-02T20:00:00Z'))).name).toBe('New Moon');
  });
  it('Part of Fortune uses the day formula for a noon birth', () => {
    const f = partOfFortune(chart.western)!;
    expect(f.dayChart).toBe(true);
    const w = chart.western;
    const expected = ((w.ascendant!.longitude + w.planets.moon.longitude - w.planets.sun.longitude) % 360 + 360) % 360;
    expect(f.point.longitude).toBeCloseTo(expected, 6);
  });
  it('progressed Sun is about 32° past natal for a 32-year-old, and the solar return lands on the birthday', () => {
    const p = progressions(A.MakeTime(new Date('1994-07-10T19:52:00Z')), new Date('2026-07-10T19:52:00Z'));
    expect(p.ageYears).toBeCloseTo(32, 0);
    const diff = ((p.planets[0].longitude - chart.western.planets.sun.longitude) % 360 + 360) % 360;
    expect(diff).toBeGreaterThan(29); expect(diff).toBeLessThan(33);
    const sr = nextSolarReturn(chart.western.planets.sun.longitude, new Date('2026-01-01T00:00:00Z'));
    expect(sr.slice(0, 10)).toMatch(/^2026-07-(09|10|11)$/);
  });
  it('transits are sorted by orb and name real bodies', () => {
    const t = transits(chart.western, new Date('2026-10-15T12:00:00Z'));
    for (let i = 1; i < t.length; i++) expect(t[i].orb).toBeGreaterThanOrEqual(t[i - 1].orb);
    expect(t.every((x) => ['Pluto', 'Neptune', 'Uranus', 'Saturn', 'Jupiter', 'Mars', 'Sun'].includes(x.transiting))).toBe(true);
  });
});

describe('Vedic depth', () => {
  it('panchanga: Purnima ends at the full moon, Amavasya at the new moon', () => {
    const full = computeChart({ date: '2024-10-17', time: '10:00', timeZone: 'UTC', latitude: 0, longitude: 0 });
    expect(panchanga(full.vedic, 4).tithi.label).toBe('Shukla Purnima');
    const after = computeChart({ date: '2024-10-17', time: '13:00', timeZone: 'UTC', latitude: 0, longitude: 0 });
    expect(panchanga(after.vedic, 4).tithi.label).toBe('Krishna Pratipada');
    const nw = computeChart({ date: '2024-10-02', time: '17:00', timeZone: 'UTC', latitude: 0, longitude: 0 });
    expect(panchanga(nw.vedic, 3).tithi.label).toBe('Krishna Amavasya');
    expect(panchanga(nw.vedic, 3).vara).toEqual({ day: 'Wednesday', lord: 'Mercury' });
  });
  it('dignities follow the classical tables', () => {
    const at = (sign: string, degree: number): Placement => ({ longitude: SIGNS.indexOf(sign as Sign) * 30 + degree, sign: sign as Sign, degree, retrograde: false });
    expect(dignity('Sun', at('Aries', 10))).toBe('Exalted');
    expect(dignity('Sun', at('Libra', 10))).toBe('Debilitated');
    expect(dignity('Sun', at('Leo', 10))).toBe('Moolatrikona');
    expect(dignity('Sun', at('Leo', 25))).toBe('Own sign');
    expect(dignity('Saturn', at('Leo', 25))).toBe("Enemy's sign");
    expect(dignity('Venus', at('Capricorn', 5))).toBe("Friend's sign");
    expect(dignity('Jupiter', at('Capricorn', 5))).toBe('Debilitated');
  });
  it('yogas: Budha-Aditya when Sun and Mercury share a sign; pratyantar periods tile the antar', () => {
    const d = chartDepth(chart, '2026-10-14');
    const budha = d.vedic.yogas.some((y) => y.name.startsWith('Budha-Aditya'));
    expect(budha).toBe(chart.vedic.planets.sun.sign === chart.vedic.planets.mercury.sign);
    const antar = d.vedic.dashas[1].antar[0];
    const pr = pratyantar(antar);
    expect(pr).toHaveLength(9);
    expect(pr[0].start).toBe(antar.start);
    expect(pr[8].end).toBe(antar.end);
  });
  it('Saturn transit reports a house from the Moon and a next sign change', () => {
    const s = saturnTransit('Leo', new Date('2026-10-15T12:00:00Z'));
    expect(s.houseFromMoon).toBeGreaterThanOrEqual(1);
    expect(s.nextSignChange).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
