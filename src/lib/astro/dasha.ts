/**
 * Vimshottari Dasha: the 120-year cycle of planetary periods, starting from the
 * lord of the Moon's nakshatra, with the first period shortened by how far the
 * Moon had already travelled through that nakshatra. Years of 365.25 days.
 */
const ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;
const YEARS: Record<(typeof ORDER)[number], number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const YEAR_MS = 365.25 * 86400000;

export interface Period { lord: string; start: string; end: string }
export interface MahaDasha extends Period { years: number; antar: Period[] }

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function vimshottari(moonSidereal: number, birth: Date): MahaDasha[] {
  const span = 360 / 27;
  const nak = Math.floor(moonSidereal / span);
  const done = (moonSidereal % span) / span; // fraction of the nakshatra already traversed
  const first = nak % 9;
  const out: MahaDasha[] = [];
  // Start the cycle at its notional beginning so every period has full length, then clip.
  let t = birth.getTime() - done * YEARS[ORDER[first]] * YEAR_MS;
  for (let i = 0; i < 9; i++) {
    const lord = ORDER[(first + i) % 9];
    const len = YEARS[lord] * YEAR_MS;
    const antar: Period[] = [];
    let a = t;
    for (let j = 0; j < 9; j++) {
      const sub = ORDER[(first + i + j) % 9];
      const subLen = (len * YEARS[sub]) / 120;
      if (a + subLen > birth.getTime()) antar.push({ lord: sub, start: iso(Math.max(a, birth.getTime())), end: iso(a + subLen) });
      a += subLen;
    }
    out.push({ lord, years: YEARS[lord], start: iso(Math.max(t, birth.getTime())), end: iso(t + len), antar });
    t += len;
  }
  return out;
}

export function currentDasha(dashas: MahaDasha[], today: string) {
  const maha = dashas.find((d) => d.start <= today && today < d.end) ?? null;
  const antar = maha?.antar.find((d) => d.start <= today && today < d.end) ?? null;
  return { maha, antar };
}
