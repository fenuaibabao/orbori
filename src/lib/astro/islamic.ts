/**
 * The Islamic voice: the 28 lunar mansions (manāzil al-qamar) that Arabic
 * almanacs used to time travel, trade, marriage and rest; the Hijri calendar;
 * and Abjad (ʿilm al-ḥurūf), where every Arabic letter has a number.
 *
 * The mansions are star groups, so the Moon's place among them is measured on
 * the sidereal zodiac (Lahiri), each mansion spanning 12°51′26″ from the start of
 * Aries. Meanings follow the classical attributions (al-Bīrūnī and the almanac
 * tradition), in Orbori's words.
 */
import * as A from 'astronomy-engine';
import type { Advice } from '../council/types';
import { SIGNS, type Sign } from './types';
import { norm360 } from './util';
import { lahiriAyanamsa } from './vedic';
import { bodyLongitude } from './western';

export interface Mansion { index: number; name: string; arabic: string; meaning: string; born: string; today: string; advice: Advice; polarity: number }

export const MANSIONS: Omit<Mansion, 'index'>[] = [
  { name: 'al-Sharaṭān', arabic: 'الشرطان', meaning: 'the two signs', born: 'The horns of the Ram: a starter who sets out first and asks directions later. Journeys and beginnings run through your life.', today: 'A mansion of setting out. Begin the journey, make the move; keep quarrels short.', advice: 'act', polarity: 0.4 },
  { name: 'al-Buṭayn', arabic: 'البطين', meaning: 'the little belly', born: 'The belly of the Ram: you find what is hidden and hold on to what you win. Patient, retentive, resourceful.', today: 'A mansion for finding and keeping. Search, secure, reconcile; nothing flashy.', advice: 'build', polarity: 0.3 },
  { name: 'al-Thurayyā', arabic: 'الثريا', meaning: 'the Pleiades', born: 'The Pleiades, the luckiest cluster in the sky: fortune favors you, especially in company and on the move.', today: 'The Pleiades: good fortune for almost everything. Travel, trade, launch, sail.', advice: 'act', polarity: 0.8 },
  { name: 'al-Dabarān', arabic: 'الدبران', meaning: 'the follower', born: 'The red eye of the Bull: intense, driven, hard to turn aside. You pursue, and you expect loyalty.', today: 'A fierce mansion of discord. Avoid new ventures and arguments; finish, don\'t start.', advice: 'slow', polarity: -0.6 },
  { name: 'al-Haqʿa', arabic: 'الهقعة', meaning: 'the white spot', born: 'The head of the Giant: you win favor from those in power and return from journeys with more than you left with.', today: 'A mansion of favor and homecoming. Ask the powerful; build; come home.', advice: 'connect', polarity: 0.5 },
  { name: 'al-Hanʿa', arabic: 'الهنعة', meaning: 'the brand', born: 'The mark on the neck: a hunter and a lover, sharp in pursuit of what you want.', today: 'A mansion for the hunt. Pursue what you want directly; love is favored, grudges are not.', advice: 'act', polarity: 0.3 },
  { name: 'al-Dhirāʿ', arabic: 'الذراع', meaning: 'the forearm', born: 'The outstretched arm of the Twins: gain through friendship. People open doors for you.', today: 'A mansion of gain and friendship. Reach out; travel and partnerships prosper.', advice: 'connect', polarity: 0.7 },
  { name: 'al-Nathra', arabic: 'النثرة', meaning: 'the gap', born: 'The nostrils of the Lion: affectionate and binding. You make bonds that hold.', today: 'A mansion of love and binding. Make the promise, seal the friendship, welcome the traveler.', advice: 'connect', polarity: 0.6 },
  { name: 'al-Ṭarf', arabic: 'الطرف', meaning: 'the glance', born: 'The eyes of the Lion: watchful and quick to judge. You see trouble coming before others do.', today: 'A mansion that hinders. Harvests and journeys suffer; keep still and keep watch.', advice: 'slow', polarity: -0.5 },
  { name: 'al-Jabha', arabic: 'الجبهة', meaning: 'the forehead', born: 'The brow of the Lion: strength, generosity and command. You build things that last and protect what is yours.', today: 'A mansion for strengthening. Build, fortify, show kindness; enemies lose their footing.', advice: 'build', polarity: 0.6 },
  { name: 'al-Zubra', arabic: 'الزبرة', meaning: 'the mane', born: 'The mane of the Lion: ambitious and far-ranging. Voyages and ventures reward you.', today: 'A mansion of voyages and gain. Set out, trade, strengthen the house.', advice: 'build', polarity: 0.5 },
  { name: 'al-Ṣarfa', arabic: 'الصرفة', meaning: 'the turn', born: 'The turning of the season: you change things, and weather changes well. Harvests follow you.', today: 'A mansion of turning. Harvest and plant; let what has run its course change course.', advice: 'release', polarity: 0.2 },
  { name: 'al-ʿAwwāʾ', arabic: 'العواء', meaning: 'the barker', born: 'The howler: benevolent, lucky in trade and travel, a freer of the stuck.', today: 'A mansion of benevolence and gain. Travel, trade, free what is bound.', advice: 'act', polarity: 0.6 },
  { name: 'al-Simāk', arabic: 'السماك', meaning: 'the unarmed one', born: 'Spica, the ear of grain: love that lasts and the touch that heals. Marriages and remedies are your gifts.', today: 'A mansion for love and healing. Tend the sick, tend the marriage; sail but do not plant.', advice: 'connect', polarity: 0.5 },
  { name: 'al-Ghafr', arabic: 'الغفر', meaning: 'the cover', born: 'The covering: discreet, deep, a finder of wells and buried things. You work beneath the surface.', today: 'A mansion for digging, not departing. Look for what is buried; postpone journeys and vows.', advice: 'slow', polarity: -0.2 },
  { name: 'al-Zubānā', arabic: 'الزبانى', meaning: 'the claws', born: 'The claws of the Scorpion: a defender and a redeemer, fierce on behalf of others.', today: 'A mansion that hinders journeys and contracts. Ransom and rescue are favored; everything else, wait.', advice: 'slow', polarity: -0.5 },
  { name: 'al-Iklīl', arabic: 'الإكليل', meaning: 'the crown', born: 'The crown of the Scorpion: fortune improves around you and bonds hold. A builder of lasting love.', today: 'A mansion for bettering fortune. Build, bind, strengthen; love made now endures.', advice: 'build', polarity: 0.6 },
  { name: 'al-Qalb', arabic: 'القلب', meaning: 'the heart', born: 'Antares, the heart of the Scorpion: passionate, strategic, not to be crossed. You feel everything at full strength.', today: 'A mansion of plots and discord. Guard your words and your allies; no new alliances today.', advice: 'slow', polarity: -0.6 },
  { name: 'al-Shawla', arabic: 'الشولة', meaning: 'the sting', born: 'The raised tail of the Scorpion: decisive, formidable, a closer of sieges.', today: 'A mansion for pressing an advantage, not for travel. Hold the line; don\'t set out.', advice: 'slow', polarity: -0.4 },
  { name: 'al-Naʿāʾim', arabic: 'النعائم', meaning: 'the ostriches', born: 'The ostriches at the river: a tamer of wild things, patient with what resists.', today: 'A mansion for taming. Discipline, training and hunting go well; wealth is restless.', advice: 'act', polarity: 0.3 },
  { name: 'al-Balda', arabic: 'البلدة', meaning: 'the district', born: 'The empty district: self-sufficient and productive. Harvests, buildings and journeys succeed under your hand.', today: 'A mansion of gain. Harvest, build, travel; what is finished can be ended cleanly.', advice: 'act', polarity: 0.5 },
  { name: 'Saʿd al-Dhābiḥ', arabic: 'سعد الذابح', meaning: 'the luck of the slaughterer', born: 'The first of the lucky stars: a healer and a liberator. You help people escape what holds them.', today: 'A lucky mansion for healing and escape. Free yourself from something; cures take hold.', advice: 'release', polarity: 0.4 },
  { name: 'Saʿd Bulaʿ', arabic: 'سعد بلع', meaning: 'the luck of the swallower', born: 'The swallower: you take in a great deal and recover quickly. Health and liberty are your themes.', today: 'A mansion of liberation and health. Loosen ties that bind; healing is favored.', advice: 'release', polarity: 0.2 },
  { name: 'Saʿd al-Suʿūd', arabic: 'سعد السعود', meaning: 'the luckiest of the lucky', born: 'The luckiest mansion of all: benevolent, beloved, favored in marriage and in company.', today: 'The luckiest mansion. Marry, make peace, gather allies; good fortune in all company.', advice: 'connect', polarity: 0.9 },
  { name: 'Saʿd al-Akhbiya', arabic: 'سعد الأخبية', meaning: 'the luck of the tents', born: 'The tents: protective and private, strong in defense and slow to forgive.', today: 'A mansion of hidden tents. Protect and fortify; messages go astray, so wait to send.', advice: 'slow', polarity: -0.3 },
  { name: 'al-Fargh al-Muqaddam', arabic: 'الفرغ المقدم', meaning: 'the first spout', born: 'The first spout of the bucket: a uniter. Love, partnership and the welcome of travelers come easily.', today: 'A mansion of union. Join, welcome, confirm what you are building together.', advice: 'connect', polarity: 0.6 },
  { name: 'al-Fargh al-Muʾakhkhar', arabic: 'الفرغ المؤخر', meaning: 'the second spout', born: 'The second spout: trade, harvest and healing increase under you. You make things grow.', today: 'A mansion of increase. Trade, harvest, heal; hold off on building.', advice: 'act', polarity: 0.5 },
  { name: 'Baṭn al-Ḥūt', arabic: 'بطن الحوت', meaning: 'the belly of the fish', born: 'The belly of the Fish: abundant and safe-traveling. Harvests and gains multiply, though treasures slip away if hoarded.', today: 'A mansion of abundance. Harvest, trade, travel safely; don\'t hoard.', advice: 'act', polarity: 0.7 },
];

const SPAN = 360 / 28;

export function mansionOf(siderealLongitude: number): Mansion {
  const index = Math.floor(norm360(siderealLongitude) / SPAN);
  return { index, ...MANSIONS[index] };
}

export function moonMansionAt(time: A.AstroTime): Mansion {
  return mansionOf(bodyLongitude(A.Body.Moon, time) - lahiriAyanamsa(time));
}

/** The zodiac sign a mansion begins in (sidereal), for element harmony. */
export const mansionSign = (index: number): Sign => SIGNS[Math.floor((index * SPAN) / 30)];

/* ───────────── Hijri calendar ───────────── */

export interface Hijri { day: number; month: number; monthName: string; year: number; label: string; weekday: string }

export function hijriDate(date: string, timeZone: string): Hijri {
  const d = new Date(`${date}T12:00:00Z`);
  const fmt = (cal: string) => new Intl.DateTimeFormat('en-u-ca-' + cal, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).formatToParts(d);
  let parts: Intl.DateTimeFormatPart[];
  try { parts = fmt('islamic-umalqura'); } catch { parts = fmt('islamic-civil'); }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const months = ['Muharram', 'Safar', 'Rabiʿ al-Awwal', 'Rabiʿ al-Thani', 'Jumada al-Ula', 'Jumada al-Akhira', 'Rajab', 'Shaʿban', 'Ramadan', 'Shawwal', 'Dhu al-Qaʿda', 'Dhu al-Hijja'];
  const monthNum = +new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', timeZone: 'UTC' }).format(d);
  const monthName = months[monthNum - 1] ?? get('month');
  const day = +get('day'), year = +get('year').replace(/\D/g, '');
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone }).format(d);
  return { day, month: monthNum, monthName, year, label: `${day} ${monthName} ${year} AH`, weekday };
}

/* ───────────── Abjad ───────────── */

const ABJAD: Record<string, number> = {
  'ا': 1, 'أ': 1, 'إ': 1, 'آ': 1, 'ب': 2, 'پ': 2, 'ج': 3, 'چ': 3, 'د': 4, 'ه': 5, 'ة': 5, 'و': 6, 'ؤ': 6, 'ز': 7, 'ژ': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ى': 10, 'ئ': 10, 'ك': 20, 'ک': 20, 'گ': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90, 'ق': 100,
  'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000,
};
const LETTER_ELEMENT: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  'ا': 'Fire', 'ه': 'Fire', 'ط': 'Fire', 'م': 'Fire', 'ف': 'Fire', 'ش': 'Fire', 'ذ': 'Fire',
  'د': 'Earth', 'ح': 'Earth', 'ل': 'Earth', 'ع': 'Earth', 'ر': 'Earth', 'خ': 'Earth', 'غ': 'Earth',
  'ج': 'Air', 'ز': 'Air', 'ك': 'Air', 'س': 'Air', 'ق': 'Air', 'ث': 'Air', 'ظ': 'Air',
  'ب': 'Water', 'و': 'Water', 'ي': 'Water', 'ن': 'Water', 'ص': 'Water', 'ت': 'Water', 'ض': 'Water',
};
const NORMALIZE: Record<string, string> = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ئ': 'ي', 'ؤ': 'و', 'پ': 'ب', 'چ': 'ج', 'ژ': 'ز', 'ک': 'ك', 'گ': 'ك' };

export const BURJ = [
  { arabic: 'الحمل', name: 'al-Ḥamal', sign: 'Aries' }, { arabic: 'الثور', name: 'al-Thawr', sign: 'Taurus' }, { arabic: 'الجوزاء', name: 'al-Jawzāʾ', sign: 'Gemini' },
  { arabic: 'السرطان', name: 'al-Saraṭān', sign: 'Cancer' }, { arabic: 'الأسد', name: 'al-Asad', sign: 'Leo' }, { arabic: 'السنبلة', name: 'al-Sunbula', sign: 'Virgo' },
  { arabic: 'الميزان', name: 'al-Mīzān', sign: 'Libra' }, { arabic: 'العقرب', name: 'al-ʿAqrab', sign: 'Scorpio' }, { arabic: 'القوس', name: 'al-Qaws', sign: 'Sagittarius' },
  { arabic: 'الجدي', name: 'al-Jady', sign: 'Capricorn' }, { arabic: 'الدلو', name: 'al-Dalw', sign: 'Aquarius' }, { arabic: 'الحوت', name: 'al-Ḥūt', sign: 'Pisces' },
] as const;
const SIGN_ELEMENT = ['Fire', 'Earth', 'Air', 'Water'] as const;

export interface Abjad {
  total: number;
  reduced: number;
  burj: (typeof BURJ)[number];
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  letters: { letter: string; value: number; element: string }[];
  elementCounts: Record<'Fire' | 'Earth' | 'Air' | 'Water', number>;
}

/** Abjad value of an Arabic name. Returns null if it has no Arabic letters. */
export function abjad(name: string): Abjad | null {
  const clean = name.replace(/[ً-ْٰـ\s]/g, '');
  const letters: Abjad['letters'] = [];
  const elementCounts = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const ch of clean) {
    const v = ABJAD[ch];
    if (!v) continue;
    const base = NORMALIZE[ch] ?? ch;
    const element = LETTER_ELEMENT[base] ?? 'Fire';
    letters.push({ letter: ch, value: v, element });
    elementCounts[element]++;
  }
  if (!letters.length) return null;
  const total = letters.reduce((s, l) => s + l.value, 0);
  let reduced = total;
  while (reduced > 9) reduced = String(reduced).split('').reduce((s, d) => s + +d, 0);
  const b = (total - 1) % 12;
  return { total, reduced, burj: BURJ[b], element: SIGN_ELEMENT[b % 4], letters, elementCounts };
}
