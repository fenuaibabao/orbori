import data from '@/data/rarity.json';
import { SIGNS, type Chart } from './astro/types';
import { rarityKey } from './rarity-key';

export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Mythic';

export interface Rarity {
  tier: RarityTier;
  /** Estimated share of people with this exact combo (0–1). */
  share: number;
  /** "1 in N" for the exact combo. */
  oneIn: number;
  /** Share of people whose combo is this rare or rarer (0–1). Drives the tier. */
  pct: number;
  /** Birth years the estimate covers, e.g. "1961–2008". */
  population: string;
  combo: { sun: string; moon: string; animal: string; lifePath: number };
}

const combos = data.combos as unknown as Record<string, [number, number]>;

export function chartRarity(chart: Chart): Rarity {
  const sun = chart.western.planets.sun.sign;
  const moon = chart.moonSignOptions[0] ?? chart.western.planets.moon.sign;
  const animal = chart.chinese.animal;
  const lp = chart.numerology.lifePath;
  // A combo that never occurs in the window is rarer than anything listed.
  const [share, pct] = combos[rarityKey(SIGNS.indexOf(sun), SIGNS.indexOf(moon), animal, lp)] ?? [1e-6, 0.0001];
  const t = data.tiers;
  const tier: RarityTier = pct <= t.mythic ? 'Mythic' : pct <= t.rare ? 'Rare' : pct <= t.uncommon ? 'Uncommon' : 'Common';
  return { tier, share, oneIn: Math.round(1 / share), pct, population: data.population, combo: { sun, moon, animal, lifePath: lp } };
}

export { formatOneIn, formatPct, rarityLines } from './rarity-format';
