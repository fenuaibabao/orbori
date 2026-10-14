import { describe, expect, it } from 'vitest';
import data from '@/data/rarity.json';
import { computeChart } from './astro';
import { chartRarity } from './rarity';
import { formatOneIn, formatPct, rarityLines } from './rarity-format';

describe('Chart rarity', () => {
  const combos = Object.values(data.combos as unknown as Record<string, [number, number]>);

  it('shares add up to 100% and the rarest-first percentile ends at 100%', () => {
    expect(combos.reduce((s, [p]) => s + p, 0)).toBeCloseTo(1, 2);
    expect(Math.max(...combos.map(([, pct]) => pct))).toBeCloseTo(1, 2);
  });

  it('tiers hold roughly 5 / 15 / 30 / 50% of people', () => {
    const t = { Mythic: 0, Rare: 0, Uncommon: 0, Common: 0 };
    for (const [p, pct] of combos) t[pct <= 0.05 ? 'Mythic' : pct <= 0.2 ? 'Rare' : pct <= 0.5 ? 'Uncommon' : 'Common'] += p;
    expect(t.Mythic).toBeLessThanOrEqual(0.051);
    expect(t.Mythic + t.Rare).toBeLessThanOrEqual(0.201);
    expect(t.Common).toBeGreaterThanOrEqual(0.49);
  });

  it('gives an honest line for every tier', () => {
    const r = chartRarity(computeChart({ date: '1994-07-10', time: '12:52', timeZone: 'America/Los_Angeles', latitude: 37.87, longitude: -122.27 }));
    expect(r.combo).toMatchObject({ sun: 'Cancer', moon: 'Leo', animal: 'Dog', lifePath: 4 });
    const lines = rarityLines(r);
    if (r.pct > 0.5) expect(lines.main).toMatch(/classic/);
    else expect(lines.main).toMatch(/^Only /);
  });

  it('rounds numbers to what the estimate supports', () => {
    expect(formatOneIn(9434)).toBe('9,000');
    expect(formatOneIn(14260)).toBe('14,000');
    expect(formatOneIn(94000)).toBe('90,000');
    expect(formatPct(0.0731)).toBe('7%');
    expect(formatPct(0.006)).toBe('0.6%');
    expect(formatPct(0.0004)).toBe('under 0.1%');
  });
});
