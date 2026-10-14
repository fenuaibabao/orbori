/**
 * Ashtakoota Guna Milan (36 points) from both Moons' nakshatra and sidereal sign.
 * Gender-neutral simplification: asymmetric kootas (Varna, Vashya, Tara) are
 * scored symmetrically, and Yoni uses same/enemy/neutral only.
 */
import type { Chart } from '../astro/types';

export interface GunaMilan {
  varna: number; vashya: number; tara: number; yoni: number;
  maitri: number; gana: number; bhakoot: number; nadi: number;
  total: number;
}

// Moon sign (sidereal) index 0 = Aries.
const VARNA = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0]; // Kshatriya, Vaishya, Shudra, Brahmin… pattern
const VASHYA_GROUP = ['quad', 'quad', 'human', 'water', 'wild', 'human', 'human', 'insect', 'human', 'quad', 'human', 'water'];

const YONI = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog', 'Cat', 'Sheep', 'Cat', 'Rat', 'Rat', 'Cow', 'Buffalo', 'Tiger',
  'Buffalo', 'Tiger', 'Deer', 'Deer', 'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse', 'Lion', 'Cow', 'Elephant',
];
const YONI_ENEMY = ['Horse-Buffalo', 'Elephant-Lion', 'Sheep-Monkey', 'Serpent-Mongoose', 'Dog-Deer', 'Cat-Rat', 'Cow-Tiger'];

// Planet lords of the 12 signs.
const LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const FRIENDS: Record<string, { f: string[]; e: string[] }> = {
  Sun: { f: ['Moon', 'Mars', 'Jupiter'], e: ['Venus', 'Saturn'] },
  Moon: { f: ['Sun', 'Mercury'], e: [] },
  Mars: { f: ['Sun', 'Moon', 'Jupiter'], e: ['Mercury'] },
  Mercury: { f: ['Sun', 'Venus'], e: ['Moon'] },
  Jupiter: { f: ['Sun', 'Moon', 'Mars'], e: ['Mercury', 'Venus'] },
  Venus: { f: ['Mercury', 'Saturn'], e: ['Sun', 'Moon'] },
  Saturn: { f: ['Mercury', 'Venus'], e: ['Sun', 'Moon', 'Mars'] },
};
const view = (a: string, b: string) => (FRIENDS[a].f.includes(b) ? 'f' : FRIENDS[a].e.includes(b) ? 'e' : 'n');

// Gana per nakshatra: d = Deva, m = Manushya, r = Rakshasa
const GANA = 'dmrmdmddrrmmdrdrdrrmmdrrmmd'.split('');
// Nadi per nakshatra: 0 Adi, 1 Madhya, 2 Antya
const NADI = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];

function taraOk(from: number, to: number) {
  const r = ((to - from + 27) % 27 + 1) % 9;
  return ![3, 5, 7].includes(r);
}

export function gunaMilan(a: Chart, b: Chart): GunaMilan {
  const na = a.vedic.moonNakshatra.index, nb = b.vedic.moonNakshatra.index;
  const ra = Math.floor(a.vedic.planets.moon.longitude / 30), rb = Math.floor(b.vedic.planets.moon.longitude / 30);

  const varna = VARNA[ra] === VARNA[rb] ? 1 : 0.5;
  const vashya = VASHYA_GROUP[ra] === VASHYA_GROUP[rb] ? 2 : 1;
  const tara = (taraOk(na, nb) ? 1.5 : 0) + (taraOk(nb, na) ? 1.5 : 0);

  const ya = YONI[na], yb = YONI[nb];
  const yoni = ya === yb ? 4 : YONI_ENEMY.includes(`${ya}-${yb}`) || YONI_ENEMY.includes(`${yb}-${ya}`) ? 0 : 2;

  const la = LORD[ra], lb = LORD[rb];
  let maitri: number;
  if (la === lb) maitri = 5;
  else {
    const v = [view(la, lb), view(lb, la)].sort().join('');
    maitri = { ff: 5, fn: 4, nn: 3, ef: 1, en: 0.5, ee: 0 }[v] ?? 3;
  }

  const ga = GANA[na], gb = GANA[nb];
  const pair = [ga, gb].sort().join('');
  const gana = ga === gb ? 6 : pair === 'dm' ? 5 : pair === 'dr' ? 1 : 0;

  const dist = (rb - ra + 12) % 12 + 1; // 1..12 counted inclusively
  const bhakoot = [2, 12, 5, 9, 6, 8].includes(dist) ? 0 : 7;

  const nadi = NADI[na] === NADI[nb] ? 0 : 8;

  const total = varna + vashya + tara + yoni + maitri + gana + bhakoot + nadi;
  return { varna, vashya, tara, yoni, maitri, gana, bhakoot, nadi, total };
}
