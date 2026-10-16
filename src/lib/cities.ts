import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface City {
  id: number;
  name: string;
  /** e.g. "Oakland, CA, United States" */
  label: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  population: number;
}

type Row = [string, string, string, number, number, number, string, string];

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

let index: { rows: Row[]; keys: string[]; alt: string[] } | null = null;

function load() {
  if (index) return index;
  const rows: Row[] = JSON.parse(readFileSync(path.join(process.cwd(), '.generated', 'cities.json'), 'utf8'));
  index = { rows, keys: rows.map((r) => fold(r[0])), alt: rows.map((r) => fold(r[7])) };
  return index;
}

function toCity(r: Row, id: number): City {
  const country = r[2] === 'US' ? 'United States' : countryNames.of(r[2]) ?? r[2];
  const label = [r[0], r[1] && ['US', 'CA', 'AU'].includes(r[2]) ? r[1] : '', country].filter(Boolean).join(', ');
  return { id, name: r[0], label, latitude: r[3], longitude: r[4], timeZone: r[6], population: r[5] };
}

/** Prefix search on city name (accent-insensitive); "city, region/country" narrows. Largest first. */
export function searchCities(query: string, limit = 8): City[] {
  const [namePart, ...rest] = query.split(',');
  const q = fold(namePart);
  const qualifier = fold(rest.join(' '));
  if (q.length < 2) return [];
  const { rows, keys, alt } = load();
  // Rows are sorted by population, so the first hits are the biggest cities.
  const region: City[] = []; // qualifier is a state/province code ("ca" → California)
  const country: City[] = []; // qualifier is a country code ("ng")
  const loose: City[] = []; // qualifier appears in the label ("california", "nigeria")
  for (let i = 0; i < rows.length && region.length < limit; i++) {
    if (!keys[i].startsWith(q) && !(alt[i] && alt[i].split(',').some((a) => a.startsWith(q)))) continue;
    const city = toCity(rows[i], i);
    if (!qualifier) { region.push(city); continue; }
    if (fold(rows[i][1]) === qualifier) region.push(city);
    else if (fold(rows[i][2]) === qualifier) { if (country.length < limit) country.push(city); }
    else if (loose.length < limit && fold(city.label).includes(qualifier)) loose.push(city);
  }
  return [...region, ...country, ...loose].slice(0, limit);
}

/** The world's biggest cities (for astrocartography "power places"). */
export function majorCities(limit = 2500): City[] {
  const { rows } = load();
  return rows.slice(0, limit).map((r, i) => toCity(r, i));
}
