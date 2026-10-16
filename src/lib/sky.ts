import * as A from 'astronomy-engine';
import { moonNight } from './astro/hawaiian';
import { hijriDate, moonMansionAt } from './astro/islamic';
import { tzolkin } from './astro/mayan';
import { reduce } from './astro/numerology';
import { placement } from './astro/util';
import { lahiriAyanamsa, nakshatra } from './astro/vedic';
import { dayPillar } from './council/signals';

/** The sky today, seven ways: universal positions (no one's personal chart). */
export function skyToday(date: string) {
  const noon = new Date(`${date}T20:00:00Z`); // noon Pacific
  const time = A.MakeTime(noon);
  const moonLon = A.EclipticGeoMoon(time).lon;
  const sidereal = ((moonLon - lahiriAyanamsa(time)) % 360 + 360) % 360;
  const dp = dayPillar(date);
  const t = tzolkin(date);
  const h = moonNight(date, 'Pacific/Honolulu');
  const hijri = hijriDate(date, 'UTC');
  const mansion = moonMansionAt(time);
  const universal = reduce(date.replace(/-/g, '').split('').reduce((s, d) => s + +d, 0));
  return [
    ['Western', `Moon in ${placement(moonLon).sign}`],
    ['Vedic', `Moon in ${nakshatra(sidereal).name}`],
    ['Chinese', `${dp.element} ${dp.animal} day`],
    ['Numerology', `Universal day ${universal}`],
    ['Mayan', `${t.label} · ${t.english}`],
    ['Hawaiian', `${h.name}, night ${h.night}`],
    ['Islamic', `${hijri.day} ${hijri.monthName} · Moon in ${mansion.name}`],
  ] as [string, string][];
}


import type { Chart } from './astro/types';
/** A birth chart, seven ways, for "born on …" posts (no names, just a date). */
export function birthRows(chart: Chart) {
  const sun = chart.western.planets.sun.sign;
  const moon = chart.moonSignOptions.length > 1 ? `${chart.moonSignOptions[0]} or ${chart.moonSignOptions[1]}` : chart.moonSignOptions[0];
  return [
    ['Western', `${sun} Sun, ${moon} Moon`],
    ['Vedic', `Moon in ${chart.vedic.moonNakshatra.name}`],
    ['Chinese', `${chart.chinese.element} ${chart.chinese.animal}`],
    ['Numerology', `Life Path ${chart.numerology.lifePath}`],
    ['Mayan', `${chart.tzolkin.number} ${chart.tzolkin.daySign} · ${chart.tzolkin.english}`],
    ['Hawaiian', `Born on ${chart.hawaiian.name}`],
    ['Islamic', `Moon in ${chart.islamic.mansion.name}`],
  ] as [string, string][];
}
