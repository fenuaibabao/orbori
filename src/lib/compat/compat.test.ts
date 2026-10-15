import { describe, expect, it } from 'vitest';
import { computeChart } from '../astro';
import { compatibility } from '.';
import { gunaMilan } from './guna';

const mk = (date: string, time: string | null = '12:00') =>
  computeChart({ date, time, timeZone: 'America/Los_Angeles', latitude: 37.8, longitude: -122.27 });

const a = mk('1996-07-18', '04:12');
const b = mk('1992-04-02', null);

describe('Guna Milan', () => {
  it('is symmetric and within 0–36', () => {
    const x = gunaMilan(a, b), y = gunaMilan(b, a);
    expect(x.total).toBe(y.total);
    expect(x.total).toBeGreaterThanOrEqual(0);
    expect(x.total).toBeLessThanOrEqual(36);
  });
  it('same Moon nakshatra: everything but Nadi is maxed (28/36)', () => {
    expect(gunaMilan(a, a)).toMatchObject({ varna: 1, vashya: 2, tara: 3, yoni: 4, maitri: 5, gana: 6, bhakoot: 7, nadi: 0, total: 28 });
  });
});

describe('Compatibility', () => {
  it('scores seven traditions and averages them', () => {
    const c = compatibility(a, b);
    expect(c.systems).toHaveLength(7);
    const avg = c.systems.reduce((s, x) => s + x.score, 0) / 7;
    expect(c.score).toBeCloseTo(avg, 1);
    expect(c.score).toBeGreaterThanOrEqual(1);
    expect(c.score).toBeLessThanOrEqual(10);
  });
  it('Rat × Monkey is a same-trine Chinese match', () => {
    const c = compatibility(a, b);
    expect(a.chinese.animal).toBe('Rat');
    expect(b.chinese.animal).toBe('Monkey');
    expect(c.systems.find((s) => s.system === 'chinese')!.score).toBeGreaterThanOrEqual(9);
  });
  it('spreads scores across many pairs', () => {
    const scores: number[] = [];
    for (let i = 0; i < 120; i++) {
      const d1 = new Date(Date.UTC(1970, 0, 1) + i * 97 * 86400000).toISOString().slice(0, 10);
      const d2 = new Date(Date.UTC(1975, 5, 1) + i * 53 * 86400000).toISOString().slice(0, 10);
      scores.push(compatibility(mk(d1), mk(d2)).score);
    }
    expect(Math.min(...scores)).toBeLessThan(6);
    expect(Math.max(...scores)).toBeGreaterThan(7.5);
  });
});
