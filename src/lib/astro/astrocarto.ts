/**
 * Astrocartography: where on Earth each planet was rising (ASC), setting (DSC),
 * culminating (MC) or at the lowest point (IC) at the moment of birth.
 * MC/IC lines run north–south; ASC/DSC lines curve with latitude.
 */
import * as A from 'astronomy-engine';
import { deg, rad } from './util';

export type Angle = 'ASC' | 'DSC' | 'MC' | 'IC';
export const CARTO_PLANETS = [
  ['Sun', A.Body.Sun], ['Moon', A.Body.Moon], ['Mercury', A.Body.Mercury], ['Venus', A.Body.Venus], ['Mars', A.Body.Mars],
  ['Jupiter', A.Body.Jupiter], ['Saturn', A.Body.Saturn], ['Uranus', A.Body.Uranus], ['Neptune', A.Body.Neptune], ['Pluto', A.Body.Pluto],
] as const;
export type CartoPlanet = (typeof CARTO_PLANETS)[number][0];

export interface CartoLine { planet: CartoPlanet; angle: Angle; segments: [number, number][][] }

const wrap = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

/** Planet positions (right ascension, declination of date) and Greenwich sidereal time at an instant. */
export function cartoBasis(instant: Date) {
  const time = A.MakeTime(instant);
  const gst = A.SiderealTime(time) * 15;
  const observer = new A.Observer(0, 0, 0);
  const planets = CARTO_PLANETS.map(([name, body]) => {
    const eq = A.Equator(body, time, observer, true, true);
    return { planet: name as CartoPlanet, ra: eq.ra * 15, dec: eq.dec };
  });
  return { gst, planets };
}

/** Longitude of a planet's line at a latitude (null where it never rises or sets there). */
export function lineLongitude(ra: number, dec: number, gst: number, angle: Angle, lat: number): number | null {
  if (angle === 'MC') return wrap(ra - gst);
  if (angle === 'IC') return wrap(ra - gst + 180);
  const cosH = -Math.tan(rad(lat)) * Math.tan(rad(dec));
  if (Math.abs(cosH) > 1) return null;
  const H = deg(Math.acos(cosH));
  return wrap(angle === 'ASC' ? ra - H - gst : ra + H - gst);
}

/** All 40 lines as map-ready segments (split where they cross the date line). */
export function astrocartography(instant: Date): CartoLine[] {
  const { gst, planets } = cartoBasis(instant);
  const out: CartoLine[] = [];
  for (const p of planets) {
    for (const angle of ['ASC', 'DSC', 'MC', 'IC'] as Angle[]) {
      const segments: [number, number][][] = [];
      let cur: [number, number][] = [];
      for (let lat = -75; lat <= 75; lat += 1.5) {
        const lon = lineLongitude(p.ra, p.dec, gst, angle, lat);
        if (lon === null) { if (cur.length > 1) segments.push(cur); cur = []; continue; }
        const prev = cur[cur.length - 1];
        if (prev && Math.abs(prev[0] - lon) > 180) { if (cur.length > 1) segments.push(cur); cur = []; }
        cur.push([Math.round(lon * 100) / 100, lat]);
      }
      if (cur.length > 1) segments.push(cur);
      out.push({ planet: p.planet, angle, segments });
    }
  }
  return out;
}

/** Distance in km from a place to a planet's line, measured east–west along the place's latitude. */
export function kmToLine(ra: number, dec: number, gst: number, angle: Angle, lat: number, lon: number): number | null {
  const l = lineLongitude(ra, dec, gst, angle, lat);
  if (l === null) return null;
  const d = Math.abs(wrap(lon - l));
  return d * 111.32 * Math.cos(rad(lat));
}
