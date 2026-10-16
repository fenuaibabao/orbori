import { computeChart } from '../../src/lib/astro';
import { cosmicCouncil } from '../../src/lib/council';
import { DateTime } from 'luxon';
const people = {
  you: { date: '1994-07-10', time: '12:52', timeZone: 'America/Los_Angeles', latitude: 37.8716, longitude: -122.2727 },
  a: { date: '1990-03-02', time: '08:15', timeZone: 'America/New_York', latitude: 40.71, longitude: -74.0 },
  b: { date: '2001-11-23', time: null, timeZone: 'Europe/London', latitude: 51.5, longitude: -0.12 },
};
for (const [name, input] of Object.entries(people)) {
  const chart = computeChart(input as never);
  const hist: Record<number, number> = {};
  const full: string[] = []; const six: string[] = [];
  let d = DateTime.fromISO('2026-10-16');
  for (let i = 0; i < 365; i++, d = d.plus({ days: 1 })) {
    const date = d.toISODate()!;
    const r = cosmicCouncil(chart, date, 'America/Los_Angeles');
    hist[r.agreeCount] = (hist[r.agreeCount] ?? 0) + 1;
    if (r.agreeCount === r.systems.length) full.push(`${date} ${r.score.toFixed(1)} ${r.majority} | ${r.headline}`);
    if (r.agreeCount === r.systems.length - 1) six.push(date);
  }
  console.log(name, JSON.stringify(hist), 'full:', full.length, 'six:', six.length);
  console.log(full.slice(0, 8).join('\n'));
}
