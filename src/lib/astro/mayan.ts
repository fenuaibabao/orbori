import type { Tzolkin } from './types';
import { julianDayNumber, parseDate } from './util';

/** Goodman–Martinez–Thompson correlation (the one used by most Maya day-keepers today). */
export const GMT_CORRELATION = 584283;

export const DAY_SIGNS: { yucatec: string; kiche: string; english: string }[] = [
  { yucatec: 'Imix', kiche: 'Imox', english: 'Crocodile' },
  { yucatec: "Ik'", kiche: "Iq'", english: 'Wind' },
  { yucatec: "Ak'bal", kiche: "Aq'ab'al", english: 'Night' },
  { yucatec: "K'an", kiche: "K'at", english: 'Seed' },
  { yucatec: 'Chikchan', kiche: 'Kan', english: 'Serpent' },
  { yucatec: 'Kimi', kiche: 'Kame', english: 'Death' },
  { yucatec: "Manik'", kiche: 'Kej', english: 'Deer' },
  { yucatec: 'Lamat', kiche: "Q'anil", english: 'Star' },
  { yucatec: 'Muluk', kiche: 'Toj', english: 'Water' },
  { yucatec: 'Ok', kiche: "Tz'i'", english: 'Dog' },
  { yucatec: 'Chuwen', kiche: "B'atz'", english: 'Monkey' },
  { yucatec: "Eb'", kiche: 'E', english: 'Road' },
  { yucatec: "B'en", kiche: 'Aj', english: 'Reed' },
  { yucatec: 'Ix', kiche: "I'x", english: 'Jaguar' },
  { yucatec: 'Men', kiche: "Tz'ikin", english: 'Eagle' },
  { yucatec: "Kib'", kiche: 'Ajmaq', english: 'Owl' },
  { yucatec: "Kab'an", kiche: "No'j", english: 'Earth' },
  { yucatec: "Etz'nab'", kiche: 'Tijax', english: 'Flint' },
  { yucatec: 'Kawak', kiche: 'Kawoq', english: 'Storm' },
  { yucatec: 'Ajaw', kiche: 'Ajpu', english: 'Sun' },
];

/** Tzolk'in day for a civil date. The Maya day count is anchored on 4 Ajaw (JDN 584283). */
export function tzolkin(birthDate: string): Tzolkin {
  const { year, month, day } = parseDate(birthDate);
  const n = julianDayNumber(year, month, day) - GMT_CORRELATION;
  const number = (((n + 3) % 13) + 13) % 13 + 1;
  const sign = DAY_SIGNS[(((n + 19) % 20) + 20) % 20];
  return {
    number,
    daySign: sign.yucatec,
    kicheName: sign.kiche,
    english: sign.english,
    label: `${number} ${sign.english}`,
  };
}
