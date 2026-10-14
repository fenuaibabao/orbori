// Estimates how common each Sun + Moon + Chinese animal + Life Path combination is
// among people born 1961–2008 (today's 18–65 year-olds), one birth day at a time,
// splitting days where the Moon changes sign. Births are assumed evenly spread.
// Output: src/data/rarity.json (committed).
import * as A from 'astronomy-engine';
import { writeFileSync } from 'node:fs';
import { chineseZodiac } from '../src/lib/astro/chinese';
import { lifePath } from '../src/lib/astro/numerology';
import { rarityKey } from '../src/lib/rarity-key';

const FROM = 1961;
const TO = 2008;

const weights = new Map<string, number>();
let days = 0;
const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);

for (let t = Date.UTC(FROM, 0, 1); t <= Date.UTC(TO, 11, 31); t += 86400000) {
  const d = new Date(t);
  const iso = d.toISOString().slice(0, 10);
  const sun = signOf(A.SunPosition(A.MakeTime(new Date(t + 12 * 3600000))).elon);
  const animal = chineseZodiac(iso).animal;
  const lp = lifePath(iso).lifePath;
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

// Rarest first; `pct` = share of people whose combo is this rare or rarer.
const combos = [...weights.entries()].map(([k, w]) => [k, w / days] as [string, number]).sort((a, b) => a[1] - b[1]);
const out: Record<string, [number, number]> = {};
let cum = 0;
for (let i = 0; i < combos.length; ) {
  let j = i;
  let tie = 0;
  while (j < combos.length && combos[j][1] === combos[i][1]) tie += combos[j++][1];
  cum += tie;
  for (let k = i; k < j; k++) out[combos[k][0]] = [+combos[k][1].toPrecision(3), +cum.toPrecision(3)];
  i = j;
}

writeFileSync(
  new URL('../src/data/rarity.json', import.meta.url),
  JSON.stringify({ population: `${FROM}–${TO}`, tiers: { mythic: 0.05, rare: 0.2, uncommon: 0.5 }, combos: out }),
);
console.log({ days, combos: combos.length, rarest: combos[0], commonest: combos[combos.length - 1] });
