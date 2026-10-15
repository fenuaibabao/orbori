/**
 * Seven-tradition compatibility between two natal charts.
 * Scores are 1–10 per system; overall is their average.
 */
import type { Chart, Sign } from '../astro/types';
import { SIGNS } from '../astro/types';
import { ANIMALS } from '../astro/chinese';
import { signIndex } from '../astro/mayan';
import { mansionSign } from '../astro/islamic';
import { gunaMilan, type GunaMilan } from './guna';

export interface SystemMatch {
  system: 'western' | 'vedic' | 'chinese' | 'numerology' | 'mayan' | 'hawaiian' | 'islamic';
  label: string;
  score: number;
  /** Display value, e.g. "27/36" for Vedic. */
  display: string;
  head: string;
  body: string;
}

export interface Compatibility {
  score: number;
  headline: string;
  agreeCount: number;
  systems: SystemMatch[];
  guna: GunaMilan;
  /** What each person brings, for "your side / their side". */
  sides: { a: string; b: string };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number) => Math.max(1, Math.min(10, x));

/* ───── Western: sign relationships ───── */

const ELEMENT = ['Fire', 'Earth', 'Air', 'Water'] as const;
const elementOf = (s: Sign) => ELEMENT[SIGNS.indexOf(s) % 4];

const RELATION: Record<number, [number, string]> = {
  0: [8, 'a conjunction'], 4: [9, 'a trine'], 8: [9, 'a trine'], 2: [8, 'a sextile'], 10: [8, 'a sextile'],
  3: [4.5, 'a square'], 9: [4.5, 'a square'], 6: [6.5, 'an opposition'],
  1: [5.5, 'a semi-sextile'], 11: [5.5, 'a semi-sextile'], 5: [5, 'a quincunx'], 7: [5, 'a quincunx'],
};
function signRelation(a: Sign, b: Sign) {
  const d = (SIGNS.indexOf(b) - SIGNS.indexOf(a) + 12) % 12;
  return { score: RELATION[d][0], name: RELATION[d][1], d };
}

const WESTERN_BODY: Record<string, string> = {
  'a conjunction': 'Same sign energy. You get each other instantly, flaws included.',
  'a trine': 'Same element, same rhythm. Easy flow, low drama.',
  'a sextile': 'Friendly elements. You make each other better without trying too hard.',
  'a square': 'You process, they pounce. Schedule fights for after snacks.',
  'an opposition': 'Opposites attract, then negotiate. Magnetic, occasionally exhausting.',
  'a semi-sextile': 'Neighbors, not twins. Lots to learn from each other.',
  'a quincunx': 'Different operating systems. Worth installing the translator.',
};

function western(a: Chart, b: Chart): SystemMatch {
  const sun = signRelation(a.western.planets.sun.sign, b.western.planets.sun.sign);
  const moon = signRelation(a.western.planets.moon.sign, b.western.planets.moon.sign);
  const vm1 = signRelation(a.western.planets.venus.sign, b.western.planets.mars.sign);
  const vm2 = signRelation(b.western.planets.venus.sign, a.western.planets.mars.sign);
  const score = clamp(0.4 * sun.score + 0.35 * moon.score + 0.125 * vm1.score + 0.125 * vm2.score);
  return {
    system: 'western', label: 'Western', score: round1(score), display: round1(score).toFixed(1),
    head: `${a.western.planets.sun.sign} × ${b.western.planets.sun.sign}: ${sun.name}.`,
    body: WESTERN_BODY[sun.name] + (moon.score >= 8 ? ' Your Moons agree, which helps a lot.' : moon.score <= 5 ? ' Your Moons need different things, so say them out loud.' : ''),
  };
}

/* ───── Vedic: Guna Milan ───── */

function vedic(g: GunaMilan): SystemMatch {
  const score = clamp(1 + (9 * g.total) / 36);
  const verdict = g.total >= 28 ? 'Excellent by the classic standard.' : g.total >= 18 ? 'Comfortably above the classic 18-point bar.' : 'Below the classic 18-point bar. The other systems get a vote too.';
  return {
    system: 'vedic', label: 'Vedic', score: round1(score), display: `${g.total % 1 ? g.total.toFixed(1) : g.total}/36`,
    head: `Guna Milan ${g.total % 1 ? g.total.toFixed(1) : g.total} of 36.`,
    body: `${verdict}${g.nadi === 0 ? ' Same Nadi, the one tradition watches closely.' : ''}`,
  };
}

/* ───── Chinese zodiac ───── */

const SIX_HARMONY = ['Rat-Ox', 'Tiger-Pig', 'Rabbit-Dog', 'Dragon-Rooster', 'Snake-Monkey', 'Horse-Goat'];
const HARM = ['Rat-Goat', 'Ox-Horse', 'Tiger-Snake', 'Rabbit-Dragon', 'Dog-Rooster', 'Pig-Monkey'];
const pairIn = (l: string[], a: string, b: string) => l.includes(`${a}-${b}`) || l.includes(`${b}-${a}`);
const GENERATES: Record<string, string> = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };

function chinese(a: Chart, b: Chart): SystemMatch {
  const x = a.chinese.animal, y = b.chinese.animal;
  const d = (ANIMALS.indexOf(y) - ANIMALS.indexOf(x) + 12) % 12;
  let score = 6, rel = 'neutral ground', body = 'No drama, no fireworks. Room to build something your own way.';
  if (d === 4 || d === 8) { score = 9.4; rel = 'same trine'; body = 'Same team, different jersey. Two minds, one plan.'; }
  else if (pairIn(SIX_HARMONY, x, y)) { score = 9; rel = 'secret friends'; body = 'One of the six harmonies. You cover each other\'s blind spots.'; }
  else if (d === 0) { score = 7; rel = 'same animal'; body = 'Mirror match. Great chemistry, same weak spots.'; }
  else if (d === 6) { score = 3; rel = 'a clash'; body = 'Opposite animals. Thrilling, but pick your battles.'; }
  else if (pairIn(HARM, x, y)) { score = 4; rel = 'a harm pairing'; body = 'Small misunderstandings add up. Over-communicate.'; }
  const ea = a.chinese.element, eb = b.chinese.element;
  if (GENERATES[ea] === eb || GENERATES[eb] === ea) score += 0.4;
  return {
    system: 'chinese', label: 'Chinese zodiac', score: round1(clamp(score)), display: round1(clamp(score)).toFixed(1),
    head: `${x} × ${y}: ${rel}.`, body,
  };
}

/* ───── Numerology: Life Path pairing ───── */

const BEST: Record<number, number[]> = {
  1: [3, 5], 2: [4, 8], 3: [1, 5, 6, 9], 4: [2, 8], 5: [1, 3, 7], 6: [3, 9], 7: [5, 7], 8: [2, 4], 9: [3, 6],
};
const base = (n: number) => (n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n);
const LP_NAME: Record<number, string> = { 1: 'Leader', 2: 'Peacemaker', 3: 'Communicator', 4: 'Builder', 5: 'Free Spirit', 6: 'Nurturer', 7: 'Seeker', 8: 'Powerhouse', 9: 'Humanitarian' };

function numerology(a: Chart, b: Chart): SystemMatch {
  const x = base(a.numerology.lifePath), y = base(b.numerology.lifePath);
  let score = 6, body = 'Different paths that can run side by side. Respect the detours.';
  if (BEST[x].includes(y)) { score = 8.8; body = 'A classic pairing. You naturally fuel each other.'; }
  else if (x === y) { score = 7.2; body = 'Same path, same instincts. Watch for the same blind spots.'; }
  else if ((([4, 8].includes(x) && [3, 5].includes(y)) || ([4, 8].includes(y) && [3, 5].includes(x)))) { score = 4.2; body = 'Structure meets spontaneity. Plan the trip, then let one of you improvise.'; }
  return {
    system: 'numerology', label: 'Numerology', score, display: score.toFixed(1),
    head: `Life Path ${a.numerology.lifePath} × ${b.numerology.lifePath}: ${LP_NAME[x]} and ${LP_NAME[y]}.`, body,
  };
}

/* ───── Mayan Tzolk'in: day sign directions ───── */

const DIRECTION = ['East', 'North', 'West', 'South'];

function mayan(a: Chart, b: Chart): SystemMatch {
  const ia = signIndex(a.tzolkin.daySign);
  const ib = signIndex(b.tzolkin.daySign);
  const d = (ib - ia + 20) % 20;
  let score = 6.3, rel = 'different directions', body = 'You walk different directions, which means more ground covered.';
  if (d === 0) { score = 9; rel = 'the same nawal'; body = 'Same day sign. You recognize each other immediately.'; }
  else if (d % 4 === 0) { score = 8.6; rel = `allies of the ${DIRECTION[ia % 4]}`; body = 'Same direction on the sacred wheel. Natural allies.'; }
  else if (d === 10) { score = 4.5; rel = 'opposites'; body = 'Opposite signs on the wheel. Challenging, and a great teacher.'; }
  return {
    system: 'mayan', label: "Chol Q'ij (Mayan)", score, display: score.toFixed(1),
    head: `${a.tzolkin.daySign} × ${b.tzolkin.daySign}: ${rel}.`, body,
  };
}

/* ───── Hawaiian: moon nights ───── */

function hawaiian(a: Chart, b: Chart): SystemMatch {
  const x = a.hawaiian, y = b.hawaiian;
  let score = 6.4, rel = 'different phases of the moon', body = 'Born under different moons: one of you swells while the other settles. Learn each other\'s tides.';
  if (x.night === y.night) { score = 9; rel = 'the same night'; body = 'The same moon night. You rise and rest on the same rhythm.'; }
  else if (x.family === y.family) { score = 8.5; rel = `both ${x.family} nights`; body = 'Nights of the same family: the same kind of work suits you both.'; }
  else if (x.anahulu === y.anahulu) { score = 7.4; rel = `both ${x.anahulu}`; body = 'The same ten nights of the moon. You share a direction, growing or resting together.'; }
  else if (x.anahulu !== 'Poepoe' && y.anahulu !== 'Poepoe') { score = 5.2; rel = 'waxing and waning'; body = 'One born as the moon grows, one as it fades. Opposite instincts that can balance each other.'; }
  return {
    system: 'hawaiian', label: 'Hawaiian moon', score, display: score.toFixed(1),
    head: `${x.name} × ${y.name}: ${rel}.`, body,
  };
}

/* ───── Islamic: lunar mansions by element ───── */

function islamic(a: Chart, b: Chart): SystemMatch {
  const ma = a.islamic.mansion, mb = b.islamic.mansion;
  const ea = elementOf(mansionSign(ma.index)), eb = elementOf(mansionSign(mb.index));
  const friendly = (ea === 'Fire' && eb === 'Air') || (ea === 'Air' && eb === 'Fire') || (ea === 'Earth' && eb === 'Water') || (ea === 'Water' && eb === 'Earth');
  let score = 5.4, rel = 'mansions of different natures', body = 'Different stars, different temperaments. Interesting, and it takes translating.';
  if (ma.index === mb.index) { score = 9; rel = 'the same mansion'; body = 'The Moon in the same mansion: you were lit by the same stars.'; }
  else if (ea === eb) { score = 8.2; rel = `both ${ea} mansions`; body = 'Mansions of one element. You want the same things from a day.'; }
  else if (friendly) { score = 7.4; rel = `${ea} and ${eb}, friendly elements`; body = 'Elements that feed each other. Easy company.'; }
  return {
    system: 'islamic', label: 'Lunar mansions', score, display: score.toFixed(1),
    head: `${ma.name} × ${mb.name}: ${rel}.`, body,
  };
}

/* ───── Overall ───── */

const HEADLINES: [number, string[]][] = [
  [8.5, ['Written in the stars, and in six other alphabets.', 'The council is basically planning your wedding.']],
  [7.5, ['Steam, but the good kind.', 'Strong match. Mostly agreed, gloriously argued.']],
  [6.5, ['Solid ground with a few plot twists.', 'Good bones. Some assembly required.']],
  [5, ['Complicated, in the interesting way.', 'A slow burn the council is still debating.']],
  [0, ['Opposites with homework.', 'High friction, high learning.']],
];

const sideText = (c: Chart) =>
  `${elementOf(c.western.planets.sun.sign)} Sun energy, a ${c.western.planets.moon.sign} Moon's needs and ${c.chinese.animal} instincts.`;

export function compatibility(a: Chart, b: Chart): Compatibility {
  const guna = gunaMilan(a, b);
  const systems = [western(a, b), vedic(guna), chinese(a, b), numerology(a, b), mayan(a, b), hawaiian(a, b), islamic(a, b)];
  const score = round1(systems.reduce((s, x) => s + x.score, 0) / systems.length);
  const options = HEADLINES.find(([min]) => score >= min)![1];
  const seed = SIGNS.indexOf(a.western.planets.sun.sign) + SIGNS.indexOf(b.western.planets.sun.sign);
  return {
    score,
    headline: options[seed % options.length],
    agreeCount: systems.filter((s) => s.score >= 6).length,
    systems,
    guna,
    sides: { a: `You bring ${sideText(a)}`, b: `They bring ${sideText(b)}` },
  };
}
