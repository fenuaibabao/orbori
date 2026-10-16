import { describe, expect, it } from 'vitest';
import { lunarNight, sevenPaths } from './paths';
import type { ActivityLog, CheckIn } from './progress';
import { GLOSSARY } from './glossary';

const day = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 86400000).toISOString().slice(0, 10);

describe('Seven Paths', () => {
  it('approximates the lunar month (2026-01-03 was a full moon, 2026-01-18 a new moon)', () => {
    expect([14, 15, 16]).toContain(lunarNight('2026-01-03'));
    expect([29, 30, 1]).toContain(lunarNight('2026-01-18'));
  });
  it('starts with nothing done and finishes a path when every quest is met', () => {
    expect(sevenPaths({ checkIns: {}, activity: {}, birthDate: '1994-07-10' }).every((p) => !p.done)).toBe(true);
    const checkIns: Record<string, CheckIn> = {};
    const activity: ActivityLog = {};
    for (let i = 0; i < 60; i++) {
      checkIns[day(i)] = { answer: 'kinda', score: 6 };
      activity[day(i)] = { deepOn: ['chinese'], games: ['chinese'], perfect: ['chinese'], terms: [] };
    }
    activity[day(0)].terms = GLOSSARY.filter((g) => g.system === 'Chinese').map((g) => g.id);
    const paths = sevenPaths({ checkIns, activity, birthDate: '1994-07-10' });
    expect(paths.find((p) => p.id === 'chinese')!.done).toBe(true);
    expect(paths.find((p) => p.id === 'vedic')!.done).toBe(false);
    expect(paths.find((p) => p.id === 'chinese')!.title).toBe('Student of the Four Pillars');
  });
});
