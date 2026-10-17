import * as A from 'astronomy-engine';
import type { Chart, PlanetKey, Sign } from '../astro/types';
import { SIGNS } from '../astro/types';
import { ANIMALS } from '../astro/chinese';
import { reduce } from '../astro/numerology';
import { signIndex, tzolkin } from '../astro/mayan';
import { moonNight } from '../astro/hawaiian';
import { ANAHULU_LINE, NIGHT_MEANING } from '../astro/hawaiian-content';
import { hijriDate, moonMansionAt } from '../astro/islamic';
import { NUMBER_LINE } from '../content';
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
/** "Kej day: stand tall…" → "Stand tall…" */
const afterColon = (line: string) => { const i = line.indexOf(': '); const t = i >= 0 ? line.slice(i + 2) : line; return t.charAt(0).toUpperCase() + t.slice(1); };

/** Plain headlines by advice, used where a tradition has no headline of its own. */
const HEAD: Record<Advice, string[]> = {
  speak: ['Say what you mean', 'Your words carry today', 'Speak up'],
  act: ['Make your move', 'A green-light day', 'Go for it'],
  connect: ['Reach out to someone', 'A warm, easy day', 'Lean on your people'],
  build: ['Steady effort pays off', 'Put in the work', 'Keep your head down'],
  slow: ['Take it slow', 'Pause before you react', 'Rest, don\'t launch'],
  release: ['Let something go', 'Clear the decks', 'Wrap things up'],
};

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

const PLANET_PLAIN: Record<string, string> = {
  Moon: 'The Moon, which sets the day\'s mood,', Sun: 'The Sun, the day\'s main light,', Mercury: 'Mercury, the planet of talk and texts,',
  Venus: 'Venus, the planet of love and charm,', Mars: 'Mars, the planet of drive,', Jupiter: 'Jupiter, the planet of luck and growth,',
  Saturn: 'Saturn, the planet of hard work,',
};
const NATAL_PLAIN: Record<string, string> = {
  Sun: 'your Sun (your core self)', Moon: 'your Moon (your emotional side)', Rising: 'your Rising sign (how you come across)',
  Venus: 'your Venus (how you love)', Mercury: 'your Mercury (how you think and talk)', Mars: 'your Mars (how you go after things)',
};
const VERB_PLAIN: Record<string, string> = {
  conjoins: 'is sitting right on', sextiles: 'is at a helpful angle to', trines: 'is at an easy, flowing angle to',
  squares: 'is at a tense angle to', opposes: 'is pulling against',
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
  let best: { score: number; text: string; plain: string; advice: Advice; polarity: number; strength: number } | null = null;
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
            plain: `${PLANET_PLAIN[tName]} ${VERB_PLAIN[verb]} ${NATAL_PLAIN[nName]}.`,
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
      system: 'western', label: 'Western astrology', advice, polarity: same ? 0.4 : 0.1, intensity: 0.3,
      headline: pick(HEAD[advice], dateKey + 'wh'),
      body: `No big planet moves touch your chart today. The Moon is in ${SIGNS[moonSign]}, ${same ? 'the same element as your Sun, so things flow' : 'a quiet sky for you'}. ${pick(WESTERN_COPY[advice], dateKey + 'w')}`,
      term: `Moon in ${SIGNS[moonSign]}`, basis: 'No tight transits',
    };
  }
  return {
    system: 'western', label: 'Western astrology', advice: best.advice, polarity: clamp(best.polarity * 0.6 + net * 0.25),
    intensity: clamp(best.strength, 0, 1), headline: pick(HEAD[best.advice], dateKey + 'wh'),
    body: `${best.plain} ${pick(WESTERN_COPY[best.advice], dateKey + 'w')}`,
    term: best.text, basis: best.text,
  };
}

/* ───────────── Vedic: Tara Bala + Chandrashtama ───────────── */

// [name, advice, polarity, plain headline, what kind of star it is, what to do]
const TARAS: [string, Advice, number, string, string, string][] = [
  ['Janma', 'slow', -0.2, 'A sensitive day', 'the star you were born under', 'Keep things simple.'],
  ['Sampat', 'build', 0.7, 'Good for money and practical wins', 'a "wealth" star', 'Make the practical move.'],
  ['Vipat', 'slow', -0.6, 'Go carefully today', 'a "danger" star', 'Avoid big launches and double-check details.'],
  ['Kshema', 'connect', 0.6, 'Look after yourself and your people', 'a "well-being" star', 'Care for the people close to you, including you.'],
  ['Pratyak', 'slow', -0.5, 'Expect a few obstacles', 'an "obstacle" star', 'Draft it today, send it later.'],
  ['Sadhana', 'act', 0.8, 'Effort turns into results', 'an "achievement" star', 'Work hard on the thing that matters.'],
  ['Naidhana', 'release', -0.8, 'End things, don\'t start them', 'the hardest star of the cycle', 'Finish or let go rather than begin.'],
  ['Mitra', 'connect', 0.6, 'Friends show up today', 'a "friend" star', 'Ask an ally for help.'],
  ['Param Mitra', 'speak', 0.8, 'Ask for what you want', 'your "best friend" star', 'Speak up; you\'re likely to be heard.'],
];

export function vedicSignal(chart: Chart, when: Date): SystemSignal {
  const time = A.MakeTime(when);
  const sidMoon = norm360(bodyLongitude(A.Body.Moon, time) - lahiriAyanamsa(time));
  const today = nakshatra(sidMoon);
  const natal = chart.vedic.moonNakshatra;
  const count = ((today.index - natal.index + 27) % 27) + 1;
  const [tara, advice0, pol0, head0, kind0, todo0] = TARAS[(count - 1) % 9];
  const natalRashi = Math.floor(chart.vedic.planets.moon.longitude / 30);
  const moonRashi = Math.floor(sidMoon / 30);
  const chandrashtama = (moonRashi - natalRashi + 12) % 12 === 7;
  if (chandrashtama) {
    return {
      system: 'vedic', label: 'Vedic (Indian) astrology', advice: 'slow', polarity: -0.9, intensity: 0.95,
      headline: 'Lie-low day',
      body: 'Once a month the Moon passes the touchiest spot in your chart. Skip big decisions and big fights today.',
      term: 'Chandrashtama · Moon 8th from your Moon',
      basis: `Moon in ${SIGNS[moonRashi]} (sidereal), 8th from your ${SIGNS[natalRashi]} Moon`,
    };
  }
  return {
    system: 'vedic', label: 'Vedic (Indian) astrology', advice: advice0, polarity: pol0, intensity: 0.4 + Math.abs(pol0) * 0.5,
    headline: head0,
    body: `Vedic astrology follows the Moon through 27 star groups. Counted from your birth star, today's Moon is on ${kind0}. ${todo0}`,
    term: `Moon in ${today.name} · ${tara} tara`,
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
  let rel: string, advice: Advice, polarity: number, body: string, headline: string;
  const da = day.animal;
  if (diff === 0) {
    rel = 'your own animal'; advice = 'build'; polarity = 0.3; headline = 'Home-field advantage';
    body = `Today is a ${da} day, the same animal as your birth year. ${pick(['You set the vibe today, so set it on purpose.', 'Play your own game.'], dateKey + 'c')}`;
  } else if (diff === 6) {
    rel = 'a clash'; advice = 'release'; polarity = -0.5; headline = 'A clashing day';
    body = `Today's animal, the ${da}, sits opposite your ${me} on the zodiac wheel. ${pick(['Clashes clear stale air, so be quick and be kind.', 'Let one thing go so the rest can move.'], dateKey + 'c')}`;
  } else if (diff === 4 || diff === 8) {
    rel = 'your trine'; advice = 'act'; polarity = 0.8; headline = 'Everything clicks today';
    body = `Today's animal, the ${da}, is on the same team as your ${me}. ${pick(['Things move faster than usual.', 'Go for the thing.'], dateKey + 'c')}`;
  } else if (pairIn(SIX_HARMONY, me, da)) {
    rel = 'your secret friend'; advice = 'connect'; polarity = 0.8; headline = 'Help from an unexpected place';
    body = `In the Chinese zodiac the ${da} is your ${me}'s "secret friend". Help can arrive from someone you don't expect.`;
  } else if (pairIn(HARM, me, da)) {
    rel = 'a harm pairing'; advice = 'slow'; polarity = -0.4; headline = 'Watch for misunderstandings';
    body = `The ${da} and your ${me} tend to rub each other the wrong way. Re-read before you reply.`;
  } else {
    rel = 'neutral ground'; advice = 'build'; polarity = 0.1; headline = 'A quiet, steady day';
    body = `Today's animal, the ${da}, neither helps nor clashes with your sign, the ${me}. Good for heads-down work.`;
  }
  return {
    system: 'chinese', label: 'Chinese zodiac', advice, polarity, intensity: 0.3 + Math.abs(polarity) * 0.6,
    headline, body,
    term: `${day.element} ${day.animal} day · you're a ${chart.chinese.element} ${me}`,
    basis: `Day pillar ${day.element} ${day.animal}: ${rel}`,
  };
}

/* ───────────── Numerology: Personal Day ───────────── */

const PERSONAL_DAY: Record<number, [string, Advice, number, string, string]> = {
  1: ['the starter', 'act', 0.7, 'Start something new', 'Plant one flag.'],
  2: ['the diplomat', 'connect', 0.4, 'Team up', 'Two heads, one plan.'],
  3: ['the talker', 'speak', 0.8, 'Speak up and share', 'The day is handing you the mic.'],
  4: ['the builder', 'build', 0.4, 'Lay the groundwork', 'Unglamorous, essential, satisfying.'],
  5: ['the wildcard', 'act', 0.6, 'Say yes to change', 'Take the detour.'],
  6: ['the caretaker', 'connect', 0.5, 'Take care of home and heart', 'Feed someone, including you.'],
  7: ['the hermit', 'slow', -0.1, 'Turn inward', 'Fewer tabs, more thinking.'],
  8: ['the boss', 'build', 0.7, 'Handle business', 'Money and power day. Negotiate like you mean it.'],
  9: ['the closer', 'release', 0, 'Wrap things up', 'Finish, forgive, file it away.'],
  11: ['the intuitive', 'speak', 0.5, 'Trust your hunch', 'Say it out loud.'],
  22: ['the architect', 'build', 0.8, 'Think big, build real', 'Then make it real.'],
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
  const [name, advice, polarity, head, line] = PERSONAL_DAY[pd.day];
  return {
    system: 'numerology', label: 'Numerology', advice, polarity, intensity: 0.35 + Math.abs(polarity) * 0.5,
    headline: head,
    body: `Add up your birthday and today's date and you get ${pd.day}, "${name}". ${line}`,
    term: `Personal Day ${pd.day} · Life Path ${chart.numerology.lifePath}`,
    basis: `Personal Year ${pd.year}, Month ${pd.month}, Day ${pd.day} · Life Path ${chart.numerology.lifePath}`,
  };
}

/* ───────────── Mayan Tzolk'in: today's day sign vs your nawal ───────────── */

// Index order: Imox, Iq', Aq'ab'al, K'at, Kan, Kame, Kej, Q'anil, Toj, Tz'i, B'atz', E', Aj, Ix, Tz'ikin, Ajmak, No'j, Tijax, Kawok, Ajpu
const SIGN_ADVICE: Advice[] = [
  'slow', 'speak', 'act', 'connect', 'act', 'release', 'build', 'build', 'release', 'speak',
  'act', 'act', 'connect', 'slow', 'act', 'release', 'speak', 'release', 'connect', 'act',
];
const SIGN_HEAD: string[] = [
  'Listen to your gut', 'Say what matters', 'Start fresh', 'Gather your people', 'Use your power fairly',
  'Honor an ending', 'A day to lead', 'Plant seeds', 'Give back', 'Stand up for what\'s fair',
  'Make something', 'Get moving', 'Tend your home', 'Trust your instincts', 'Zoom out',
  'Forgive someone', 'Think it through', 'Cut away what\'s false', 'Clear the air', 'Aim high',
];
const SIGN_LINE: string[] = [
  'Imox day: listen to your dreams and gut before you act.',
  "Iq' day: the wind carries your words. Say what matters.",
  "Aq'ab'al day: a fresh dawn. Start the thing you've been circling.",
  "K'at day: gather your people and resources, and untangle one knot.",
  'Kan day: your power and wisdom are switched on. Use them fairly.',
  'Kame day: honor an ending, or an ancestor. Something is being reborn.',
  'Kej day: stand tall and lead. Others are leaning on your strength.',
  "Q'anil day: plant seeds. What you start now wants to grow.",
  'Toj day: give back. Gratitude settles old debts, seen and unseen.',
  "Tz'i day: stand up for what's fair. Loyalty is noticed.",
  "B'atz' day: make something. Time and creativity are on your side.",
  "E' day: get moving. The road itself is the answer today.",
  'Aj day: tend your home and family. Harmony starts there.',
  'Ix day: trust your instincts and spend time with the Earth.',
  "Tz'ikin day: zoom out. A vision or a message is on its way.",
  'Ajmak day: forgive someone, starting with yourself.',
  "No'j day: think it through. Good counsel and ideas come easily.",
  'Tijax day: cut away what is false. Healing can sting first.',
  'Kawok day: clear the air with your people. Community heals.',
  'Ajpu day: aim high. Spirit and focus are with you.',
];

export function mayanSignal(chart: Chart, date: string): SystemSignal {
  const today = tzolkin(date);
  const mine = chart.tzolkin;
  const ti = signIndex(today.daySign);
  const mi = signIndex(mine.daySign);
  const diff = (ti - mi + 20) % 20;
  let advice = SIGN_ADVICE[ti];
  let polarity = today.number <= 3 ? 0.3 : today.number <= 9 ? 0.5 : 0.6;
  let tail = ` Its number, ${today.number}, stands for ${NUMBER_LINE[today.number]}.`;
  let headline = SIGN_HEAD[ti];
  if (diff === 0) { polarity = 0.9; advice = 'act'; headline = 'Your own sign\'s day'; tail += ' Today is your birth sign\'s day. Hard to lose.'; }
  else if (diff === 10) { polarity = -0.5; advice = 'slow'; headline = 'Go gently today'; tail += ' Your opposite sign rules today, so go gently.'; }
  return {
    system: 'mayan', label: "Mayan calendar (Chol Q'ij)", advice, polarity, intensity: 0.3 + today.number / 26 + (diff === 0 ? 0.3 : 0),
    headline,
    body: `In the 260-day Mayan calendar, today is ${today.daySign}, the ${today.english}. ${afterColon(SIGN_LINE[ti])}${tail}`,
    term: `${today.label} · you're ${mine.label}`,
    basis: `${today.label} (${today.english})`,
  };
}

export type { Sign };

/* ───────────── Hawaiian: tonight's moon (Kaulana Mahina) ───────────── */

const HAWAIIAN_HEAD: Record<Advice, string> = {
  speak: 'Share your news', act: 'Plant and begin', connect: 'Gather your people', build: 'Steady, quiet work', slow: 'Rest, don\'t launch', release: 'Let things go',
};

export function hawaiianSignal(chart: Chart, date: string, timeZone: string): SystemSignal {
  const tonight = moonNight(date, timeZone);
  const m = NIGHT_MEANING[tonight.night - 1];
  const same = tonight.night === chart.hawaiian.night;
  return {
    system: 'hawaiian', label: 'Hawaiian moon calendar', advice: m.advice, polarity: clamp(m.polarity + (same ? 0.2 : 0)),
    intensity: 0.35 + Math.abs(m.polarity) * 0.6,
    headline: same ? 'Your own birth night' : HAWAIIAN_HEAD[m.advice],
    body: `Every night of the Hawaiian moon calendar has a name; tonight is ${tonight.name}. ${afterColon(m.today).replace('ʻOle night', 'ʻOle ("nothing") night')}${same ? ' It\'s also the night you were born: the moon is on your side.' : ''}`,
    term: `${tonight.name}, night ${tonight.night} · ${tonight.month} moon`,
    basis: `${tonight.anahulu}, ${ANAHULU_LINE[tonight.anahulu]}`,
  };
}

/* ───────────── Islamic: the Moon's mansion and the Hijri day ───────────── */

export function islamicSignal(chart: Chart, when: Date, date: string, timeZone: string): SystemSignal {
  const mansion = moonMansionAt(A.MakeTime(when));
  const hijri = hijriDate(date, timeZone);
  const white = hijri.day >= 13 && hijri.day <= 15;
  const friday = hijri.weekday === 'Friday';
  const ramadan = hijri.month === 9;
  let polarity = mansion.polarity;
  let note = '';
  if (white) { polarity = clamp(polarity + 0.2); note = ' A white day, the bright middle of the Hijri month: blessings run high.'; }
  if (friday) { polarity = clamp(polarity + 0.1); note += ' Friday, the day of gathering.'; }
  if (ramadan) note += ' In Ramadan the whole month leans toward restraint and reflection.';
  const same = mansion.index === chart.islamic.mansion.index;
  return {
    system: 'islamic', label: 'Arabic lunar mansions', advice: mansion.advice, polarity, intensity: 0.35 + Math.abs(polarity) * 0.6,
    headline: same ? 'The Moon comes home to you' : pick(HEAD[mansion.advice], date + 'm'),
    body: `The Moon is in "${mansion.meaning}", one of 28 star stations in the old Arabic sky. ${mansion.today}${note}${same ? ' It\'s the same station the Moon was in when you were born.' : ''}`,
    term: `${mansion.name} · ${hijri.label}`,
    basis: `${hijri.label} · mansion ${mansion.index + 1} of 28`,
  };
}
