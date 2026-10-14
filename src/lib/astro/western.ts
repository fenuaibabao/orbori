import * as A from 'astronomy-engine';
import type { PlanetKey, Placement, WesternChart } from './types';
import { deg, norm360, placement, rad } from './util';

const BODIES: [Exclude<PlanetKey, 'node'>, A.Body][] = [
  ['sun', A.Body.Sun], ['moon', A.Body.Moon], ['mercury', A.Body.Mercury],
  ['venus', A.Body.Venus], ['mars', A.Body.Mars], ['jupiter', A.Body.Jupiter],
  ['saturn', A.Body.Saturn], ['uranus', A.Body.Uranus], ['neptune', A.Body.Neptune],
  ['pluto', A.Body.Pluto],
];

/** Apparent geocentric ecliptic longitude (true equinox & ecliptic of date). */
export function bodyLongitude(body: A.Body, time: A.AstroTime): number {
  if (body === A.Body.Sun) return A.SunPosition(time).elon;
  if (body === A.Body.Moon) return A.EclipticGeoMoon(time).lon;
  return A.Ecliptic(A.GeoVector(body, time, true)).elon;
}

/** Julian centuries (TT) since J2000. */
const centuries = (time: A.AstroTime) => time.tt / 36525;

/** Mean lunar node (Rahu), Meeus ch. 47, mean equinox of date. */
export function meanNode(time: A.AstroTime): number {
  const T = centuries(time);
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T ** 4) / 60616000);
}

function isRetrograde(body: A.Body, time: A.AstroTime): boolean {
  if (body === A.Body.Sun || body === A.Body.Moon) return false;
  const a = bodyLongitude(body, time.AddDays(-0.5));
  const b = bodyLongitude(body, time.AddDays(0.5));
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d < 0;
}

export function trueObliquity(time: A.AstroTime): number {
  return A.e_tilt(time).tobl;
}

/** Ascendant and Midheaven longitudes (tropical) for an instant and place. */
export function angles(time: A.AstroTime, latitude: number, longitude: number) {
  const ramc = rad(norm360(A.SiderealTime(time) * 15 + longitude));
  const eps = rad(trueObliquity(time));
  const phi = rad(latitude);
  const asc = deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))));
  const mc = deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)));
  return { ascendant: norm360(asc), midheaven: norm360(mc) };
}

export function westernChart(instant: Date, latitude: number, longitude: number, timeKnown: boolean): WesternChart {
  const time = A.MakeTime(instant);
  const planets = {} as Record<PlanetKey, Placement>;
  for (const [key, body] of BODIES) {
    planets[key] = placement(bodyLongitude(body, time), isRetrograde(body, time));
  }
  // Mean node, referred to the true equinox of date like the other bodies.
  planets.node = placement(meanNode(time) + A.e_tilt(time).dpsi / 3600, true);
  if (!timeKnown) return { planets, ascendant: null, midheaven: null };
  const { ascendant, midheaven } = angles(time, latitude, longitude);
  return { planets, ascendant: placement(ascendant), midheaven: placement(midheaven) };
}
