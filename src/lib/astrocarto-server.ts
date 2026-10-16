import 'server-only';
import { astrocartography, cartoBasis, kmToLine, type Angle, type CartoPlanet } from './astro/astrocarto';
import { birthInstant } from './astro/time';
import type { BirthInput } from './astro/types';
import { BENEFIC } from './astrocarto-content';
import { majorCities } from './cities';

export interface PowerPlace { city: string; label: string; lat: number; lon: number; planet: CartoPlanet; angle: Angle; km: number }

const RADIUS_KM = 450;

/** Lines plus the big cities closest to each one. */
export function cartoFor(input: BirthInput) {
  const instant = birthInstant(input.date, input.time ?? '12:00', input.timeZone);
  const lines = astrocartography(instant);
  const { gst, planets } = cartoBasis(instant);
  const cities = majorCities(2500);
  const places: PowerPlace[] = [];
  for (const p of planets) {
    for (const angle of ['ASC', 'DSC', 'MC', 'IC'] as Angle[]) {
      const near: PowerPlace[] = [];
      for (const c of cities) {
        if (Math.abs(c.latitude) > 72) continue;
        const km = kmToLine(p.ra, p.dec, gst, angle, c.latitude, c.longitude);
        if (km !== null && km <= RADIUS_KM) near.push({ city: c.name, label: c.label, lat: c.latitude, lon: c.longitude, planet: p.planet, angle, km: Math.round(km) });
        if (near.length >= 6) break; // cities are largest first
      }
      places.push(...near);
    }
  }
  return { lines, places, timeKnown: input.time !== null };
}

/** The best getaway: a big city close to a Venus, Jupiter or Sun line. */
export function bestGetaway(input: BirthInput, seed = 0) {
  const { places } = cartoFor(input);
  const good = places.filter((p) => BENEFIC.includes(p.planet)).sort((a, b) => a.km - b.km);
  if (!good.length) return null;
  return good[Math.abs(seed) % Math.min(good.length, 5)];
}

/** For "Your love story": a big city near the Venus line, setting (relationships) first. */
export function venusPlace(input: BirthInput, seed = 0) {
  const { places } = cartoFor(input);
  const order = { DSC: 0, ASC: 1, MC: 2, IC: 3 } as const;
  const venus = places.filter((p) => p.planet === 'Venus').sort((a, b) => order[a.angle] - order[b.angle] || a.km - b.km);
  if (!venus.length) return null;
  return venus[Math.abs(seed) % Math.min(venus.length, 3)];
}
