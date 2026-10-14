// Generates random births, runs the Orbori engine, and prints JSON for the
// Swiss Ephemeris cross-check (scripts/verify_swe.py).
import { computeChart } from '../src/lib/astro';

const PLACES = [
  { tz: 'America/Los_Angeles', lat: 37.8044, lon: -122.2712 },
  { tz: 'America/New_York', lat: 40.7128, lon: -74.006 },
  { tz: 'Europe/London', lat: 51.5072, lon: -0.1276 },
  { tz: 'Asia/Kolkata', lat: 19.076, lon: 72.8777 },
  { tz: 'Asia/Tokyo', lat: 35.6762, lon: 139.6503 },
  { tz: 'Africa/Lagos', lat: 6.5244, lon: 3.3792 },
  { tz: 'Australia/Sydney', lat: -33.8688, lon: 151.2093 },
  { tz: 'America/Sao_Paulo', lat: -23.5558, lon: -46.6396 },
  { tz: 'Pacific/Honolulu', lat: 21.3069, lon: -157.8583 },
  { tz: 'Atlantic/Reykjavik', lat: 64.1466, lon: -21.9426 },
  { tz: 'Pacific/Tahiti', lat: -17.5516, lon: -149.5585 },
];

let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pad = (n: number) => String(n).padStart(2, '0');

const cases = [];
for (let i = 0; i < 400; i++) {
  const p = PLACES[i % PLACES.length];
  const year = 1920 + Math.floor(rnd() * 100);
  const month = 1 + Math.floor(rnd() * 12);
  const day = 1 + Math.floor(rnd() * 28);
  const time = `${pad(Math.floor(rnd() * 24))}:${pad(Math.floor(rnd() * 60))}`;
  const date = `${year}-${pad(month)}-${pad(day)}`;
  const c = computeChart({ date, time, timeZone: p.tz, latitude: p.lat, longitude: p.lon });
  cases.push({
    date, time, tz: p.tz, lat: p.lat, lon: p.lon, utc: c.utc,
    tropical: Object.fromEntries(Object.entries(c.western.planets).map(([k, v]) => [k, v.longitude])),
    retro: Object.fromEntries(Object.entries(c.western.planets).map(([k, v]) => [k, v.retrograde])),
    asc: c.western.ascendant!.longitude,
    mc: c.western.midheaven!.longitude,
    sidereal: Object.fromEntries(Object.entries(c.vedic.planets).map(([k, v]) => [k, v.longitude])),
    sidAsc: c.vedic.ascendant!.longitude,
    ayanamsa: c.vedic.ayanamsa,
  });
}
console.log(JSON.stringify(cases));
