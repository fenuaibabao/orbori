import type { Chart } from './astro/types';

/** The only chart facts ever shown about another person: Big Three and system labels. */
export interface Coarse {
  sun: string;
  moon: string;
  rising: string | null;
  animal: string;
  lifePath: number;
  tzolkin: string;
  big3: string;
}

export function coarse(c: Chart): Coarse {
  const moon = c.moonSignOptions[0];
  const rising = c.western.ascendant?.sign ?? null;
  return {
    sun: c.western.planets.sun.sign,
    moon,
    rising,
    animal: `${c.chinese.element} ${c.chinese.animal}`,
    lifePath: c.numerology.lifePath,
    tzolkin: c.tzolkin.label,
    big3: [`Sun ${c.western.planets.sun.sign}`, `Moon ${moon}`, rising ? `Rising ${rising}` : null].filter(Boolean).join(' · '),
  };
}
