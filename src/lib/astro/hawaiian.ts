/**
 * Kaulana Mahina, the Hawaiian moon calendar: 30 named nights (pō) in each moon,
 * grouped in three anahulu (ten-night periods), with a moon month (malama) and
 * season. A night begins at sunset, so a civil date's "night" is its evening.
 *
 * The count is anchored to the astronomical new moon: Hilo is the first night
 * after conjunction and Muku the dark night that ends the moon. Traditional
 * day-keepers count by observation, so published calendars can differ by a
 * night; month names also vary between islands. The Welehu moon (the start of
 * Makahiki) is taken as the first new moon on or after 17 November, when
 * Makaliʻi (the Pleiades) rises at sunset.
 */
import * as A from 'astronomy-engine';
import { DateTime } from 'luxon';

export const NIGHTS = [
  'Hilo', 'Hoaka', 'Kūkahi', 'Kūlua', 'Kūkolu', 'Kūpau', 'ʻOlekūkahi', 'ʻOlekūlua', 'ʻOlekūkolu', 'ʻOlepau',
  'Huna', 'Mohalu', 'Hua', 'Akua', 'Hoku', 'Māhealani', 'Kulu', 'Lāʻaukūkahi', 'Lāʻaukūlua', 'Lāʻaupau',
  'ʻOlekūkahi', 'ʻOlekūlua', 'ʻOlepau', 'Kāloakūkahi', 'Kāloakūlua', 'Kāloapau', 'Kāne', 'Lono', 'Mauli', 'Muku',
] as const;

export const ANAHULU = ['Hoʻonui', 'Poepoe', 'Hoʻēmi'] as const; // waxing, round, waning
export const MONTHS = ['Welehu', 'Makaliʻi', 'Kāʻelo', 'Kaulua', 'Nana', 'Welo', 'Ikiiki', 'Kaʻaona', 'Hinaiaʻeleʻele', 'Māhoe Mua', 'Māhoe Hope', 'ʻIkuwā'] as const;

/** Families of nights that share a character (used for compatibility and copy). */
export type NightFamily = 'Hilo' | 'Hoaka' | 'Kū' | 'ʻOle' | 'Huna' | 'Mohalu' | 'Hua' | 'Akua' | 'Hoku' | 'Māhealani' | 'Kulu' | 'Lāʻau' | 'Kāloa' | 'Kāne' | 'Lono' | 'Mauli' | 'Muku';
export function nightFamily(night: number): NightFamily {
  if (night >= 3 && night <= 6) return 'Kū';
  if ((night >= 7 && night <= 10) || (night >= 21 && night <= 23)) return 'ʻOle';
  if (night >= 18 && night <= 20) return 'Lāʻau';
  if (night >= 24 && night <= 26) return 'Kāloa';
  return NIGHTS[night - 1] as NightFamily;
}

export interface MoonNight {
  night: number;
  name: string;
  family: NightFamily;
  anahulu: (typeof ANAHULU)[number];
  /** Days since the new moon at the evening of this date. */
  age: number;
  month: string;
  season: 'Hoʻoilo' | 'Kau';
  makahiki: boolean;
}

/** Most recent new moon at or before `time`. */
function lastNewMoon(time: A.AstroTime): A.AstroTime {
  let t = A.SearchMoonPhase(0, time.AddDays(-31), 32)!;
  for (;;) {
    const next = A.SearchMoonPhase(0, t.AddDays(1), 32)!;
    if (next.ut > time.ut) return t;
    t = next;
  }
}

function welehuStart(year: number): A.AstroTime {
  return A.SearchMoonPhase(0, A.MakeTime(new Date(Date.UTC(year, 10, 17))), 32)!;
}

/** The Hawaiian moon night for the evening of a civil date in a time zone. */
export function moonNight(date: string, timeZone: string): MoonNight {
  const evening = DateTime.fromISO(`${date}T18:00`, { zone: timeZone }).toJSDate();
  const time = A.MakeTime(evening);
  const nm = lastNewMoon(time);
  const age = time.ut - nm.ut;
  const night = Math.min(30, Math.floor(age) + 1);
  // Month: count new moons from the most recent Welehu.
  const y = +date.slice(0, 4);
  let welehu = welehuStart(y);
  if (welehu.ut > nm.ut + 0.5) welehu = welehuStart(y - 1);
  let idx = 0;
  let t = welehu;
  while (t.ut < nm.ut - 0.5) { t = A.SearchMoonPhase(0, t.AddDays(1), 32)!; idx++; }
  const month = idx < 12 ? MONTHS[idx] : 'ʻIkuwā (second)';
  return {
    night, name: NIGHTS[night - 1], family: nightFamily(night), anahulu: ANAHULU[Math.min(2, Math.floor((night - 1) / 10))],
    age: Math.round(age * 10) / 10, month, season: idx < 6 ? 'Hoʻoilo' : 'Kau', makahiki: idx <= 3,
  };
}
