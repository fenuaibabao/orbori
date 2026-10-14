// Builds a compact city index (name, region, country, lat, lon, population, IANA zone)
// from GeoNames data (all-the-cities, CC BY 4.0) + tz-lookup. Output is gitignored.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const OUT = new URL('../.generated/cities.json', import.meta.url);

if (existsSync(OUT) && !process.argv.includes('--force')) process.exit(0);

const cities = require('all-the-cities');
const tzLookup = require('@photostructure/tz-lookup');

const rows = [];
for (const c of cities) {
  const [lon, lat] = c.loc.coordinates;
  let tz;
  try { tz = tzLookup(lat, lon); } catch { continue; }
  const region = /^[A-Z]{2,3}$/.test(c.adminCode) ? c.adminCode : '';
  rows.push([c.name, region, c.country, +lat.toFixed(4), +lon.toFixed(4), c.population, tz, c.altName || '']);
}
rows.sort((a, b) => b[5] - a[5]);
mkdirSync(new URL('../.generated/', import.meta.url), { recursive: true });
writeFileSync(OUT, JSON.stringify(rows));
console.log(`cities: ${rows.length} written`);
