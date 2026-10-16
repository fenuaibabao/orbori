import { describe, expect, it } from 'vitest';
import { activityXp, computeProgress, weekChallenges, weekStart, XP, type CheckIn } from './progress';

const ci = (...days: string[]) => Object.fromEntries(days.map((d) => [d, { answer: 'kinda', score: 6 } as CheckIn]));

describe('streaks', () => {
  it('consecutive nights add up', () => {
    expect(computeProgress({ checkIns: ci('2026-10-10', '2026-10-11', '2026-10-12'), today: '2026-10-12' }).streak).toBe(3);
  });
  it('one missed night knocks the streak back one instead of resetting it', () => {
    // 10, 11, 12 (3) → miss 13 → 14 checks in: 3 − 1 + 1 = 3
    expect(computeProgress({ checkIns: ci('2026-10-10', '2026-10-11', '2026-10-12', '2026-10-14'), today: '2026-10-14' }).streak).toBe(3);
  });
  it('before checking in after a missed night, the streak shows one less and flags it', () => {
    const p = computeProgress({ checkIns: ci('2026-10-10', '2026-10-11', '2026-10-12'), today: '2026-10-14' });
    expect(p.streak).toBe(2);
    expect(p.knockedBack).toBe(true);
  });
  it('two missed nights in a row reset it', () => {
    expect(computeProgress({ checkIns: ci('2026-10-10', '2026-10-11', '2026-10-12', '2026-10-15'), today: '2026-10-15' }).streak).toBe(1);
    expect(computeProgress({ checkIns: ci('2026-10-10', '2026-10-11'), today: '2026-10-14' }).streak).toBe(0);
  });
  it('the 7-night bonus is paid once per run', () => {
    const days = ['01', '02', '03', '04', '05', '06', '07', '09', '10'].map((d) => `2026-10-${d}`);
    const p = computeProgress({ checkIns: ci(...days), today: '2026-10-10' });
    expect(p.streak).toBe(8);
    const weekly = p.xp - days.length * XP.checkIn - XP.streak7;
    expect(weekly % XP.challenge).toBe(0); // only challenge bonuses remain
  });
});

describe('XP sources', () => {
  it('activities add up and cap at 40 a day', () => {
    expect(activityXp({ deep: true, learn: true })).toBe(10);
    expect(activityXp({ deep: true, learn: true, share: true, nudge: true, question: 'mayan:yes', sync: true })).toBe(40);
  });
  it('entered matches count only for the first five; linked people count fully', () => {
    const p = computeProgress({ checkIns: {}, today: '2026-10-15', matches: 12, linked: 2 });
    expect(p.xp).toBe(5 * XP.match + 2 * XP.linked);
  });
  it('weekly challenges run Monday to Sunday and pay when complete', () => {
    expect(weekStart('2026-10-15')).toBe('2026-10-12'); // Thursday → Monday
    expect(weekStart('2026-10-18')).toBe('2026-10-12'); // Sunday stays in the same week
    const nights = ci('2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16');
    const ch = weekChallenges(nights, {}, '2026-10-12');
    expect(ch.find((c) => c.id === 'five-nights')!.done).toBe(true);
    const p = computeProgress({ checkIns: nights, today: '2026-10-16' });
    expect(p.xp).toBe(5 * XP.checkIn + XP.challenge);
    expect(p.thisWeek.filter((c) => c.done)).toHaveLength(1);
  });
});

import { seenTerms } from './progress';
describe('seen Learn terms', () => {
  it('collects every term opened across days', () => {
    const s = seenTerms({ '2026-10-14': { learn: true, terms: ['dasha', 'tithi'] }, '2026-10-15': { terms: ['nawal'] }, '2026-10-16': { deep: true } });
    expect([...s].sort()).toEqual(['dasha', 'nawal', 'tithi']);
  });
});

describe('one-time XP', () => {
  it('counts Home Screen and notifications once each, ever', async () => {
    const { computeProgress } = await import('./progress');
    const base = computeProgress({ checkIns: {}, activity: {}, today: '2026-10-16' } as never).xp;
    const p = computeProgress({ checkIns: {}, today: '2026-10-16', activity: { '2026-10-14': { installed: true }, '2026-10-15': { installed: true, notified: true } } } as never);
    expect(p.xp - base).toBe(50);
  });
});
