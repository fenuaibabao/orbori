/**
 * Placidus house cusps (falls back to Whole Sign above ~66° latitude, where
 * Placidus is undefined), planet house positions, major aspects and the
 * element/modality balance. Black Moon Lilith = mean lunar apogee.
 */
import * as A from 'astronomy-engine';
import type { PlanetKey, Placement, Sign, WesternChart } from './types';
import { SIGNS } from './types';
import { deg, norm360, placement, rad } from './util';
import { trueObliquity } from './western';

export interface Houses {
  system: 'Placidus' | 'Whole Sign';
  /** 12 cusp longitudes, cusps[0] = 1st house (Ascendant). */
  cusps: number[];
}

export function placidus(time: A.AstroTime, latitude: number, longitude: number, ascendant: number, midheaven: number): Houses {
  const ramc = norm360(A.SiderealTime(time) * 15 + longitude);
  const eps = rad(trueObliquity(time));
  const phi = rad(latitude);

  if (Math.abs(latitude) >= 66) {
    const first = Math.floor(ascendant / 30) * 30;
    return { system: 'Whole Sign', cusps: Array.from({ length: 12 }, (_, i) => norm360(first + i * 30)) };
  }

  const lonFromRa = (ra: number) => norm360(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(ra)) * Math.cos(eps))));
  const decOf = (lon: number) => Math.asin(Math.sin(eps) * Math.sin(rad(lon)));
  const dsa = (dec: number) => deg(Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(dec)))));

  // Above the horizon (11th, 12th): RA = RAMC + f·DSA; below (2nd, 3rd): RA = RAMC + 180 − f·NSA.
  const cusp = (f: number, above: boolean) => {
    let lon = lonFromRa(ramc + (above ? 90 * f * 2 : 180 - 90 * f * 2));
    for (let i = 0; i < 50; i++) {
      const d = dsa(decOf(lon));
      const ra = above ? ramc + f * d : ramc + 180 - f * (180 - d);
      const next = lonFromRa(ra);
      if (Math.abs(((next - lon + 540) % 360) - 180) < 1e-7) { lon = next; break; }
      lon = next;
    }
    return lon;
  };

  const c11 = cusp(1 / 3, true);
  const c12 = cusp(2 / 3, true);
  const c2 = cusp(2 / 3, false);
  const c3 = cusp(1 / 3, false);
  const cusps = [ascendant, c2, c3, norm360(midheaven + 180), norm360(c11 + 180), norm360(c12 + 180),
    norm360(ascendant + 180), norm360(c2 + 180), norm360(c3 + 180), midheaven, c11, c12];
  return { system: 'Placidus', cusps };
}

export function houseOf(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i];
    const b = cusps[(i + 1) % 12];
    const span = norm360(b - a);
    if (norm360(lon - a) < span) return i + 1;
  }
  return 1;
}

/** Mean lunar apogee (Black Moon Lilith), Meeus-style polynomial, true equinox of date. */
export function lilith(time: A.AstroTime): number {
  const T = time.tt / 36525;
  // Meeus gives the mean perigee; the apogee is opposite it.
  const perigee = 83.3532465 + 4069.0137287 * T - 0.01032 * T * T - (T * T * T) / 80053 + (T ** 4) / 18999000;
  return norm360(perigee + 180 + A.e_tilt(time).dpsi / 3600);
}

export interface Aspect { a: string; b: string; type: string; angle: number; orb: number; nature: 'easy' | 'hard' | 'blend' }

const ASPECTS: [string, number, number, Aspect['nature']][] = [
  ['conjunction', 0, 8, 'blend'], ['sextile', 60, 5, 'easy'], ['square', 90, 7, 'hard'], ['trine', 120, 7, 'easy'], ['opposition', 180, 8, 'hard'],
];
const NAMES: Partial<Record<PlanetKey, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
};

export function aspects(w: WesternChart): Aspect[] {
  const pts: [string, number][] = (Object.keys(NAMES) as PlanetKey[]).map((k) => [NAMES[k]!, w.planets[k].longitude]);
  if (w.ascendant) pts.push(['Ascendant', w.ascendant.longitude]);
  if (w.midheaven) pts.push(['Midheaven', w.midheaven.longitude]);
  const out: Aspect[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      // Slow outer planets aspect each other for years; skip those generational pairs.
      const outer = ['Uranus', 'Neptune', 'Pluto'];
      if (outer.includes(pts[i][0]) && outer.includes(pts[j][0])) continue;
      // The Ascendant and Midheaven are always roughly square; that pair says nothing personal.
      if (pts[i][0] === 'Ascendant' && pts[j][0] === 'Midheaven') continue;
      const sep = Math.abs(((pts[i][1] - pts[j][1] + 540) % 360) - 180);
      for (const [type, angle, orbMax, nature] of ASPECTS) {
        const lights = [pts[i][0], pts[j][0]].some((n) => n === 'Sun' || n === 'Moon');
        const orb = Math.abs(sep - angle);
        if (orb <= orbMax + (lights ? 1 : 0)) out.push({ a: pts[i][0], b: pts[j][0], type, angle, orb: Math.round(orb * 10) / 10, nature });
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

export const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water'] as const;
export const MODES = ['Cardinal', 'Fixed', 'Mutable'] as const;

export function balance(points: Placement[]) {
  const el: Record<(typeof ELEMENTS)[number], number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const mo: Record<(typeof MODES)[number], number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of points) {
    const i = SIGNS.indexOf(p.sign as Sign);
    el[ELEMENTS[i % 4]]++;
    mo[MODES[i % 3]]++;
  }
  return { elements: el, modes: mo };
}

export { placement };
