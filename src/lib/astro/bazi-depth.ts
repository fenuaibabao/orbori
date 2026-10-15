/**
 * Four Pillars depth: the Ten Gods (each character's relationship to the Day
 * Master), hidden stems, branch interactions, symbolic stars and the 10-year
 * luck pillars. Standard BaZi tables.
 */
import * as A from 'astronomy-engine';
import { ANIMALS } from './chinese';
import { BRANCHES, BRANCH_HANZI, STEMS, STEM_HANZI, type Bazi, type Element, type Pillar } from './bazi';

const STEM_ELEMENT: Element[] = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
const PRODUCES: Record<Element, Element> = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
const CONTROLS: Record<Element, Element> = { Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood' };

export interface TenGod { name: string; hanzi: string; group: 'Companion' | 'Output' | 'Wealth' | 'Power' | 'Resource' }

/** The Ten God a stem is, seen from the Day Master stem. */
export function tenGod(dayStem: number, stem: number): TenGod {
  const dm = STEM_ELEMENT[dayStem], el = STEM_ELEMENT[stem];
  const same = dayStem % 2 === stem % 2;
  if (el === dm) return same ? { name: 'Friend', hanzi: '比肩', group: 'Companion' } : { name: 'Rob Wealth', hanzi: '劫財', group: 'Companion' };
  if (PRODUCES[dm] === el) return same ? { name: 'Eating God', hanzi: '食神', group: 'Output' } : { name: 'Hurting Officer', hanzi: '傷官', group: 'Output' };
  if (CONTROLS[dm] === el) return same ? { name: 'Indirect Wealth', hanzi: '偏財', group: 'Wealth' } : { name: 'Direct Wealth', hanzi: '正財', group: 'Wealth' };
  if (CONTROLS[el] === dm) return same ? { name: 'Seven Killings', hanzi: '七殺', group: 'Power' } : { name: 'Direct Officer', hanzi: '正官', group: 'Power' };
  return same ? { name: 'Indirect Resource', hanzi: '偏印', group: 'Resource' } : { name: 'Direct Resource', hanzi: '正印', group: 'Resource' };
}

/** Hidden stems in each branch, main qi first. */
export const HIDDEN: number[][] = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];

const CLASH: [number, number][] = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
const COMBINE: [number, number, Element][] = [[0, 1, 'Earth'], [2, 11, 'Wood'], [3, 10, 'Fire'], [4, 9, 'Metal'], [5, 8, 'Water'], [6, 7, 'Fire']];
const HARM: [number, number][] = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
const TRINE: [number[], Element][] = [[[8, 0, 4], 'Water'], [[11, 3, 7], 'Wood'], [[2, 6, 10], 'Fire'], [[5, 9, 1], 'Metal']];

export interface Interaction { kind: 'clash' | 'combination' | 'harm' | 'three harmony' | 'half three harmony'; between: string[]; pillars: string[]; element?: Element }

const br = (i: number) => `${BRANCHES[i]} ${BRANCH_HANZI[i]} (${ANIMALS[i]})`;

export function interactions(b: Bazi): Interaction[] {
  const ps: [string, Pillar][] = [['year', b.year], ['month', b.month], ['day', b.day]];
  if (b.hour) ps.push(['hour', b.hour]);
  const out: Interaction[] = [];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i][1].branch, c = ps[j][1].branch;
    const pair = (list: [number, number][]) => list.some(([x, y]) => (x === a && y === c) || (x === c && y === a));
    const names = [ps[i][0], ps[j][0]];
    if (pair(CLASH)) out.push({ kind: 'clash', between: [br(a), br(c)], pillars: names });
    const combo = COMBINE.find(([x, y]) => (x === a && y === c) || (x === c && y === a));
    if (combo) out.push({ kind: 'combination', between: [br(a), br(c)], pillars: names, element: combo[2] });
    if (pair(HARM)) out.push({ kind: 'harm', between: [br(a), br(c)], pillars: names });
  }
  const present = new Set(ps.map(([, p]) => p.branch));
  for (const [set, element] of TRINE) {
    const have = set.filter((x) => present.has(x));
    if (have.length === 3) out.push({ kind: 'three harmony', between: have.map(br), pillars: ps.filter(([, p]) => have.includes(p.branch)).map(([n]) => n), element });
    else if (have.length === 2 && have.includes(set[1])) out.push({ kind: 'half three harmony', between: have.map(br), pillars: ps.filter(([, p]) => have.includes(p.branch)).map(([n]) => n), element });
  }
  return out;
}

/** Symbolic stars from the Day stem and the Day/Year branches. */
const NOBLEMAN: Record<number, number[]> = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 7: [2, 6], 8: [5, 3], 9: [5, 3] };
const ACADEMIC: number[] = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
const PEACH: Record<number, number> = { 8: 9, 0: 9, 4: 9, 2: 3, 6: 3, 10: 3, 5: 6, 9: 6, 1: 6, 11: 0, 3: 0, 7: 0 };

export interface Star { name: string; hanzi: string; branch: string; where: string[]; present: boolean }

export function stars(b: Bazi): Star[] {
  const ps: [string, Pillar][] = [['year', b.year], ['month', b.month], ['day', b.day]];
  if (b.hour) ps.push(['hour', b.hour]);
  const find = (branches: number[]) => ps.filter(([, p]) => branches.includes(p.branch)).map(([n]) => n);
  const noble = NOBLEMAN[b.day.stem];
  const academic = ACADEMIC[b.day.stem];
  const peachFromDay = PEACH[b.day.branch], peachFromYear = PEACH[b.year.branch];
  const peachWhere = [...new Set([...find([peachFromDay]), ...find([peachFromYear])])];
  return [
    { name: 'Nobleman', hanzi: '天乙貴人', branch: noble.map((x) => BRANCHES[x]).join(' or '), where: find(noble), present: find(noble).length > 0 },
    { name: 'Academic star', hanzi: '文昌', branch: BRANCHES[academic], where: find([academic]), present: find([academic]).length > 0 },
    { name: 'Peach Blossom', hanzi: '桃花', branch: [...new Set([BRANCHES[peachFromDay], BRANCHES[peachFromYear]])].join(' or '), where: peachWhere, present: peachWhere.length > 0 },
  ];
}

/** Sexagenary pillar by index 0–59. */
function pillarAt(idx: number): { name: string; hanzi: string; stem: number; branch: number; label: string } {
  const stem = idx % 10, branch = idx % 12;
  const polarity = stem % 2 === 0 ? 'Yang' : 'Yin';
  return { name: `${STEMS[stem]} ${BRANCHES[branch]}`, hanzi: `${STEM_HANZI[stem]}${BRANCH_HANZI[branch]}`, stem, branch, label: `${polarity} ${STEM_ELEMENT[stem]} ${ANIMALS[branch]}` };
}

export interface LuckPillar { from: number; to: number; name: string; hanzi: string; label: string; stem: number; branch: number; tenGod: TenGod }

/**
 * 10-year luck pillars. Forward for Yang-year males and Yin-year females, backward
 * otherwise. The first pillar starts at (days from birth to the next/previous
 * jie) ÷ 3 years. Both directions are returned; the page picks one.
 */
export function luckPillars(b: Bazi, instant: Date) {
  const time = A.MakeTime(instant);
  const lon = A.SunPosition(time).elon;
  const monthStart = 315 + 30 * Math.floor((((lon - 315) % 360) + 360) % 360 / 30);
  const next = A.SearchSunLongitude((monthStart + 30) % 360, time, 40)!;
  const prev = A.SearchSunLongitude(monthStart % 360, time.AddDays(-40), 45)!;
  const idx = [...Array(60).keys()].find((i) => i % 10 === b.month.stem && i % 12 === b.month.branch)!;
  const build = (forward: boolean) => {
    const days = forward ? next.ut - time.ut : time.ut - prev.ut;
    const startAge = Math.round((days / 3) * 10) / 10;
    const out: LuckPillar[] = [];
    for (let i = 1; i <= 8; i++) {
      const p = pillarAt((((idx + (forward ? i : -i)) % 60) + 60) % 60);
      const from = Math.floor(startAge + (i - 1) * 10);
      out.push({ from, to: from + 9, ...p, tenGod: tenGod(b.day.stem, p.stem) });
    }
    return { startAge, pillars: out };
  };
  const yangYear = b.year.stem % 2 === 0;
  return { forward: build(true), backward: build(false), maleForward: yangYear, femaleForward: !yangYear };
}

/** The pillar of the current solar year (changes at Lichun), with its Ten God. */
export function annualPillar(b: Bazi, today: Date) {
  const year = today.getUTCFullYear();
  const lichun = A.SearchSunLongitude(315, A.MakeTime(new Date(Date.UTC(year, 0, 25))), 30)!.date;
  const solarYear = today < lichun ? year - 1 : year;
  const idx = (((solarYear - 4) % 60) + 60) % 60;
  const p = pillarAt(idx);
  return { year: solarYear, ...p, tenGod: tenGod(b.day.stem, p.stem) };
}

export function tenGodsOf(b: Bazi) {
  const ps: [string, Pillar][] = [['year', b.year], ['month', b.month], ['day', b.day]];
  if (b.hour) ps.push(['hour', b.hour]);
  return ps.map(([name, p]) => ({
    pillar: name,
    stem: { hanzi: STEM_HANZI[p.stem], name: STEMS[p.stem], tenGod: name === 'day' ? null : tenGod(b.day.stem, p.stem) },
    hidden: HIDDEN[p.branch].map((s) => ({ hanzi: STEM_HANZI[s], name: STEMS[s], element: STEM_ELEMENT[s], tenGod: tenGod(b.day.stem, s) })),
  }));
}
