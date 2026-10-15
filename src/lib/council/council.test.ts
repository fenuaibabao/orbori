import { describe, expect, it } from 'vitest';
import { computeChart } from '../astro';
import { cosmicCouncil } from '.';
import { dayPillar, personalDay } from './signals';

const chart = computeChart({ date: '1996-07-18', time: '04:12', timeZone: 'America/Los_Angeles', latitude: 37.8, longitude: -122.27 });

describe('Cosmic Council', () => {
  it('day pillar: 2000-01-01 is Earth Horse (Wu Wu)', () => {
    expect(dayPillar('2000-01-01')).toMatchObject({ index: 54, animal: 'Horse', element: 'Earth' });
  });

  it('personal day: month+day+year reduced, then + month, + day', () => {
    // Birth 7/18 → 7 + 9; 2026 → 1; PY = 17 → 8; PM (Oct) = 8+1 = 9; PD (14th) = 9+5 = 14 → 5
    expect(personalDay('1996-07-18', '2026-10-14')).toEqual({ year: 8, month: 9, day: 5 });
  });

  it('produces a full, stable reading', () => {
    const a = cosmicCouncil(chart, '2026-10-14', 'America/Los_Angeles');
    const b = cosmicCouncil(chart, '2026-10-14', 'America/Los_Angeles');
    expect(a).toEqual(b);
    expect(a.systems).toHaveLength(7);
    expect(a.score).toBeGreaterThanOrEqual(1);
    expect(a.score).toBeLessThanOrEqual(10);
    expect(a.systems.filter((s) => s.agrees)).toHaveLength(a.agreeCount);
  });

  it('scores spread across the range over a year', () => {
    const scores: number[] = [];
    for (let d = 0; d < 365; d++) {
      const date = new Date(Date.UTC(2026, 0, 1) + d * 86400000).toISOString().slice(0, 10);
      scores.push(cosmicCouncil(chart, date, 'America/Los_Angeles').score);
    }
    const lo = scores.filter((s) => s < 4).length;
    const hi = scores.filter((s) => s >= 7).length;
    expect(lo).toBeGreaterThan(10);
    expect(hi).toBeGreaterThan(10);
    console.log('score distribution', { lo, mid: 365 - lo - hi, hi, min: Math.min(...scores), max: Math.max(...scores) });
  });
});
