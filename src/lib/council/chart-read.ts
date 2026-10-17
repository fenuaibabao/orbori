/**
 * The Council on you: what the seven traditions agree on about a whole birth chart.
 * Each placement carries a couple of plain trait tags; a trait counts once per
 * tradition, and the traits shared by the most traditions make the read.
 * Same chart → same read.
 */
import { MANSIONS } from '../astro/islamic';
import { NIGHT_MEANING } from '../astro/hawaiian-content';
import type { Chart, Sign } from '../astro/types';
import { TZOLKIN_LINE } from '../content';

export type Trait = 'feeling' | 'loyal' | 'builder' | 'expressive' | 'curious' | 'bold' | 'free' | 'harmony' | 'wise' | 'original';
export type Tradition = 'western' | 'vedic' | 'chinese' | 'numerology' | 'mayan' | 'hawaiian' | 'islamic';

export const TRADITION_NAME: Record<Tradition, string> = {
  western: 'Western', vedic: 'Vedic', chinese: 'Chinese', numerology: 'Numerology', mayan: 'Mayan', hawaiian: 'Hawaiian', islamic: 'Arabic',
};
const ORDER: Tradition[] = ['western', 'vedic', 'chinese', 'numerology', 'mayan', 'hawaiian', 'islamic'];

export const THEME: Record<Trait, { title: string; sub: string; adj: string; noun: string }> = {
  feeling: { title: 'You feel things deeply', sub: 'Intuitive, sensitive, reads a room fast', adj: 'deep-feeling', noun: 'soul who feels everything' },
  loyal: { title: 'Loyal to your people', sub: 'Home, family and the ones you choose', adj: 'loyal', noun: 'protector of your people' },
  builder: { title: 'A builder', sub: 'Patient and practical; you make things last', adj: 'steady', noun: 'builder' },
  expressive: { title: 'Warm and expressive', sub: 'You like to shine, and to make it beautiful', adj: 'warm', noun: 'natural light for others' },
  curious: { title: 'Curious and quick', sub: 'Ideas, talk, learning, variety', adj: 'curious', noun: 'explorer of ideas' },
  bold: { title: 'Bold and driven', sub: 'You go first and push through', adj: 'bold', noun: 'trailblazer' },
  free: { title: 'A free spirit', sub: 'Travel, room to roam, new roads', adj: 'free-spirited', noun: 'wanderer' },
  harmony: { title: 'A peacemaker with taste', sub: 'Kind, fair, makes things balanced and lovely', adj: 'graceful', noun: 'peacemaker' },
  wise: { title: 'An old soul', sub: 'Thoughtful, wise, sees the long view', adj: 'wise', noun: 'old soul' },
  original: { title: 'One of a kind', sub: 'Original, inventive, sees what others miss', adj: 'original', noun: 'visionary' },
};

const SIGN: Record<Sign, { t: [Trait, Trait]; says: string }> = {
  Aries: { t: ['bold', 'free'], says: 'brave, first to start' }, Taurus: { t: ['builder', 'harmony'], says: 'steady, loves beauty and comfort' },
  Gemini: { t: ['curious', 'expressive'], says: 'curious, quick and talkative' }, Cancer: { t: ['feeling', 'loyal'], says: 'tender, protective, home is everything' },
  Leo: { t: ['expressive', 'bold'], says: 'warm and proud, made to shine' }, Virgo: { t: ['builder', 'wise'], says: 'careful and helpful, a fixer' },
  Libra: { t: ['harmony', 'expressive'], says: 'fair and charming, makes people feel welcome' }, Scorpio: { t: ['feeling', 'bold'], says: 'intense, feels everything at full strength' },
  Sagittarius: { t: ['free', 'wise'], says: 'adventurous, a seeker' }, Capricorn: { t: ['builder', 'bold'], says: 'patient and ambitious, builds to last' },
  Aquarius: { t: ['original', 'free'], says: 'original and independent' }, Pisces: { t: ['feeling', 'original'], says: 'dreamy, intuitive and kind' },
};
const GRAHA: Record<string, { t: [Trait, Trait]; says: string }> = {
  Sun: { t: ['bold', 'expressive'], says: 'confident and radiant' }, Moon: { t: ['feeling', 'loyal'], says: 'gentle and nurturing' },
  Mars: { t: ['bold', 'builder'], says: 'brave and energetic' }, Mercury: { t: ['curious', 'expressive'], says: 'quick and witty' },
  Jupiter: { t: ['wise', 'harmony'], says: 'generous and wise' }, Venus: { t: ['harmony', 'expressive'], says: 'loving and artistic' },
  Saturn: { t: ['builder', 'wise'], says: 'disciplined and patient' }, Rahu: { t: ['original', 'free'], says: 'unconventional and hungry for more' },
  Ketu: { t: ['wise', 'feeling'], says: 'mystical and inward' },
};
const ANIMAL: Record<string, { t: [Trait, Trait]; says: string }> = {
  Rat: { t: ['curious', 'original'], says: 'clever and resourceful' }, Ox: { t: ['builder', 'loyal'], says: 'steady and strong' },
  Tiger: { t: ['bold', 'free'], says: 'brave and fearless' }, Rabbit: { t: ['harmony', 'feeling'], says: 'gentle and graceful' },
  Dragon: { t: ['bold', 'expressive'], says: 'powerful and magnetic' }, Snake: { t: ['wise', 'feeling'], says: 'sleek, wise, intuitive' },
  Horse: { t: ['free', 'bold'], says: 'free-spirited and energetic' }, Goat: { t: ['harmony', 'feeling'], says: 'gentle and artistic' },
  Monkey: { t: ['curious', 'original'], says: 'playful and inventive' }, Rooster: { t: ['builder', 'expressive'], says: 'sharp, proud, hard-working' },
  Dog: { t: ['loyal', 'harmony'], says: 'loyal, honest, guards the pack' }, Pig: { t: ['loyal', 'harmony'], says: 'warm and generous' },
};
const ELEMENT: Record<string, { t: Trait; says: string }> = {
  Wood: { t: 'builder', says: 'growth, steady upward reach' }, Fire: { t: 'expressive', says: 'warmth and passion' },
  Earth: { t: 'loyal', says: 'grounded and dependable' }, Metal: { t: 'bold', says: 'strength and resolve' }, Water: { t: 'feeling', says: 'intuition and flow' },
};
const NUMBER: Record<number, { t: [Trait, Trait]; says: string }> = {
  1: { t: ['bold', 'original'], says: 'the leader' }, 2: { t: ['harmony', 'feeling'], says: 'the peacemaker' }, 3: { t: ['expressive', 'curious'], says: 'the communicator' },
  4: { t: ['builder', 'loyal'], says: 'the builder, someone people lean on' }, 5: { t: ['free', 'curious'], says: 'the adventurer' }, 6: { t: ['loyal', 'harmony'], says: 'the caretaker' },
  7: { t: ['wise', 'feeling'], says: 'the seeker' }, 8: { t: ['bold', 'builder'], says: 'the powerhouse' }, 9: { t: ['wise', 'harmony'], says: 'the humanitarian' },
  11: { t: ['feeling', 'original'], says: 'the intuitive' }, 22: { t: ['builder', 'wise'], says: 'the master builder' }, 33: { t: ['harmony', 'wise'], says: 'the healer' },
};
const NAWAL: Record<string, [Trait, Trait]> = {
  Imox: ['feeling', 'original'], "Iq'": ['expressive', 'curious'], "Aq'ab'al": ['original', 'bold'], "K'at": ['loyal', 'builder'], Kan: ['wise', 'bold'],
  Kame: ['wise', 'feeling'], Kej: ['bold', 'loyal'], "Q'anil": ['builder', 'expressive'], Toj: ['harmony', 'loyal'], "Tz'i": ['loyal', 'bold'],
  "B'atz'": ['expressive', 'original'], "E'": ['free', 'curious'], Aj: ['loyal', 'harmony'], Ix: ['feeling', 'bold'], "Tz'ikin": ['wise', 'free'],
  Ajmak: ['wise', 'harmony'], "No'j": ['wise', 'curious'], Tijax: ['bold', 'wise'], Kawok: ['loyal', 'harmony'], Ajpu: ['expressive', 'bold'],
};
const MANSION: [Trait, Trait][] = [
  ['bold', 'free'], ['builder', 'loyal'], ['expressive', 'harmony'], ['bold', 'loyal'], ['harmony', 'free'], ['bold', 'feeling'], ['loyal', 'harmony'],
  ['loyal', 'feeling'], ['wise', 'feeling'], ['builder', 'bold'], ['bold', 'free'], ['original', 'builder'], ['harmony', 'free'], ['loyal', 'harmony'],
  ['feeling', 'wise'], ['loyal', 'bold'], ['builder', 'loyal'], ['feeling', 'bold'], ['bold', 'builder'], ['builder', 'wise'], ['builder', 'free'],
  ['harmony', 'free'], ['free', 'feeling'], ['harmony', 'expressive'], ['loyal', 'feeling'], ['harmony', 'loyal'], ['builder', 'harmony'], ['builder', 'free'],
];
const ADVICE_TRAITS: Record<string, [Trait, Trait]> = {
  act: ['bold', 'builder'], build: ['builder', 'loyal'], slow: ['wise', 'feeling'], connect: ['harmony', 'loyal'], release: ['free', 'wise'],
};
const first = (s: string) => (s.match(/^[^.!?]+[.!?]/)?.[0] ?? s).trim();

export interface Voice { tradition: Tradition; trait: Trait; why: string }

/** Every trait each tradition gives this chart, with a plain reason. */
export function traitsByTradition(c: Chart): Record<Tradition, Voice[]> {
  const out = Object.fromEntries(ORDER.map((t) => [t, [] as Voice[]])) as Record<Tradition, Voice[]>;
  const add = (tradition: Tradition, traits: readonly Trait[], why: string) => {
    for (const trait of traits) if (!out[tradition].some((v) => v.trait === trait)) out[tradition].push({ tradition, trait, why });
  };
  const sun = c.western.planets.sun.sign, moon = c.moonSignOptions[0], rising = c.western.ascendant?.sign;
  add('western', SIGN[sun].t, `${sun} Sun: ${SIGN[sun].says}.`);
  add('western', SIGN[moon].t, `${moon} Moon: ${SIGN[moon].says}.`);
  if (rising) add('western', SIGN[rising].t, `${rising} Rising: ${SIGN[rising].says}.`);

  const vs = c.vedic.planets.sun.sign, vm = c.vedic.planets.moon.sign, nk = c.vedic.moonNakshatra, g = GRAHA[nk.lord];
  if (g) add('vedic', g.t, `Moon in ${nk.name}, ruled by ${nk.lord}: ${g.says}.`);
  add('vedic', SIGN[vm].t, `Sidereal ${vm} Moon: ${SIGN[vm].says}.`);
  add('vedic', SIGN[vs].t, `Sidereal ${vs} Sun: ${SIGN[vs].says}.`);

  const a = ANIMAL[c.chinese.animal], e = ELEMENT[c.chinese.element];
  if (a) add('chinese', a.t, `${c.chinese.element} ${c.chinese.animal}: ${a.says}.`);
  if (e) add('chinese', [e.t], `${c.chinese.element} element: ${e.says}.`);

  const n = NUMBER[c.numerology.lifePath];
  if (n) add('numerology', n.t, `Life path ${c.numerology.lifePath}: ${n.says}.`);

  const nw = NAWAL[c.tzolkin.daySign];
  if (nw) add('mayan', nw, `${c.tzolkin.label} (${c.tzolkin.english}): ${first(TZOLKIN_LINE[c.tzolkin.daySign] ?? '')}`);

  const night = NIGHT_MEANING[c.hawaiian.night - 1];
  if (night) add('hawaiian', ADVICE_TRAITS[night.advice] ?? ['wise', 'feeling'], night.born.split('. ').slice(0, 2).join('. ').replace(/\.?$/, '.'));

  const mi = c.islamic.mansion.index, m = MANSIONS[mi];
  if (m) add('islamic', MANSION[mi], `${m.name}, "${m.meaning}": ${first(m.born).replace(/^[^:]*:\s*/, '')}`);
  return out;
}

export interface ChartRead {
  headline: string;
  themes: { trait: Trait; count: number; voices: Voice[] }[];
  agree: Record<Tradition, boolean>;
  agreeCount: number;
  differs: { tradition: Tradition; traits: Trait[]; why: string }[];
}

export function chartRead(c: Chart): ChartRead {
  const by = traitsByTradition(c);
  const counts = new Map<Trait, Voice[]>();
  for (const t of ORDER) for (const v of by[t]) counts.set(v.trait, [...(counts.get(v.trait) ?? []), v]);
  // Most traditions first; ties broken by the order traits appear (stable, same chart → same read).
  const ranked = [...counts.entries()].sort((x, y) => y[1].length - x[1].length);
  const themes = ranked.filter(([, v]) => v.length >= 3).slice(0, 4);
  const shown = (themes.length >= 2 ? themes : ranked.slice(0, 3)).map(([trait, voices]) => ({ trait, count: voices.length, voices }));
  const core = shown.slice(0, 2).map((s) => s.trait);
  const agree = Object.fromEntries(ORDER.map((t) => [t, by[t].some((v) => core.includes(v.trait))])) as Record<Tradition, boolean>;
  const top3 = shown.slice(0, 3).map((s) => s.trait);
  const differs = ORDER.filter((t) => !agree[t]).map((t) => {
    const own = by[t].filter((v) => !top3.includes(v.trait));
    const pick = own.length ? own : by[t];
    return { tradition: t, traits: pick.slice(0, 2).map((v) => v.trait), why: pick[0]?.why ?? '' };
  });
  const [t1, t2, t3] = shown.map((s) => s.trait);
  const adjs = [t2, t3].filter(Boolean).map((t) => THEME[t!].adj);
  const lead = adjs.join(', ');
  const headline = `${/^[aeiou]/i.test(lead) ? 'An' : 'A'} ${lead} ${THEME[t1].noun}.`;
  return { headline, themes: shown, agree, agreeCount: ORDER.filter((t) => agree[t]).length, differs };
}

export const TRADITIONS = ORDER;
