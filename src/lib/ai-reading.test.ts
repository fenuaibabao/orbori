import { describe, expect, it } from 'vitest';
import { readingPrompt } from './ai-reading';
import { computeChart } from './astro';
import { cosmicCouncil } from './council';

describe('AI reading prompt', () => {
  it('carries all seven voices and no birth details', () => {
    const input = { date: '1994-07-10', time: '12:52', timeKnown: true, lat: 37.87, lon: -122.27, timeZone: 'America/Los_Angeles' };
    const r = cosmicCouncil(computeChart(input as never), '2026-10-15', 'America/Los_Angeles');
    const p = readingPrompt(r, 'Sun Cancer, Moon Aries');
    expect(r.systems).toHaveLength(7);
    for (const s of r.systems) expect(p).toContain(s.label);
    expect(p).not.toContain('1994');
    expect(p).not.toContain('12:52');
  });
});
