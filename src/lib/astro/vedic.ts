import * as A from 'astronomy-engine';
import type { PlanetKey, Placement, VedicChart, WesternChart } from './types';
import { placement } from './util';

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
] as const;
const LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

export const RASHIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
] as const;

/**
 * Lahiri (Chitrapaksha) ayanamsa, true (includes nutation in longitude) so it can be
 * subtracted from apparent tropical longitudes. Mean polynomial fitted to the
 * Swiss Ephemeris SIDM_LAHIRI definition, 1880–2120, residual < 0.001″.
 */
export function lahiriAyanamsa(time: A.AstroTime): number {
  const T = time.tt / 36525;
  const mean = 23.8570923 + 1.39688794 * T + 3.07093833e-4 * T * T;
  return mean + A.e_tilt(time).dpsi / 3600;
}

export function nakshatra(siderealLongitude: number) {
  const span = 360 / 27;
  const index = Math.floor(siderealLongitude / span) % 27;
  const pada = Math.floor((siderealLongitude % span) / (span / 4)) + 1;
  return { name: NAKSHATRAS[index], index, pada, lord: LORDS[index % 9] };
}

export function vedicChart(instant: Date, western: WesternChart): VedicChart {
  const time = A.MakeTime(instant);
  const ayanamsa = lahiriAyanamsa(time);
  const planets = {} as Record<PlanetKey, Placement>;
  for (const key of Object.keys(western.planets) as PlanetKey[]) {
    const p = western.planets[key];
    planets[key] = placement(p.longitude - ayanamsa, p.retrograde);
  }
  const ascendant = western.ascendant ? placement(western.ascendant.longitude - ayanamsa) : null;
  return { ayanamsa, planets, ascendant, moonNakshatra: nakshatra(planets.moon.longitude) };
}
