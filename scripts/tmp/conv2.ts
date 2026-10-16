import { computeChart } from '../../src/lib/astro';
import { cosmicCouncil } from '../../src/lib/council';
import { DateTime } from 'luxon';
const me = computeChart({ date: '1994-07-10', time: '12:52', timeZone: 'America/Los_Angeles', latitude: 37.8716, longitude: -122.2727 } as never);
let d = DateTime.fromISO('2026-10-16'); const full: string[] = []; const six: string[] = [];
for (let i = 0; i < 365 * 4; i++, d = d.plus({ days: 1 })) {
  const date = d.toISODate()!; const r = cosmicCouncil(me, date, 'America/Los_Angeles');
  if (r.agreeCount === 7) full.push(`${date} ${r.score.toFixed(1)} ${r.majority} | ${r.headline}`);
  if (r.agreeCount === 6 && six.length < 12) six.push(`${date} ${r.score.toFixed(1)} ${r.majority} holdout:${r.systems.filter(s=>!s.agrees).map(s=>s.label).join(',')} | ${r.headline}`);
}
console.log('me 4y full', full.length); console.log(full.join('\n')); console.log(six.slice(0,6).join('\n'));
// random population
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const counts: number[] = []; const sixes: number[] = [];
for (let p = 0; p < 120; p++) {
  const y = 1960 + Math.floor(rnd() * 46), m = 1 + Math.floor(rnd() * 12), dd = 1 + Math.floor(rnd() * 28);
  const c = computeChart({ date: `${y}-${String(m).padStart(2,'0')}-${String(dd).padStart(2,'0')}`, time: rnd() < 0.8 ? `${String(Math.floor(rnd()*24)).padStart(2,'0')}:30` : null, timeZone: 'America/Chicago', latitude: 41.8, longitude: -87.6 } as never);
  let f = 0, s = 0, x = DateTime.fromISO('2026-10-16');
  for (let i = 0; i < 365; i++, x = x.plus({ days: 1 })) { const r = cosmicCouncil(c, x.toISODate()!, 'America/Chicago'); if (r.agreeCount === 7) f++; else if (r.agreeCount === 6) s++; }
  counts.push(f); sixes.push(s);
}
const hist: Record<number, number> = {}; counts.forEach((n) => hist[n] = (hist[n] ?? 0) + 1);
console.log('7/7 per year across 120 people', JSON.stringify(hist), 'avg', (counts.reduce((a,b)=>a+b,0)/120).toFixed(2), 'zero', counts.filter(n=>!n).length);
console.log('6/7 avg', (sixes.reduce((a,b)=>a+b,0)/120).toFixed(1), 'min', Math.min(...sixes), 'max', Math.max(...sixes));
