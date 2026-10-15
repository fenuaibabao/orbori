/** Numerology beyond the Life Path. Name numbers use the Pythagorean chart; Y counts as a consonant. */
import { reduce } from './numerology';
import { parseDate } from './util';

const r9 = (n: number) => { while (n > 9) n = String(n).split('').reduce((s, d) => s + +d, 0); return n; };

export function personalCycles(birthDate: string, today: string) {
  const b = parseDate(birthDate);
  const t = parseDate(today);
  const year = r9(r9(b.month) + r9(b.day) + r9(t.year));
  const month = r9(year + t.month);
  const day = r9(month + t.day);
  return { personalYear: year, personalMonth: month, personalDay: day, nextYearStarts: `${t.year + 1}-01-01` };
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

const KARMIC = new Set([13, 14, 16, 19]);
const single = (n: number) => { while (n > 9) n = String(n).split('').reduce((s, d) => s + +d, 0); return n; };

/**
 * Pinnacles (four life periods, each with its own number) and Challenges (the
 * lesson of each period). First period ends at 36 minus the Life Path (as a single
 * digit); the next two last nine years each; the fourth runs to the end.
 */
export function pinnaclesAndChallenges(birthDate: string, lifePath: number) {
  const b = parseDate(birthDate);
  const m = reduce(b.month), d = reduce(b.day), y = reduce(b.year);
  const p1 = reduce(m + d), p2 = reduce(d + y), p3 = reduce(p1 + p2), p4 = reduce(m + y);
  const sm = single(b.month), sd = single(b.day), sy = single(b.year);
  const c1 = Math.abs(sm - sd), c2 = Math.abs(sd - sy), c3 = Math.abs(c1 - c2), c4 = Math.abs(sm - sy);
  const end1 = 36 - single(lifePath);
  const periods = [
    { from: 0, to: end1 }, { from: end1 + 1, to: end1 + 9 }, { from: end1 + 10, to: end1 + 18 }, { from: end1 + 19, to: null as number | null },
  ];
  return [p1, p2, p3, p4].map((pinnacle, i) => ({ ...periods[i], pinnacle, challenge: [c1, c2, c3, c4][i] }));
}

/** Age in completed years on a given date. */
export function ageOn(birthDate: string, today: string) {
  const b = parseDate(birthDate), t = parseDate(today);
  return t.year - b.year - (t.month < b.month || (t.month === b.month && t.day < b.day) ? 1 : 0);
}

/** Karmic debt numbers hiding behind the birth date: 13, 14, 16 or 19 before reduction. */
export function karmicDebts(birthDate: string) {
  const b = parseDate(birthDate);
  const lifePathRaw = reduce(b.month) + reduce(b.day) + reduce(b.year);
  const debts: { source: string; number: number }[] = [];
  if (KARMIC.has(b.day)) debts.push({ source: 'Birthday', number: b.day });
  if (KARMIC.has(lifePathRaw)) debts.push({ source: 'Life Path', number: lifePathRaw });
  return debts;
}

/** Karmic lessons (numbers missing from the name) and the Hidden Passion (the most frequent). */
export function nameLessons(fullName: string) {
  const letters = fullName.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '').split('');
  if (!letters.length) return null;
  const counts = Array(10).fill(0) as number[];
  for (const c of letters) counts[VALUE(c)]++;
  const lessons = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => counts[n] === 0);
  const max = Math.max(...counts);
  const hiddenPassion = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => counts[n] === max);
  const total = letters.reduce((s, c) => s + VALUE(c), 0);
  return { lessons, hiddenPassion, expressionRaw: total, expressionDebt: KARMIC.has(total) ? total : null };
}

export const maturityNumber = (lifePath: number, expression: number) => reduce(lifePath + expression);
