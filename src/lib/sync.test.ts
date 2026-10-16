import { describe, expect, it } from 'vitest';
import { merge } from './sync';
import type { LocalState } from './store';

const input = { date: '1994-07-10', time: '12:52', timeZone: 'America/Los_Angeles', latitude: 37.87, longitude: -122.27 };
const prof = (seed: number) => ({ input, cityLabel: 'Berkeley', seed, createdAt: '2026-10-01T00:00:00Z' });
const match = (id: string, addedAt: string) => ({ id, nickname: id, input, cityLabel: '', seed: 1, addedAt });

describe('account merge', () => {
  it('uploads this device when the account is empty', () => {
    const local: LocalState = { profile: prof(1), checkIns: { '2026-10-13': { answer: 'nailed', score: 8 } }, matches: [match('a', '2026-10-02')], activity: {} };
    const remote: LocalState = { profile: null, checkIns: {}, matches: [], activity: {} };
    expect(merge(local, remote)).toEqual(local);
  });
  it('the account chart wins over a fresh device, and streaks/matches combine', () => {
    const local: LocalState = { profile: prof(1), checkIns: { '2026-10-13': { answer: 'nope', score: 3 } }, matches: [match('a', '2026-10-05')], activity: {} };
    const remote: LocalState = { profile: prof(2), checkIns: { '2026-10-12': { answer: 'kinda', score: 5 }, '2026-10-13': { answer: 'nailed', score: 8 } }, matches: [match('b', '2026-10-01'), match('a', '2026-10-05')], activity: {} };
    const m = merge(local, remote);
    expect(m.profile?.seed).toBe(2);
    expect(Object.keys(m.checkIns).sort()).toEqual(['2026-10-12', '2026-10-13']);
    expect(m.checkIns['2026-10-13'].answer).toBe('nailed');
    expect(m.matches.map((x) => x.id)).toEqual(['b', 'a']);
  });
});
