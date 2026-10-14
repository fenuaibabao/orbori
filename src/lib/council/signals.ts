import * as A from 'astronomy-engine';
import type { Chart, PlanetKey, Sign } from '../astro/types';
import { SIGNS } from '../astro/types';
import { ANIMALS } from '../astro/chinese';
import { reduce } from '../astro/numerology';
import { DAY_SIGNS, tzolkin } from '../astro/mayan';
import { bodyLongitude } from '../astro/western';
import { lahiriAyanamsa, nakshatra } from '../astro/vedic';
import { julianDayNumber, norm360, parseDate } from '../astro/util';
import type { Advice, SystemSignal } from './types';

const clamp = (x: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, x));

/** Small deterministic hash so copy varies by day but is stable for a given day. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pick = <T,>(arr: T[], seed: string) => arr[hash(seed) % arr.length];

/* ───────────── Western: transits to natal points ───────────── */

const T_BODIES: [string, A.Body, number, number][] = [
  // name, body, orb (deg), weight
  ['Moon', A.Body.Moon, 6, 0.55], ['Sun', A.Body.Sun, 3, 0.8], ['Mercury', A.Body.Mercury, 3, 0.85],
  ['Venus', A.Body.Venus, 3, 0.85], ['Mars', A.Body.Mars, 3, 0.9], ['Jupiter', A.Body.Jupiter, 2.5, 1],
  ['Saturn', A.Body.Saturn, 2.5, 1],
];
const ASPECTS: [string, number, number][] = [
  // verb, angle, nature (+ easy, - hard, 0 = depends on planet)
  ['conjoins', 0, 0], ['sextiles', 60, 0.6], ['squares', 90, -0.8], ['trines', 120, 0.9], ['opposes', 180, -0.7],
];
const NATAL: [PlanetKey | 'asc', string, number][] = [
  ['sun', 'Sun', 1], ['moon', 'Moon', 1], ['asc', 'Rising', 0.8], ['venus', 'Venus', 0.7],
  ['mercury', 'Mercury', 0.7], ['mars', 'Mars', 0.7],
];
const CONJ_NATURE: Record<string, number> = { Venus: 0.8, Jupiter: 0.9, Sun: 0.4, Mercury: 0.4, Moon: 0.3, Mars: -0.2, Saturn: -0.6 };
const PLANET_ADVICE: Record<string, Advice> = {
  Mercury: 'speak', Mars: 'act', Venus: 'connect', Jupiter: 'act', Saturn: 'build', Sun: 'act', Moon: 'connect',
};

const WESTERN_COPY: Record<Advice, string[]> = {
  speak: ['Your feelings come with subtitles today. Use them.', 'Words land clean. Send the text you drafted twice.', 'Say it plainly. People are actually listening.'],
  act: ['Momentum is on your side. Start before you feel ready.', 'Green light energy. Make the first move.', 'Bold is cheap today. Spend some.'],
  connect: ['Warmth is easy to give and get. Reach out.', 'Good day to be the one who texts first.', 'Soft power hours. Lead with charm.'],
  build: ['Slow, steady, serious. The boring work pays.', 'Structure is your friend today. Make a list, then obey it.'],
  slow: ['Friction in the sky. Pause before you hit send.', 'Pressure is real but temporary. Don\'t decide anything forever today.', 'Tension day. Pick your battles, then pick fewer.'],
  release: ['Something wants to end. Let it, gracefully.', 'Clear the clutter, literal and otherwise.'],
};

export function westernSignal(chart: Chart, when: Date, dateKey: string): SystemSignal {
  const time = A.MakeTime(when);
  let best: { score: number; text: string; advice: Advice; polarity: number; strength: number } | null = null;
  let net = 0;
  for (const [tName, body, orb, w] of T_BODIES) {
    const tLon = bodyLongitude(body, time);
    for (const [nKey, nName, nW] of NATAL) {
      const natal = nKey === 'asc' ? chart.western.ascendant : chart.western.planets[nKey];
      if (!natal) continue;
      if (tName === 'Moon' && nKey === 'moon') continue;
      for (const [verb, angle, nature0] of ASPECTS) {
        const sep = Math.abs(((tLon - natal.longitude + 540) % 360) - 180);
        const off = Math.abs(sep - angle);
        if (off > orb) continue;
        const nature = angle === 0 ? CONJ_NATURE[tName] ?? 0.2 : nature0;
        const strength = (1 - off / orb) * w * nW;
        net += nature * strength;
        const score = strength * (0.6 + Math.abs(nature) * 0.4);
        if (!best || score > best.score) {
          let advice = PLANET_ADVICE[tName];
          if (nature < -0.3) advice = tName === 'Saturn' ? 'build' : tName === 'Moon' ? 'slow' : 'slow';
          if (tName === 'Saturn' && nature < -0.5 && angle === 180) advice = 'release';
          best = {
            score, advice, polarity: nature, strength,
            text: `${tName} ${verb} your ${natal.sign} ${nName}`,
          };
        }
      }
    }
  }
  if (!best) {
    // No tight aspect: read the Moon's element against your Sun's.
    const moonSign = Math.floor(norm360(bodyLongitude(A.Body.Moon, time)) / 30);
    const sunSign = SIGNS.indexOf(chart.western.planets.sun.sign);
    const same = moonSign % 4 === sunSign % 4;
    const advice: Advice = same ? 'connect' : 'build';
    return {
      system: 'western', label: 'Western', advice, polarity: same ? 0.4 : 0.1, intensity: 0.3,
      headline: `Moon in ${SIGNS[moonSign]}, ${same ? 'your element' : 'a quiet sky'}`,
      body: pick(WESTERN_COPY[advice], dateKey + 'w'), basis: 'No tight transits',
    };
  }
  return {
    system: 'western', label: 'Western', advice: best.advice, polarity: clamp(best.polarity * 0.6 + net * 0.25),
    intensity: clamp(best.strength, 0, 1), headline: best.text, body: pick(WESTERN_COPY[best.advice], dateKey + 'w'),
    basis: best.text,
  };
}

/* ───────────── Vedic: Tara Bala + Chandrashtama ───────────── */

const TARAS: [string, Advice, number, string][] = [
  ['Janma', 'slow', -0.2, 'Your birth star returns. Sensitive day; keep it simple.'],
  ['Sampat', 'build', 0.7, 'A wealth star. Good for money moves and practical wins.'],
  ['Vipat', 'slow', -0.6, 'A danger star. Avoid big launches; double-check details.'],
  ['Kshema', 'connect', 0.6, 'A well-being star. Care for your people and yourself.'],
  ['Pratyak', 'slow', -0.5, 'An obstacle star. Draft it today, send it later.'],
  ['Sadhana', 'act', 0.8, 'An achievement star. Effort converts to results today.'],
  ['Naidhana', 'release', -0.8, 'The hardest star. End things, don\'t start them.'],
  ['Mitra', 'connect', 0.6, 'A friendly star. Allies show up when asked.'],
  ['Param Mitra', 'speak', 0.8, 'Your best-friend star. Ask for what you want.'],
];

export function vedicSignal(chart: Chart, when: Date): SystemSignal {
  const time = A.MakeTime(when);
  const sidMoon = norm360(bodyLongitude(A.Body.Moon, time) - lahiriAyanamsa(time));
  const today = nakshatra(sidMoon);
  const natal = chart.vedic.moonNakshatra;
  const count = ((today.index - natal.index + 27) % 27) + 1;
  const [tara, advice0, pol0, body0] = TARAS[(count - 1) % 9];
  const natalRashi = Math.floor(chart.vedic.planets.moon.longitude / 30);
  const moonRashi = Math.floor(sidMoon / 30);
  const chandrashtama = (moonRashi - natalRashi + 12) % 12 === 7;
  if (chandrashtama) {
    return {
      system: 'vedic', label: 'Vedic', advice: 'slow', polarity: -0.9, intensity: 0.95,
      headline: `Chandrashtama: Moon in your 8th from Moon`,
      body: 'The one day a month Vedic says lie low. No big decisions, no big fights.',
      basis: `Moon in ${SIGNS[moonRashi]} (sidereal), 8th from your ${SIGNS[natalRashi]} Moon`,
    };
  }
  return {
    system: 'vedic', label: 'Vedic', advice: advice0, polarity: pol0, intensity: 0.4 + Math.abs(pol0) * 0.5,
    headline: `Moon in ${today.name}: a ${tara} day for you`, body: body0,
    basis: `Tara ${((count - 1) % 9) + 1} of 9 from your ${natal.name} Moon`,
  };
}

/* ───────────── Chinese: day pillar vs birth year animal ───────────── */

const STEMS_ELEMENT = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
const SIX_HARMONY = ['Rat-Ox', 'Tiger-Pig', 'Rabbit-Dog', 'Dragon-Rooster', 'Snake-Monkey', 'Horse-Goat'];
const HARM = ['Rat-Goat', 'Ox-Horse', 'Tiger-Snake', 'Rabbit-Dragon', 'Dog-Rooster', 'Pig-Monkey'];
const pairIn = (list: string[], a: string, b: string) => list.includes(`${a}-${b}`) || list.includes(`${b}-${a}`);

/** Sexagenary day pillar for a civil date (index 0 = Jia Zi). */
export function dayPillar(date: string) {
  const { year, month, day } = parseDate(date);
  const idx = (((julianDayNumber(year, month, day) - 11) % 60) + 60) % 60;
  return { index: idx, animal: ANIMALS[idx % 12], element: STEMS_ELEMENT[idx % 10] };
}

export function chineseSignal(chart: Chart, date: string, dateKey: string): SystemSignal {
  const day = dayPillar(date);
  const me = chart.chinese.animal;
  const a = ANIMALS.indexOf(me);
  const b = ANIMALS.indexOf(day.animal);
  const diff = (b - a + 12) % 12;
  let rel: string, advice: Advice, polarity: number, body: string;
  if (diff === 0) {
    rel = 'your own animal'; advice = 'build'; polarity = 0.3;
    body = pick(['Mirror day. You are the vibe; set it on purpose.', 'Home-field advantage. Play your own game.'], dateKey + 'c');
  } else if (diff === 6) {
    rel = 'a clash'; advice = 'release'; polarity = -0.5;
    body = pick(['Clash energy, but clashes clear stale air. Be quick, be kind.', 'Opposites day. Let one thing go so the rest can move.'], dateKey + 'c');
  } else if (diff === 4 || diff === 8) {
    rel = 'your trine'; advice = 'act'; polarity = 0.8;
    body = pick(['Same team, different jersey. Everything clicks faster.', 'Your trine is up. Go for the thing.'], dateKey + 'c');
  } else if (pairIn(SIX_HARMONY, me, day.animal)) {
    rel = 'your secret friend'; advice = 'connect'; polarity = 0.8;
    body = 'Secret-friend day. Help arrives from an unexpected person.';
  } else if (pairIn(HARM, me, day.animal)) {
    rel = 'a harm pairing'; advice = 'slow'; polarity = -0.4;
    body = 'Small misunderstandings multiply. Re-read before replying.';
  } else {
    rel = 'neutral ground'; advice = 'build'; polarity = 0.1;
    body = 'Neutral sky. Good day to grind quietly.';
  }
  return {
    system: 'chinese', label: 'Chinese zodiac', advice, polarity, intensity: 0.3 + Math.abs(polarity) * 0.6,
    headline: `${chart.chinese.element} ${me} on a ${day.element} ${day.animal} day`, body,
    basis: `Day pillar ${day.element} ${day.animal}: ${rel}`,
  };
}

/* ───────────── Numerology: Personal Day ───────────── */

const PERSONAL_DAY: Record<number, [string, Advice, number, string]> = {
  1: ['the starter', 'act', 0.7, 'New-beginnings day. Plant one flag.'],
  2: ['the diplomat', 'connect', 0.4, 'Partnership day. Two heads, one plan.'],
  3: ['the talker', 'speak', 0.8, 'The universe is literally handing you the mic.'],
  4: ['the builder', 'build', 0.4, 'Foundations day. Unsexy, essential, satisfying.'],
  5: ['the wildcard', 'act', 0.6, 'Change is the plan. Say yes to the detour.'],
  6: ['the caretaker', 'connect', 0.5, 'Home and heart day. Feed someone, including you.'],
  7: ['the hermit', 'slow', -0.1, 'Inner-work day. Fewer tabs, more thoughts.'],
  8: ['the boss', 'build', 0.7, 'Power and money day. Negotiate like you mean it.'],
  9: ['the closer', 'release', 0, 'Completion day. Finish, forgive, file it away.'],
  11: ['the intuitive', 'speak', 0.5, 'Master day. Trust the hunch and say it out loud.'],
  22: ['the architect', 'build', 0.8, 'Master builder day. Think big, then make it real.'],
};

export function personalDay(birthDate: string, date: string) {
  const b = parseDate(birthDate);
  const t = parseDate(date);
  const r9 = (n: number) => { while (n > 9) n = String(n).split('').reduce((s, d) => s + +d, 0); return n; };
  const year = r9(r9(b.month) + r9(b.day) + r9(t.year));
  const month = r9(year + t.month);
  const day = reduce(month + r9(t.day));
  return { year, month, day: day === 33 ? 6 : day };
}

export function numerologySignal(chart: Chart, date: string): SystemSignal {
  const pd = personalDay(chart.input.date, date);
  const [name, advice, polarity, body] = PERSONAL_DAY[pd.day];
  return {
    system: 'numerology', label: 'Numerology', advice, polarity, intensity: 0.35 + Math.abs(polarity) * 0.5,
    headline: `Personal Day ${pd.day}: ${name}`, body,
    basis: `Personal Year ${pd.year}, Month ${pd.month}, Day ${pd.day} · Life Path ${chart.numerology.lifePath}`,
  };
}

/* ───────────── Mayan Tzolk'in: today's day sign vs your nawal ───────────── */

const SIGN_ADVICE: Advice[] = [
  'act', 'speak', 'slow', 'build', 'act', 'release', 'connect', 'build', 'connect', 'connect',
  'speak', 'act', 'build', 'slow', 'act', 'release', 'speak', 'release', 'connect', 'act',
];
const SIGN_LINE: string[] = [
  'Crocodile starts things. Begin.', 'Wind carries the word.', 'Night favors rest and home.', 'Seed days reward patience.',
  'Serpent brings raw energy.', 'Death days honor endings and ancestors.', 'Deer lends a helping hand.', 'Star days multiply what you tend.',
  'Water day: offer something.', 'Dog day: loyalty pays.', 'Monkey makes everything a little more fun.', 'The Road asks you to move.',
  'Reed guards the home.', 'Jaguar sharpens your instincts.', 'Eagle sees the big picture.', 'Owl brings wisdom and forgiveness.',
  'Earth day: ideas land.', 'Flint cuts away what is false.', 'Storm clears and renews.', 'Sun day: lead.',
];

export function mayanSignal(chart: Chart, date: string): SystemSignal {
  const today = tzolkin(date);
  const mine = chart.tzolkin;
  const ti = DAY_SIGNS.findIndex((s) => s.yucatec === today.daySign);
  const mi = DAY_SIGNS.findIndex((s) => s.yucatec === mine.daySign);
  const diff = (ti - mi + 20) % 20;
  let advice = SIGN_ADVICE[ti];
  let polarity = today.number <= 3 ? 0.3 : today.number <= 9 ? 0.5 : 0.6;
  let tail = '';
  if (diff === 0) { polarity = 0.9; advice = 'act'; tail = ' It\'s your nawal\'s day. Hard to lose.'; }
  else if (diff === 10) { polarity = -0.5; advice = 'slow'; tail = ' Your opposite sign rules today, so go gently.'; }
  return {
    system: 'mayan', label: "Mayan Tzolk'in", advice, polarity, intensity: 0.3 + today.number / 26 + (diff === 0 ? 0.3 : 0),
    headline: `Day ${today.label} meets your ${mine.label}`,
    body: SIGN_LINE[ti] + tail,
    basis: `${today.number} ${today.daySign} (${today.kicheName})`,
  };
}

export type { Sign };
