/**
 * Western depth beyond houses and aspects: the Moon phase at birth, the Part of
 * Fortune, the chart ruler, secondary progressions (a day for a year), today's
 * transits to the natal chart, and the next solar return.
 */
import * as A from 'astronomy-engine';
import type { PlanetKey, Placement, Sign, WesternChart } from './types';
import { norm360, placement } from './util';
import { bodyLongitude } from './western';

export const PHASES = [
  { name: 'New Moon', from: 0 }, { name: 'Crescent Moon', from: 45 }, { name: 'First Quarter', from: 90 }, { name: 'Gibbous Moon', from: 135 },
  { name: 'Full Moon', from: 180 }, { name: 'Disseminating Moon', from: 225 }, { name: 'Last Quarter', from: 270 }, { name: 'Balsamic Moon', from: 315 },
] as const;

/** Lunar phase from the Sun–Moon elongation (the eight-phase system used in astrology). */
export function moonPhase(sunLon: number, moonLon: number, time: A.AstroTime) {
  const elongation = norm360(moonLon - sunLon);
  const phase = PHASES[Math.floor(elongation / 45)];
  const illumination = Math.round(A.Illumination(A.Body.Moon, time).phase_fraction * 100);
  return { name: phase.name, elongation: Math.round(elongation * 10) / 10, illumination };
}

/** Part of Fortune: Asc + Moon − Sun by day, Asc + Sun − Moon by night (Sun below the horizon). */
export function partOfFortune(w: WesternChart): { point: Placement; dayChart: boolean } | null {
  if (!w.ascendant) return null;
  const asc = w.ascendant.longitude, sun = w.planets.sun.longitude, moon = w.planets.moon.longitude;
  // The Sun is above the horizon when it sits in the western half from the Ascendant going clockwise (houses 7–12).
  const fromAsc = norm360(sun - asc);
  const dayChart = fromAsc >= 180;
  return { point: placement(norm360(dayChart ? asc + moon - sun : asc + sun - moon)), dayChart };
}

const RULERS: Record<Sign, { traditional: PlanetKey; modern: PlanetKey }> = {
  Aries: { traditional: 'mars', modern: 'mars' }, Taurus: { traditional: 'venus', modern: 'venus' }, Gemini: { traditional: 'mercury', modern: 'mercury' },
  Cancer: { traditional: 'moon', modern: 'moon' }, Leo: { traditional: 'sun', modern: 'sun' }, Virgo: { traditional: 'mercury', modern: 'mercury' },
  Libra: { traditional: 'venus', modern: 'venus' }, Scorpio: { traditional: 'mars', modern: 'pluto' }, Sagittarius: { traditional: 'jupiter', modern: 'jupiter' },
  Capricorn: { traditional: 'saturn', modern: 'saturn' }, Aquarius: { traditional: 'saturn', modern: 'uranus' }, Pisces: { traditional: 'jupiter', modern: 'neptune' },
};
export const chartRuler = (sign: Sign) => RULERS[sign];

const PROGRESSED: [string, A.Body][] = [['Sun', A.Body.Sun], ['Moon', A.Body.Moon], ['Mercury', A.Body.Mercury], ['Venus', A.Body.Venus], ['Mars', A.Body.Mars]];

/**
 * Secondary progressions: the sky `age` days after birth stands for the sky `age`
 * years after birth. Also finds when the progressed Moon next changes sign.
 */
export function progressions(birth: A.AstroTime, today: Date) {
  const ageYears = (today.getTime() - birth.date.getTime()) / (365.25 * 86400000);
  const t = birth.AddDays(ageYears);
  const planets = PROGRESSED.map(([name, body]) => ({ name, ...placement(bodyLongitude(body, t)) }));
  const moon = planets[1];
  // Progressed Moon moves ~1° a month; step a progressed day (= a year) in 1/24 steps (≈ half a month).
  let next: { sign: Sign; when: string } | null = null;
  for (let step = 1; step <= 72; step++) {
    const p = placement(bodyLongitude(A.Body.Moon, t.AddDays(step / 24)));
    if (p.sign !== moon.sign) {
      const when = new Date(today.getTime() + (step / 24) * 365.25 * 86400000);
      next = { sign: p.sign, when: when.toISOString().slice(0, 10) };
      break;
    }
  }
  return { ageYears: Math.round(ageYears * 10) / 10, planets, moonNext: next };
}

export interface Transit { transiting: string; natal: string; type: string; orb: number; nature: 'easy' | 'hard' | 'blend'; applying: boolean }

const TRANSITING: [string, A.Body, number][] = [
  ['Pluto', A.Body.Pluto, 1.5], ['Neptune', A.Body.Neptune, 1.5], ['Uranus', A.Body.Uranus, 1.5], ['Saturn', A.Body.Saturn, 2], ['Jupiter', A.Body.Jupiter, 2],
  ['Mars', A.Body.Mars, 1.5], ['Sun', A.Body.Sun, 1],
];
const ASPECTS: [string, number, 'easy' | 'hard' | 'blend'][] = [['conjunction', 0, 'blend'], ['sextile', 60, 'easy'], ['square', 90, 'hard'], ['trine', 120, 'easy'], ['opposition', 180, 'hard']];
const NATAL: [PlanetKey, string][] = [['sun', 'Sun'], ['moon', 'Moon'], ['mercury', 'Mercury'], ['venus', 'Venus'], ['mars', 'Mars'], ['jupiter', 'Jupiter'], ['saturn', 'Saturn']];

/** Today's transits to the natal planets and angles, tightest first. */
export function transits(w: WesternChart, today: Date): Transit[] {
  const now = A.MakeTime(today);
  const later = now.AddDays(1);
  const natal: [string, number][] = NATAL.map(([k, n]) => [n, w.planets[k].longitude]);
  if (w.ascendant) natal.push(['Ascendant', w.ascendant.longitude]);
  if (w.midheaven) natal.push(['Midheaven', w.midheaven.longitude]);
  const out: Transit[] = [];
  for (const [name, body, orbMax] of TRANSITING) {
    const lon = bodyLongitude(body, now), lon2 = bodyLongitude(body, later);
    for (const [n, nlon] of natal) {
      if (name === n && (name === 'Sun')) continue; // the Sun's own return is shown separately
      const sep = Math.abs(((lon - nlon + 540) % 360) - 180);
      const sep2 = Math.abs(((lon2 - nlon + 540) % 360) - 180);
      for (const [type, angle, nature] of ASPECTS) {
        const orb = Math.abs(sep - angle);
        if (orb <= orbMax) out.push({ transiting: name, natal: n, type, orb: Math.round(orb * 10) / 10, nature, applying: Math.abs(sep2 - angle) < orb });
      }
    }
  }
  return out.sort((a, b) => a.orb - b.orb);
}

/** Next moment the Sun returns to its natal longitude, on or after `today`. */
export function nextSolarReturn(natalSun: number, today: Date): string {
  let t = A.MakeTime(today);
  // Jump to the day the Sun is within a degree, then refine by bisection.
  for (let i = 0; i < 400; i++) {
    const d = norm360(natalSun - bodyLongitude(A.Body.Sun, t));
    if (d < 1) break;
    t = t.AddDays(Math.max(1, Math.floor(d) - 1));
  }
  let lo = t, hi = t.AddDays(2);
  for (let i = 0; i < 30; i++) {
    const mid = lo.AddDays((hi.ut - lo.ut) / 2);
    const d = ((bodyLongitude(A.Body.Sun, mid) - natalSun + 540) % 360) - 180;
    if (d < 0) lo = mid; else hi = mid;
  }
  return lo.date.toISOString();
}
