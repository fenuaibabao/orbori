import * as A from 'astronomy-engine';
import { chineseZodiac } from './chinese';
import { lifePath } from './numerology';
import { tzolkin } from './mayan';
import { moonNight } from './hawaiian';
import { hijriDate, mansionOf } from './islamic';
import { birthDayBounds, birthInstant } from './time';
import type { BirthInput, Chart, Sign } from './types';
import { placement } from './util';
import { vedicChart } from './vedic';
import { westernChart } from './western';

export * from './types';

export function computeChart(input: BirthInput): Chart {
  const timeKnown = input.time !== null;
  const instant = birthInstant(input.date, input.time, input.timeZone);
  const western = westernChart(instant, input.latitude, input.longitude, timeKnown);
  const vedic = vedicChart(instant, western);
  const m = mansionOf(vedic.planets.moon.longitude);

  let moonSignOptions: Sign[] = [western.planets.moon.sign];
  if (!timeKnown) {
    const [start, end] = birthDayBounds(input.date, input.timeZone);
    const signs = [start, end].map((d) => placement(A.EclipticGeoMoon(A.MakeTime(d)).lon).sign);
    moonSignOptions = Array.from(new Set(signs));
  }

  return {
    input,
    utc: instant.toISOString(),
    timeKnown,
    moonSignOptions,
    western,
    vedic,
    chinese: chineseZodiac(input.date),
    numerology: lifePath(input.date),
    tzolkin: tzolkin(input.date),
    hawaiian: moonNight(input.date, input.timeZone),
    islamic: { mansion: { index: m.index, name: m.name, arabic: m.arabic, meaning: m.meaning }, hijri: hijriDate(input.date, input.timeZone) },
  };
}
