import { describe, expect, it } from 'vitest';
import { computeChart } from './astro';
import { cosmicCouncil } from './council';
import { findConvergence, glowingDays, glowSummary } from './convergence';
import { calendar, glowEvent } from './ics';

const chart = computeChart({ date: '1994-07-10', time: '12:52', timeZone: 'America/Los_Angeles', latitude: 37.87, longitude: -122.27 });

describe('Convergence forecast', () => {
  it('finds Alignments that match what Today will say', () => {
    const days = glowingDays(chart, '2026-10-16', 30, 'America/Los_Angeles');
    expect(days.map((g) => g.d)).toEqual(['2026-10-23', '2026-10-31']);
    for (const g of days) {
      const r = cosmicCouncil(chart, g.d, 'America/Los_Angeles');
      expect(r.agreeCount).toBe(g.n);
      expect(g.v.filter((v) => !v[1]).length).toBe(7 - g.n);
    }
    expect(glowSummary(days[0])).toMatch(/^6 of 7 voices agree\. Only the Chol Q'ij differs and says wait\.$/);
  });
  it('finds the next full Convergence', () => {
    const g = findConvergence(chart, '2027-10-16', 600, 'America/Los_Angeles');
    expect(g?.d).toBe('2028-03-07');
    expect(g?.n).toBe(7);
    expect(glowSummary(g!)).toMatch(/All 7 voices/);
  });
  it('writes a valid all-day calendar event', () => {
    const [g] = glowingDays(chart, '2026-10-23', 1, 'America/Los_Angeles');
    const ics = calendar('Orbori', [glowEvent(g, 'abc')]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261023\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20261024\r\n');
    expect(ics).toContain('TRIGGER:-PT4H');
    for (const line of ics.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });
});
