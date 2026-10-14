import data from '@/data/rarity.json';
import { SIGNS, type Chart } from './astro/types';
import { rarityKey } from './rarity-key';

export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Mythic';

export interface Rarity {
  tier: RarityTier;
  /** Estimated share of people with the same combo (0–1). */
  share: number;
  /** "1 in N" phrasing. */
  oneIn: number;
  combo: { sun: string; moon: string; animal: string; lifePath: number };
}

const combos = data.combos as Record<string, number>;

export function chartRarity(chart: Chart): Rarity {
  const sun = chart.western.planets.sun.sign;
  const moon = chart.moonSignOptions[0] ?? chart.western.planets.moon.sign;
  const animal = chart.chinese.animal;
  const lp = chart.numerology.lifePath;
  const share = combos[rarityKey(SIGNS.indexOf(sun), SIGNS.indexOf(moon), animal, lp)] ?? data.cutoffs.mythic / 2;
  const c = data.cutoffs;
  const tier: RarityTier = share <= c.mythic ? 'Mythic' : share <= c.rare ? 'Rare' : share <= c.uncommon ? 'Uncommon' : 'Common';
  return { tier, share, oneIn: Math.round(1 / share), combo: { sun, moon, animal, lifePath: lp } };
}

export { formatOneIn, formatShare } from './rarity-format';
