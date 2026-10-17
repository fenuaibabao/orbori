import { describe, expect, it } from 'vitest';
import { computeChart } from './astro';
import { constellationDays, groupStreak } from './constellation';

describe('Constellation', () => {
  it('counts nights everyone checked in', () => {
    const ci = [['a', '2026-10-14'], ['b', '2026-10-14'], ['a', '2026-10-15'], ['b', '2026-10-15'], ['a', '2026-10-16']].map(([user_id, date]) => ({ user_id, date }));
    expect(groupStreak(['a', 'b'], ci, '2026-10-16')).toEqual({ streak: 2, litTonight: false });
    expect(groupStreak(['a', 'b'], [...ci, { user_id: 'b', date: '2026-10-16' }], '2026-10-16')).toEqual({ streak: 3, litTonight: true });
    expect(groupStreak(['a'], ci, '2026-10-16').streak).toBe(0);
  });
  it('finds days the whole group lines up', () => {
    const charts = [
      { date: '1994-07-10', time: '12:52', timeZone: 'America/Los_Angeles', latitude: 37.87, longitude: -122.27 },
      { date: '1997-03-14', time: null, timeZone: 'America/Chicago', latitude: 41.88, longitude: -87.63 },
    ].map((p) => computeChart(p));
    const days = constellationDays(charts, '2026-10-17', 365, 'America/Los_Angeles');
    expect(days.length).toBeGreaterThan(0);
    expect(days.length).toBeLessThan(40);
  });
});
