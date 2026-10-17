import { describe, expect, it } from 'vitest';
import { computeChart } from '../astro';
import { chartRead } from './chart-read';

const chart = (date: string, time: string | null) => computeChart({ date, time, timeZone: 'America/Los_Angeles', latitude: 37.87, longitude: -122.27 });

describe('chartRead', () => {
  it('is the same every time for the same chart', () => {
    expect(chartRead(chart('1994-07-10', '12:52'))).toEqual(chartRead(chart('1994-07-10', '12:52')));
  });
  it('gives a headline, 2 to 4 themes and a count that matches the dots', () => {
    for (const [d, t] of [['1994-07-10', '12:52'], ['1990-01-15', null], ['2001-11-03', '06:10'], ['1975-03-30', '23:00']] as const) {
      const r = chartRead(chart(d, t));
      expect(r.headline).toMatch(/^An? .+\.$/);
      expect(r.themes.length).toBeGreaterThanOrEqual(2);
      expect(r.themes.length).toBeLessThanOrEqual(4);
      expect(Object.values(r.agree).filter(Boolean).length).toBe(r.agreeCount);
      expect(r.differs.length).toBe(7 - r.agreeCount);
      for (const th of r.themes) expect(new Set(th.voices.map((v) => v.tradition)).size).toBe(th.count);
    }
  });
});
