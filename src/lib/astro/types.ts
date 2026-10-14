export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;
export type Sign = (typeof SIGNS)[number];

export type PlanetKey =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'node';

export interface BirthInput {
  /** Civil birth date in the birth place, e.g. "1996-07-18". */
  date: string;
  /** Civil birth time "HH:mm" (24h), or null when unknown. */
  time: string | null;
  /** IANA time zone of the birth place, e.g. "America/Los_Angeles". */
  timeZone: string;
  latitude: number;
  longitude: number;
}

export interface Placement {
  /** Ecliptic longitude, 0–360°. */
  longitude: number;
  sign: Sign;
  /** Degrees into the sign, 0–30. */
  degree: number;
  retrograde: boolean;
}

export interface WesternChart {
  planets: Record<PlanetKey, Placement>;
  /** Null when birth time is unknown. */
  ascendant: Placement | null;
  midheaven: Placement | null;
}

export interface VedicChart {
  ayanamsa: number;
  planets: Record<PlanetKey, Placement>;
  ascendant: Placement | null;
  moonNakshatra: { name: string; index: number; pada: number; lord: string };
}

export interface ChineseZodiac {
  animal: string;
  element: 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
  polarity: 'Yang' | 'Yin';
  /** Gregorian date of the Lunar New Year that started this zodiac year. */
  lunarYearStart: string;
}

export interface Numerology {
  lifePath: number;
  isMasterNumber: boolean;
}

export interface Tzolkin {
  number: number;
  /** Yucatec name, e.g. "Chuwen". */
  daySign: string;
  /** K'iche' name, e.g. "B'atz'". */
  kicheName: string;
  /** English gloss, e.g. "Monkey". */
  english: string;
  label: string;
}

export interface Chart {
  input: BirthInput;
  /** Moment used for the calculation (UTC ISO). Noon local when time is unknown. */
  utc: string;
  timeKnown: boolean;
  /**
   * When time is unknown and the Moon changes sign during the birth day,
   * both possible Moon signs are listed (tropical).
   */
  moonSignOptions: Sign[];
  western: WesternChart;
  vedic: VedicChart;
  chinese: ChineseZodiac;
  numerology: Numerology;
  tzolkin: Tzolkin;
}
