/**
 * Vedic depth beyond the Dasha timeline: panchanga at birth (tithi, yoga, karana,
 * vara), planetary dignities and combustion, classical yogas, the third Dasha
 * level (pratyantar) and Saturn's Sade Sati from the natal Moon.
 */
import * as A from 'astronomy-engine';
import type { MahaDasha, Period } from './dasha';
import type { PlanetKey, Placement, Sign, VedicChart } from './types';
import { SIGNS } from './types';
import { norm360 } from './util';
import { lahiriAyanamsa } from './vedic';
import { bodyLongitude } from './western';

const ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;
const YEARS: Record<string, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

/** Third-level periods inside an Antardasha. */
export function pratyantar(antar: Period): Period[] {
  const start = new Date(antar.start).getTime(), end = new Date(antar.end).getTime();
  const len = end - start;
  const first = ORDER.indexOf(antar.lord as (typeof ORDER)[number]);
  const out: Period[] = [];
  let t = start;
  for (let i = 0; i < 9; i++) {
    const lord = ORDER[(first + i) % 9];
    const sub = (len * YEARS[lord]) / 120;
    out.push({ lord, start: new Date(t).toISOString().slice(0, 10), end: new Date(t + sub).toISOString().slice(0, 10) });
    t += sub;
  }
  return out;
}

export function currentPratyantar(maha: MahaDasha | null, antar: Period | null, today: string) {
  if (!maha || !antar) return null;
  return pratyantar(antar).find((p) => p.start <= today && today < p.end) ?? null;
}

// ---- Panchanga ----
const TITHI_NAMES = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'];
const YOGA_NAMES = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
const VARA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const VARA_LORD = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export function panchanga(v: VedicChart, localWeekday: number) {
  const sun = v.planets.sun.longitude, moon = v.planets.moon.longitude;
  const elong = norm360(moon - sun);
  const t = Math.floor(elong / 12); // 0..29
  const paksha = t < 15 ? 'Shukla' : 'Krishna';
  const tithiName = t === 14 ? 'Purnima' : t === 29 ? 'Amavasya' : TITHI_NAMES[t % 15];
  const y = Math.floor(norm360(sun + moon) / (360 / 27));
  const k = Math.floor(elong / 6); // 0..59
  const karana = k === 0 ? 'Kimstughna' : k === 57 ? 'Shakuni' : k === 58 ? 'Chatushpada' : k === 59 ? 'Naga' : MOVABLE_KARANAS[(k - 1) % 7];
  return {
    tithi: { number: t + 1, name: tithiName, paksha, label: `${paksha} ${tithiName}` },
    yoga: YOGA_NAMES[y],
    karana,
    vara: { day: VARA[localWeekday], lord: VARA_LORD[localWeekday] },
  };
}

// ---- Dignities ----
export const GRAHAS: [PlanetKey | 'ketu', string][] = [['sun', 'Sun'], ['moon', 'Moon'], ['mars', 'Mars'], ['mercury', 'Mercury'], ['jupiter', 'Jupiter'], ['venus', 'Venus'], ['saturn', 'Saturn'], ['node', 'Rahu'], ['ketu', 'Ketu']];
const RULER: Record<Sign, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};
const EXALT: Record<string, [Sign, number]> = {
  Sun: ['Aries', 10], Moon: ['Taurus', 3], Mars: ['Capricorn', 28], Mercury: ['Virgo', 15], Jupiter: ['Cancer', 5], Venus: ['Pisces', 27], Saturn: ['Libra', 20], Rahu: ['Taurus', 20], Ketu: ['Scorpio', 20],
};
const MOOLATRIKONA: Record<string, [Sign, number, number]> = {
  Sun: ['Leo', 0, 20], Moon: ['Taurus', 4, 30], Mars: ['Aries', 0, 12], Mercury: ['Virgo', 16, 20], Jupiter: ['Sagittarius', 0, 10], Venus: ['Libra', 0, 15], Saturn: ['Aquarius', 0, 20],
};
const FRIENDS: Record<string, { friends: string[]; enemies: string[] }> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'] },
};
const COMBUST: Record<string, [number, number]> = { Moon: [12, 12], Mars: [17, 17], Mercury: [14, 12], Jupiter: [11, 11], Venus: [10, 8], Saturn: [15, 15] };
const opposite = (s: Sign): Sign => SIGNS[(SIGNS.indexOf(s) + 6) % 12];

export type Dignity = 'Exalted' | 'Moolatrikona' | 'Own sign' | "Friend's sign" | 'Neutral sign' | "Enemy's sign" | 'Debilitated';

export function dignity(name: string, p: Placement): Dignity {
  const ex = EXALT[name];
  if (ex && p.sign === ex[0]) return 'Exalted';
  if (ex && p.sign === opposite(ex[0])) return 'Debilitated';
  const mt = MOOLATRIKONA[name];
  if (mt && p.sign === mt[0] && p.degree >= mt[1] && p.degree <= mt[2]) return 'Moolatrikona';
  const lord = RULER[p.sign];
  if (lord === name) return 'Own sign';
  const rel = FRIENDS[name];
  if (!rel) return 'Neutral sign';
  if (rel.friends.includes(lord)) return "Friend's sign";
  if (rel.enemies.includes(lord)) return "Enemy's sign";
  return 'Neutral sign';
}

export function dignities(v: VedicChart) {
  const ketu: Placement = { ...v.planets.node, longitude: norm360(v.planets.node.longitude + 180), sign: opposite(v.planets.node.sign) };
  const sun = v.planets.sun.longitude;
  return GRAHAS.map(([k, name]) => {
    const p = k === 'ketu' ? ketu : v.planets[k];
    const sep = Math.abs(((p.longitude - sun + 540) % 360) - 180);
    const c = COMBUST[name];
    const combust = Boolean(c) && sep <= (p.retrograde ? c[1] : c[0]);
    return { name, sign: p.sign, degree: p.degree, retrograde: p.retrograde && !['Sun', 'Moon', 'Rahu', 'Ketu'].includes(name), dignity: dignity(name, p), combust };
  });
}

// ---- Yogas ----
const signIdx = (s: Sign) => SIGNS.indexOf(s);
const housesFrom = (from: Sign, to: Sign) => ((signIdx(to) - signIdx(from) + 12) % 12) + 1;
const KENDRA = [1, 4, 7, 10];

export interface Yoga { name: string; summary: string }

export function yogas(v: VedicChart): Yoga[] {
  const p = v.planets;
  const out: Yoga[] = [];
  const moon = p.moon.sign;
  if (p.sun.sign === p.mercury.sign) out.push({ name: 'Budha-Aditya Yoga', summary: 'Sun and Mercury together: a sharp, articulate mind and a reputation for intelligence.' });
  if (KENDRA.includes(housesFrom(moon, p.jupiter.sign))) out.push({ name: 'Gajakesari Yoga', summary: 'Jupiter in a kendra from the Moon: wisdom, good name, protection and lasting prosperity.' });
  if (p.moon.sign === p.mars.sign) out.push({ name: 'Chandra-Mangala Yoga', summary: 'Moon and Mars together: drive to earn, strong emotions and energetic enterprise.' });
  const others: Sign[] = (['mars', 'mercury', 'jupiter', 'venus', 'saturn'] as PlanetKey[]).map((k) => p[k].sign);
  const second = others.some((s) => housesFrom(moon, s) === 2), twelfth = others.some((s) => housesFrom(moon, s) === 12), withMoon = others.some((s) => s === moon);
  if (second && twelfth) out.push({ name: 'Durudhara Yoga', summary: 'Planets on both sides of the Moon: resourceful, well-supported and comfortable in life.' });
  else if (second) out.push({ name: 'Sunapha Yoga', summary: 'A planet in the sign after the Moon: self-made wealth and a strong, earned reputation.' });
  else if (twelfth) out.push({ name: 'Anapha Yoga', summary: 'A planet in the sign before the Moon: charm, good health and the enjoyment of life.' });
  else if (!withMoon) out.push({ name: 'Kemadruma Yoga', summary: 'The Moon stands alone: a self-reliant path with ups and downs, softened by any planet aspecting or joining the Moon.' });
  if (v.ascendant) {
    const asc = v.ascendant.sign;
    const maha: [PlanetKey, string, string, string][] = [
      ['mars', 'Mars', 'Ruchaka', 'courage, command and physical strength'], ['mercury', 'Mercury', 'Bhadra', 'intellect, eloquence and skill'],
      ['jupiter', 'Jupiter', 'Hamsa', 'wisdom, grace and spiritual authority'], ['venus', 'Venus', 'Malavya', 'beauty, comfort, art and love'], ['saturn', 'Saturn', 'Sasa', 'discipline, authority and endurance'],
    ];
    for (const [k, name, yoga, gift] of maha) {
      const d = dignity(name, p[k]);
      if ((d === 'Exalted' || d === 'Own sign' || d === 'Moolatrikona') && KENDRA.includes(housesFrom(asc, p[k].sign))) {
        out.push({ name: `${yoga} Yoga (Pancha Mahapurusha)`, summary: `${name} strong in a kendra from the Lagna: a "great person" yoga for ${gift}.` });
      }
    }
  }
  // Parivartana: two planets in each other's signs.
  const own: [string, PlanetKey][] = [['Sun', 'sun'], ['Moon', 'moon'], ['Mars', 'mars'], ['Mercury', 'mercury'], ['Jupiter', 'jupiter'], ['Venus', 'venus'], ['Saturn', 'saturn']];
  for (let i = 0; i < own.length; i++) for (let j = i + 1; j < own.length; j++) {
    const [a, ka] = own[i], [b, kb] = own[j];
    if (RULER[p[ka].sign] === b && RULER[p[kb].sign] === a) out.push({ name: `Parivartana Yoga (${a} and ${b})`, summary: `${a} and ${b} exchange signs: their affairs are bound together and strengthen each other.` });
  }
  return out;
}

// ---- Sade Sati ----
export function saturnTransit(moonSign: Sign, today: Date) {
  const sidereal = (t: A.AstroTime) => norm360(bodyLongitude(A.Body.Saturn, t) - lahiriAyanamsa(t));
  const now = A.MakeTime(today);
  const satSign = SIGNS[Math.floor(sidereal(now) / 30)];
  const h = housesFrom(moonSign, satSign);
  const phase = h === 12 ? 'rising (first phase)' : h === 1 ? 'peak (second phase)' : h === 2 ? 'setting (third phase)' : null;
  const dhaiya = h === 4 || h === 8;
  // When does Saturn leave the current sign (or enter the 12th from the Moon)?
  let t = now;
  let until: string | null = null;
  for (let i = 0; i < 120 && !until; i++) {
    t = t.AddDays(30);
    const s = SIGNS[Math.floor(sidereal(t) / 30)];
    if (s !== satSign) until = t.date.toISOString().slice(0, 10);
  }
  const jupSign = SIGNS[Math.floor(norm360(bodyLongitude(A.Body.Jupiter, now) - lahiriAyanamsa(now)) / 30)];
  return { saturnSign: satSign, houseFromMoon: h, sadeSati: phase, dhaiya, nextSignChange: until, jupiterSign: jupSign, jupiterHouseFromMoon: housesFrom(moonSign, jupSign) };
}
