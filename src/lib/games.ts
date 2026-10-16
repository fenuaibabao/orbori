/** Minigame helpers (pure, testable). */
import { GLOSSARY } from './glossary';

export const shuffle = <T,>(xs: T[], rand = Math.random): T[] => {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Hide the term (and its plain name before any bracket) inside its own definition. */
export function maskTerm(term: string, body: string): string {
  const names = term.split(/\s*[(/]\s*|\s*\)\s*/).map((s) => s.trim()).filter((s) => s.length > 2);
  let out = body;
  for (const n of names) out = out.replace(new RegExp(escape(n), 'gi'), '_____');
  return out;
}

export interface QuestQuestion { id: string; system: string; clue: string; answer: string; options: string[] }

/** Term Quest: guess the term from its definition. Hard mode draws every option from the same tradition. */
export function makeQuest(count: number, hard: boolean, rand = Math.random): QuestQuestion[] {
  const pool = GLOSSARY.filter((g) => g.body.length > 40);
  return shuffle(pool, rand).slice(0, count).map((g) => {
    const same = pool.filter((x) => x.system === g.system && x.id !== g.id);
    const other = pool.filter((x) => x.id !== g.id);
    const from = hard && same.length >= 3 ? same : other;
    const wrong = shuffle(from, rand).slice(0, 3).map((x) => x.term);
    return { id: g.id, system: g.system, clue: maskTerm(g.term, g.body), answer: g.term, options: shuffle([g.term, ...wrong], rand) };
  });
}

/* ───── One game per tradition: round builders ───── */
import { chartRuler } from './astro/western-depth';
import { SIGNS } from './astro/types';
import { lifePath, reduce } from './astro/numerology';
import { NIGHTS } from './astro/hawaiian';
import { DAY_SIGNS } from './astro/mayan';

export interface PlainRound { prompt: string; question: string; options: string[]; answer: string; after?: string; night?: number; letter?: string }

const pick = <T,>(xs: readonly T[], rand = Math.random) => xs[Math.floor(rand() * xs.length)];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const optionsFor = (answer: string, pool: readonly string[], n = 4, rand = Math.random) =>
  shuffle([answer, ...shuffle(pool.filter((x) => x !== answer), rand).slice(0, n - 1)], rand);

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water'];
const MODES = ['Cardinal', 'Fixed', 'Mutable'];
const RULER_POOL = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Jupiter', 'Saturn'];

/** Western: a sign's element, mode or traditional ruler. */
export function westernRounds(count = 8, rand = Math.random): PlainRound[] {
  return Array.from({ length: count }, (_, i) => {
    const s = pick(SIGNS, rand);
    const idx = SIGNS.indexOf(s);
    const kind = i % 3;
    if (kind === 0) return { prompt: s, question: 'Which element is it?', options: ELEMENTS.slice(), answer: ELEMENTS[idx % 4], after: `Fire, Earth, Air and Water repeat around the zodiac from Aries.` };
    if (kind === 1) return { prompt: s, question: 'Which mode is it?', options: MODES.slice(), answer: MODES[idx % 3], after: 'Cardinal signs begin each season, fixed signs hold it, mutable signs move it on.' };
    const ruler = cap(chartRuler(s).traditional);
    return { prompt: s, question: 'Which planet traditionally rules it?', options: optionsFor(ruler, RULER_POOL, 4, rand), answer: ruler, after: 'These are the seven classical rulers, before Uranus, Neptune and Pluto were found.' };
  });
}

/** Numerology: find the Life Path of a random birthday. */
export function numerologyRounds(count = 6, rand = Math.random): PlainRound[] {
  const pool = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22', '33'];
  return Array.from({ length: count }, () => {
    const y = 1950 + Math.floor(rand() * 60), m = 1 + Math.floor(rand() * 12), d = 1 + Math.floor(rand() * 28);
    const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const lp = String(lifePath(date).lifePath);
    const pretty = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    return {
      prompt: pretty, question: 'What is the Life Path?', options: optionsFor(lp, pool, 4, rand), answer: lp,
      after: `Month ${m} → ${reduce(m)}, day ${d} → ${reduce(d)}, year ${y} → ${reduce(y)}; together ${reduce(m) + reduce(d) + reduce(y)} → ${lp}.`,
    };
  });
}

/** Hawaiian: name the night from the shape of the moon. Distractors come from other parts of the month. */
export function hawaiianRounds(count = 6, rand = Math.random): PlainRound[] {
  return Array.from({ length: count }, () => {
    const night = 1 + Math.floor(rand() * 30);
    const name = NIGHTS[night - 1];
    const far = NIGHTS.filter((n, i) => n !== name && Math.min(Math.abs(i + 1 - night), 30 - Math.abs(i + 1 - night)) >= 5);
    return { prompt: '', night, question: 'Which night of the Hawaiian moon is this?', options: optionsFor(name, Array.from(new Set(far)), 4, rand), answer: name, after: `Night ${night} of 30.` };
  });
}

/** The 28 Arabic letters in abjad order with their eastern (Mashriqi) values. */
export const ABJAD_LETTERS: [string, number, string][] = [
  ['ا', 1, 'alif'], ['ب', 2, 'bāʾ'], ['ج', 3, 'jīm'], ['د', 4, 'dāl'], ['ه', 5, 'hāʾ'], ['و', 6, 'wāw'], ['ز', 7, 'zāy'], ['ح', 8, 'ḥāʾ'], ['ط', 9, 'ṭāʾ'],
  ['ي', 10, 'yāʾ'], ['ك', 20, 'kāf'], ['ل', 30, 'lām'], ['م', 40, 'mīm'], ['ن', 50, 'nūn'], ['س', 60, 'sīn'], ['ع', 70, 'ʿayn'], ['ف', 80, 'fāʾ'], ['ص', 90, 'ṣād'],
  ['ق', 100, 'qāf'], ['ر', 200, 'rāʾ'], ['ش', 300, 'shīn'], ['ت', 400, 'tāʾ'], ['ث', 500, 'thāʾ'], ['خ', 600, 'khāʾ'], ['ذ', 700, 'dhāl'], ['ض', 800, 'ḍād'], ['ظ', 900, 'ẓāʾ'], ['غ', 1000, 'ghayn'],
];

/** Islamic: the abjad value of a letter. Options are close in size so it's a real guess. */
export function islamicRounds(count = 8, rand = Math.random): PlainRound[] {
  return shuffle(ABJAD_LETTERS, rand).slice(0, count).map(([letter, value, name]) => {
    const i = ABJAD_LETTERS.findIndex((l) => l[0] === letter);
    const near = ABJAD_LETTERS.slice(Math.max(0, i - 4), i + 5).map((l) => String(l[1]));
    return { prompt: '', letter, question: `${cap(name)}: what is its abjad value?`, options: optionsFor(String(value), near, 4, rand), answer: String(value), after: `${cap(name)} is letter ${i + 1} in abjad order.` };
  });
}

/** Vedic: Sanskrit graha names and their planets. */
export const GRAHA_PAIRS = [
  { a: 'Sūrya', b: 'Sun' }, { a: 'Chandra', b: 'Moon' }, { a: 'Maṅgala', b: 'Mars' }, { a: 'Budha', b: 'Mercury' }, { a: 'Guru', b: 'Jupiter' },
  { a: 'Śukra', b: 'Venus' }, { a: 'Śani', b: 'Saturn' }, { a: 'Rāhu', b: 'North node' }, { a: 'Ketu', b: 'South node' },
];

/** Mayan: K'iche' nawal names and their meanings. */
export const nawalPairs = (n = 6, rand = Math.random) => shuffle(DAY_SIGNS, rand).slice(0, n).map((s) => ({ a: s.kiche, b: s.english }));
