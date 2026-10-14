/** Numerology beyond the Life Path. Name numbers use the Pythagorean chart; Y counts as a consonant. */
import { reduce } from './numerology';
import { parseDate } from './util';

const r9 = (n: number) => { while (n > 9) n = String(n).split('').reduce((s, d) => s + +d, 0); return n; };

export function personalCycles(birthDate: string, today: string) {
  const b = parseDate(birthDate);
  const t = parseDate(today);
  const year = r9(r9(b.month) + r9(b.day) + r9(t.year));
  const month = r9(year + t.month);
  return { personalYear: year, personalMonth: month, nextYearStarts: `${t.year + 1}-01-01` };
}

export function birthdayNumber(birthDate: string) {
  const { day } = parseDate(birthDate);
  return { day, reduced: reduce(day) };
}

const VALUE = (c: string) => ((c.charCodeAt(0) - 65) % 9) + 1;
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/** Expression (all letters), Soul Urge (vowels) and Personality (consonants) for a full birth name. */
export function nameNumbers(fullName: string) {
  const letters = fullName.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '').split('');
  if (!letters.length) return null;
  const sum = (ls: string[]) => reduce(ls.reduce((s, c) => s + VALUE(c), 0));
  return {
    expression: sum(letters),
    soulUrge: sum(letters.filter((c) => VOWELS.has(c))),
    personality: sum(letters.filter((c) => !VOWELS.has(c))),
  };
}
