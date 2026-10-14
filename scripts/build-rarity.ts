// Estimates how common each Sun + Moon + Chinese animal + Life Path combination is,
// assuming births spread evenly over 1940–2012, and sets rarity tier cutoffs.
// Output: src/data/rarity.json (committed).
import * as A from 'astronomy-engine';
import { writeFileSync } from 'node:fs';
import { chineseZodiac } from '../src/lib/astro/chinese';
import { lifePath } from '../src/lib/astro/numerology';
import { rarityKey } from '../src/lib/rarity-key';

const weights = new Map<string, number>();
let days = 0;
const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);

for (let t = Date.UTC(1940, 0, 1); t <= Date.UTC(2012, 11, 31); t += 86400000) {
  const d = new Date(t);
  const iso = d.toISOString().slice(0, 10);
  const sun = signOf(A.SunPosition(A.MakeTime(new Date(t + 12 * 3600000))).elon);
  const animal = chineseZodiac(iso).animal;
  const lp = lifePath(iso).lifePath;
  // Moon sign share of the day (Moon moves ~13°/day, so at most one sign change).
  const m0 = A.EclipticGeoMoon(A.MakeTime(d)).lon;
  const m1 = A.EclipticGeoMoon(A.MakeTime(new Date(t + 86400000))).lon;
  const s0 = signOf(m0);
  const s1 = signOf(m1);
  const parts: [number, number][] = [];
  if (s0 === s1) parts.push([s0, 1]);
  else {
    const travel = (((m1 - m0) % 360) + 360) % 360;
    const toBoundary = (((s1 * 30 - m0) % 360) + 360) % 360;
    const f = Math.min(1, toBoundary / travel);
    parts.push([s0, f], [s1, 1 - f]);
  }
  for (const [moon, w] of parts) {
    const k = rarityKey(sun, moon, animal, lp);
    weights.set(k, (weights.get(k) ?? 0) + w);
  }
  days++;
}

const combos = [...weights.entries()].map(([k, w]) => [k, w / days] as [string, number]);
combos.sort((a, b) => a[1] - b[1]);

// Tiers by share of PEOPLE: rarest 5% Mythic, next 15% Rare, next 30% Uncommon, rest Common.
const cut = { mythic: 0, rare: 0, uncommon: 0 };
let cum = 0;
for (const [, p] of combos) {
  cum += p;
  if (cum <= 0.05) cut.mythic = p;
  if (cum <= 0.2) cut.rare = p;
  if (cum <= 0.5) cut.uncommon = p;
}

const out = {
  note: 'Estimated share of people born 1940–2012 with each Sun/Moon/animal/Life Path combo.',
  cutoffs: cut,
  combos: Object.fromEntries(combos.map(([k, p]) => [k, +p.toPrecision(3)])),
};
writeFileSync(new URL('../src/data/rarity.json', import.meta.url), JSON.stringify(out));
console.log({ days, combos: combos.length, cut, rarest: combos[0], commonest: combos[combos.length - 1] });
