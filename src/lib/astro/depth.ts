/** Everything behind "Go deeper" on My Chart, computed on demand. */
import * as A from 'astronomy-engine';
import { bazi } from './bazi';
import { currentDasha, vimshottari } from './dasha';
import { aspects, balance, houseOf, lilith, placidus } from './houses';
import { mayanDepth } from './mayan-depth';
import { birthdayNumber, personalCycles, ageOn, karmicDebts, pinnaclesAndChallenges } from './numerology-depth';
import type { Chart, PlanetKey, Placement } from './types';
import { birthInstant } from './time';
import { nakshatra } from './vedic';
import { placement } from './util';
import { chartRuler, moonPhase, nextSolarReturn, partOfFortune, progressions, transits } from './western-depth';

const NAMES: [PlanetKey, string][] = [
  ['sun', 'Sun'], ['moon', 'Moon'], ['mercury', 'Mercury'], ['venus', 'Venus'], ['mars', 'Mars'], ['jupiter', 'Jupiter'],
  ['saturn', 'Saturn'], ['uranus', 'Uranus'], ['neptune', 'Neptune'], ['pluto', 'Pluto'], ['node', 'North Node'],
];

export function chartDepth(chart: Chart, today: string) {
  const { input } = chart;
  const instant = birthInstant(input.date, input.time, input.timeZone);
  const time = A.MakeTime(instant);
  const w = chart.western;

  // Western
  const houses = w.ascendant && w.midheaven ? placidus(time, input.latitude, input.longitude, w.ascendant.longitude, w.midheaven.longitude) : null;
  const lil = placement(lilith(time));
  const planets = NAMES.map(([k, name]) => ({
    key: k, name, ...w.planets[k], house: houses ? houseOf(w.planets[k].longitude, houses.cusps) : null,
  }));
  planets.push({ key: 'node', name: 'Black Moon Lilith', ...lil, house: houses ? houseOf(lil.longitude, houses.cusps) : null });
  const core: Placement[] = (['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'] as PlanetKey[]).map((k) => w.planets[k]);
  if (w.ascendant) core.push(w.ascendant);

  const todayDate = new Date(`${today}T12:00:00Z`);
  const ruler = w.ascendant ? chartRuler(w.ascendant.sign) : null;
  const rulerPlanet = (k: PlanetKey) => ({ name: NAMES.find(([key]) => key === k)![1], ...w.planets[k], house: houses ? houseOf(w.planets[k].longitude, houses.cusps) : null });
  const fortune = partOfFortune(w);

  // Vedic
  const v = chart.vedic;
  const dashas = vimshottari(v.planets.moon.longitude, instant);
  const navamsa = (lon: number) => placement((Math.floor(lon / (30 / 9)) % 12) * 30 + 15).sign;

  return {
    western: {
      houseSystem: houses?.system ?? null,
      cusps: houses?.cusps.map((c) => placement(c)) ?? null,
      planets,
      aspects: aspects(w).slice(0, 14),
      balance: balance(core),
      moonPhase: moonPhase(w.planets.sun.longitude, w.planets.moon.longitude, time),
      fortune: fortune ? { ...fortune.point, dayChart: fortune.dayChart, house: houses ? houseOf(fortune.point.longitude, houses.cusps) : null } : null,
      ruler: ruler ? { traditional: rulerPlanet(ruler.traditional), modern: ruler.modern !== ruler.traditional ? rulerPlanet(ruler.modern) : null } : null,
      progressed: progressions(time, todayDate),
      transits: transits(w, todayDate).slice(0, 8),
      solarReturn: nextSolarReturn(w.planets.sun.longitude, todayDate),
    },
    vedic: {
      sunNakshatra: nakshatra(v.planets.sun.longitude),
      lagnaNakshatra: v.ascendant ? nakshatra(v.ascendant.longitude) : null,
      dashas,
      current: currentDasha(dashas, today),
      navamsa: {
        lagna: v.ascendant ? navamsa(v.ascendant.longitude) : null,
        sun: navamsa(v.planets.sun.longitude),
        moon: navamsa(v.planets.moon.longitude),
        venus: navamsa(v.planets.venus.longitude),
        mars: navamsa(v.planets.mars.longitude),
        jupiter: navamsa(v.planets.jupiter.longitude),
      },
    },
    bazi: bazi(instant, input.date, input.time),
    numerology: { ...personalCycles(input.date, today), birthday: birthdayNumber(input.date), pinnacles: pinnaclesAndChallenges(input.date, chart.numerology.lifePath), age: ageOn(input.date, today), karmicDebts: karmicDebts(input.date) },
    mayan: mayanDepth(input.date, today),
  };
}

export type ChartDepth = ReturnType<typeof chartDepth>;
