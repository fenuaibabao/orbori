/**
 * Cosmic Visions: image prompts built from a chart. Inspired by each tradition's
 * colors, elements and energies, never its garments, sacred objects or people.
 */
import { directionOf, signIndex } from './astro/mayan';
import type { Chart, Sign } from './astro/types';
import { SIGNS } from './astro/types';

export type VisionKind = 'outfit' | 'makeup' | 'nails' | 'hair' | 'getaway' | 'lovestory';
export const VISION_KINDS: { id: VisionKind; name: string; blurb: string; needsLook?: boolean }[] = [
  { id: 'outfit', name: 'Dress like your chart', blurb: 'An outfit built from your Sun, Moon and Rising, your elements and your colors.' },
  { id: 'makeup', name: 'Your cosmic makeup', blurb: 'A makeup look and palette for your Big Three.', needsLook: true },
  { id: 'nails', name: 'Nail art', blurb: 'A set of nails drawn from your signs and your nawal\'s colors.', needsLook: true },
  { id: 'hair', name: 'Hair', blurb: 'A hairstyle for your chart\'s mood.', needsLook: true },
  { id: 'getaway', name: 'Dream getaway', blurb: 'A city on your Venus, Jupiter or Sun line, painted as a travel poster.' },
  { id: 'lovestory', name: 'Your love story', blurb: 'The scene of love for your chart, from your Venus and your Descendant, set on your Venus line. The setting, not the person.' },
];

export const SKIN = ['very fair', 'fair', 'light', 'light medium', 'medium', 'tan', 'medium brown', 'brown', 'deep brown', 'very deep'] as const;
export const HAIR = ['straight', 'wavy', 'curly', 'coily', 'locs', 'braids', 'short cropped', 'shaved'] as const;
export interface Look { skin?: (typeof SKIN)[number]; hair?: (typeof HAIR)[number] }

const ELEMENT_OF = (s: Sign) => ['fire', 'earth', 'air', 'water'][SIGNS.indexOf(s) % 4];
const ELEMENT_MOOD: Record<string, string> = {
  fire: 'bold, warm and radiant', earth: 'grounded, tactile and refined', air: 'light, airy and clever', water: 'fluid, soft and dreamy',
};
const SIGN_STYLE: Record<Sign, string> = {
  Aries: 'sharp tailoring and a bright red accent', Taurus: 'luxurious textures and earthy greens', Gemini: 'playful mixed prints and lemon yellow',
  Cancer: 'soft layers and pearly silver', Leo: 'golden statement pieces and drama', Virgo: 'clean minimal lines and sage',
  Libra: 'romantic balance and blush pink', Scorpio: 'deep black and burgundy with mystery', Sagittarius: 'adventurous layers and deep purple',
  Capricorn: 'structured classics and charcoal', Aquarius: 'futuristic silhouettes and electric blue', Pisces: 'flowing sheer fabrics and sea-glass tones',
};
/** What each sign brings to romance, for the love story scene. */
const LOVE_SCENE: Record<Sign, string> = {
  Aries: 'a spontaneous late-night adventure', Taurus: 'a long candlelit dinner with good wine and flowers', Gemini: 'a lively bookshop and cafe date full of conversation',
  Cancer: 'cooking together in a warm kitchen', Leo: 'a glamorous rooftop evening with music', Virgo: 'a quiet morning market stroll',
  Libra: 'an art gallery opening and a dance', Scorpio: 'a moody hidden jazz bar', Sagittarius: 'a road trip at sunset',
  Capricorn: 'a classic elegant dinner overlooking the city', Aquarius: 'a stargazing night on a rooftop', Pisces: 'a walk along the water under the moon',
};
const skin = (look: Look) => (look.skin ? `${look.skin} skin` : 'skin tone left natural');
const OPPOSITE = (s: Sign) => SIGNS[(SIGNS.indexOf(s) + 6) % 12];

const CHINESE_COLOR: Record<string, string> = { Wood: 'leaf green', Fire: 'vermilion', Earth: 'ochre', Metal: 'white gold', Water: 'midnight blue' };
const DIRECTION_COLOR: Record<string, string> = { Red: 'deep red', White: 'ivory white', Black: 'onyx black', Yellow: 'maize yellow' };

/** Shared guardrails for every image. */
const GUARD = 'Contemporary, original design. Do not depict traditional, ceremonial or religious garments, sacred objects, headdresses, tribal patterns or cultural costume of any people. No text, letters, logos or zodiac glyphs. Tasteful, editorial photography quality.';

export function palette(chart: Chart): string[] {
  const dir = directionOf(signIndex(chart.tzolkin.daySign)).color;
  return [CHINESE_COLOR[chart.chinese.element], DIRECTION_COLOR[dir], chart.western.planets.sun.sign === 'Leo' ? 'gold' : 'antique gold'].filter(Boolean);
}

/** A different twist each time, so the same chart never paints the same picture twice. */
export const TWISTS: Record<VisionKind, string[]> = {
  outfit: ['styled for a summer evening out', 'styled for a crisp autumn day', 'styled for a cozy winter weekend', 'styled for a spring brunch', 'styled for a big night out', 'styled for travel day', 'styled for a creative workday', 'styled for a beach getaway'],
  makeup: ['soft and natural daytime version', 'bold evening version', 'dewy summer glow', 'graphic editorial liner', 'warm sunset tones', 'cool moonlit shimmer'],
  nails: ['short almond shape', 'long coffin shape', 'short square shape', 'oval shape with chrome accents', 'minimal negative-space design', 'glossy jelly finish'],
  hair: ['styled for a wedding guest', 'an everyday easy version', 'with a statement hair accessory', 'a sleek evening version', 'a playful festival version', 'soft and romantic'],
  getaway: ['at blue hour just after sunset', 'on a bright spring morning', 'in warm golden afternoon light', 'under a starry night sky', 'after a summer rain', 'in a festive season'],
  lovestory: ['on a rainy evening', 'at golden hour', 'on a starry night', 'on a lazy Sunday morning', 'in the first snow', 'on a warm summer night'],
};
export const pickTwist = (kind: VisionKind, rand = Math.random) => TWISTS[kind][Math.floor(rand() * TWISTS[kind].length)];

/** Which tradition paints the picture. 'all' blends them (the original Visions). */
export type Lens = 'all' | 'western' | 'vedic' | 'chinese' | 'numerology' | 'mayan' | 'hawaiian' | 'islamic';
export const LENSES: { id: Lens; name: string }[] = [
  { id: 'all', name: 'All seven, blended' },
  { id: 'western', name: 'Western astrology' },
  { id: 'vedic', name: 'Vedic (Indian) astrology' },
  { id: 'chinese', name: 'Chinese zodiac' },
  { id: 'numerology', name: 'Numerology' },
  { id: 'mayan', name: "Mayan calendar (Chol Q'ij)" },
  { id: 'hawaiian', name: 'Hawaiian moon calendar' },
  { id: 'islamic', name: 'Arabic lunar mansions' },
];
export const isLens = (x: unknown): x is Lens => LENSES.some((l) => l.id === x);

const SIGN_COLOR: Record<Sign, string> = {
  Aries: 'scarlet', Taurus: 'moss green', Gemini: 'lemon yellow', Cancer: 'pearl silver', Leo: 'gold', Virgo: 'sage',
  Libra: 'blush pink', Scorpio: 'burgundy', Sagittarius: 'deep purple', Capricorn: 'charcoal', Aquarius: 'electric blue', Pisces: 'sea-glass green',
};
/** The nine grahas and the colors of their traditional gemstones. */
const GRAHA: Record<string, { color: string; mood: string }> = {
  Sun: { color: 'ruby red', mood: 'radiant and confident' }, Moon: { color: 'pearl white', mood: 'gentle and nurturing' },
  Mars: { color: 'coral', mood: 'brave and energetic' }, Mercury: { color: 'emerald green', mood: 'quick and witty' },
  Jupiter: { color: 'saffron yellow', mood: 'generous and expansive' }, Venus: { color: 'diamond shimmer', mood: 'lush and romantic' },
  Saturn: { color: 'sapphire blue', mood: 'disciplined and timeless' }, Rahu: { color: 'honey amber', mood: 'magnetic and unconventional' },
  Ketu: { color: "smoky cat's-eye green", mood: 'mystical and minimal' },
};
const ANIMAL_MOOD: Record<string, string> = {
  Rat: 'clever and resourceful', Ox: 'steady and strong', Tiger: 'bold and fearless', Rabbit: 'soft and graceful', Dragon: 'powerful and lucky',
  Snake: 'sleek and wise', Horse: 'free-spirited and energetic', Goat: 'gentle and artistic', Monkey: 'playful and inventive',
  Rooster: 'sharp and proud', Dog: 'loyal and honest', Pig: 'warm and generous',
};
const ELEMENT_COLORS: Record<string, string[]> = {
  Wood: ['leaf green', 'teal'], Fire: ['vermilion', 'warm gold'], Earth: ['ochre', 'terracotta'], Metal: ['white gold', 'silver'], Water: ['midnight blue', 'ink black'],
};
const NUMBER_STYLE: Record<number, { colors: string[]; mood: string }> = {
  1: { colors: ['red', 'gold'], mood: 'bold, independent, a leader' }, 2: { colors: ['soft peach', 'cream'], mood: 'gentle, harmonious, romantic' },
  3: { colors: ['sunny yellow', 'coral'], mood: 'joyful, creative, expressive' }, 4: { colors: ['forest green', 'camel'], mood: 'grounded, practical, polished' },
  5: { colors: ['turquoise', 'bright orange'], mood: 'adventurous, free, playful' }, 6: { colors: ['rose pink', 'sky blue'], mood: 'loving, warm, homey' },
  7: { colors: ['indigo', 'silver'], mood: 'quiet, thoughtful, mysterious' }, 8: { colors: ['black', 'deep gold'], mood: 'powerful, luxurious, ambitious' },
  9: { colors: ['crimson', 'lavender'], mood: 'wise, compassionate, worldly' }, 11: { colors: ['iridescent silver', 'violet'], mood: 'intuitive and visionary' },
  22: { colors: ['deep green', 'bronze'], mood: 'masterful, built to last' }, 33: { colors: ['soft gold', 'white'], mood: 'kind, healing, luminous' },
};
const ANAHULU_STYLE: Record<string, { colors: string[]; mood: string }> = {
  'Hoʻonui': { colors: ['dawn pink', 'ocean blue', 'silver'], mood: 'growing, hopeful, fresh' },
  Poepoe: { colors: ['full-moon silver', 'warm sand', 'deep ocean blue'], mood: 'abundant, glowing, full' },
  'Hoʻēmi': { colors: ['twilight violet', 'sea-glass', 'soft charcoal'], mood: 'calm, reflective, restful' },
};
const MANSION_COLORS = [['night indigo', 'lantern gold'], ['desert rose', 'sand'], ['turquoise', 'brass'], ['midnight blue', 'pearl']];

/** The colors and mood one tradition gives this chart, plus a short line saying where they came from. */
export function lensStyle(lens: Lens, chart: Chart): { from: string; moods: string; colors: string[] } | null {
  switch (lens) {
    case 'western': {
      const sun = chart.western.planets.sun.sign, moon = chart.moonSignOptions[0], rising = chart.western.ascendant?.sign;
      const signs = [sun, moon, rising].filter(Boolean) as Sign[];
      return { from: `Western astrology: ${sun} Sun, ${moon} Moon${rising ? `, ${rising} Rising` : ''}`, moods: [...new Set(signs.map((s) => ELEMENT_MOOD[ELEMENT_OF(s)]))].join('; '), colors: [...new Set(signs.map((s) => SIGN_COLOR[s]))] };
    }
    case 'vedic': {
      const n = chart.vedic.moonNakshatra, g = GRAHA[n.lord] ?? GRAHA.Moon;
      const moon = chart.vedic.planets.moon.sign, sun = chart.vedic.planets.sun.sign;
      return { from: `Vedic astrology: Moon in ${n.name} (ruled by ${n.lord}), sidereal ${sun} Sun and ${moon} Moon`, moods: g.mood, colors: [g.color, SIGN_COLOR[moon], 'saffron'] };
    }
    case 'chinese': {
      const c = chart.chinese;
      return { from: `the Chinese zodiac: ${c.element} ${c.animal}, ${c.polarity}`, moods: `${ANIMAL_MOOD[c.animal] ?? 'spirited'}; ${c.polarity === 'Yang' ? 'bright and outgoing' : 'soft and inward'}`, colors: ELEMENT_COLORS[c.element] };
    }
    case 'numerology': {
      const n = chart.numerology.lifePath, st = NUMBER_STYLE[n] ?? NUMBER_STYLE[7];
      return { from: `numerology: life path ${n}`, moods: st.mood, colors: st.colors };
    }
    case 'mayan': {
      const t = chart.tzolkin, d = directionOf(signIndex(t.daySign));
      return { from: `the Mayan calendar (Chol Q'ij): ${t.label}, ${t.english}, the ${d.direction.toLowerCase()} direction`, moods: `the energy of ${t.english.toLowerCase()}, number ${t.number}`, colors: [DIRECTION_COLOR[d.color], 'jade green', 'maize gold'] };
    }
    case 'hawaiian': {
      const h = chart.hawaiian, st = ANAHULU_STYLE[h.anahulu] ?? ANAHULU_STYLE.Poepoe;
      return { from: `the Hawaiian moon calendar: born on ${h.name}, night ${h.night} of the moon`, moods: st.mood, colors: st.colors };
    }
    case 'islamic': {
      const m = chart.islamic.mansion;
      return { from: `the Arabic lunar mansions: ${m.name} (${m.meaning})`, moods: `the feeling of ${m.meaning.toLowerCase()}, a calm desert night`, colors: MANSION_COLORS[m.index % MANSION_COLORS.length] };
    }
    default: return null;
  }
}

export function visionPrompt(kind: VisionKind, chart: Chart, look: Look = {}, place?: { label: string; planet: string }, twist?: string, lens: Lens = 'all'): string {
  const base = basePrompt(kind, chart, look, place, lensStyle(lens, chart));
  return twist ? `${base} This time: ${twist}.` : base;
}

function basePrompt(kind: VisionKind, chart: Chart, look: Look, place?: { label: string; planet: string }, ls?: ReturnType<typeof lensStyle>): string {
  const sun = chart.western.planets.sun.sign, moon = chart.moonSignOptions[0], rising = chart.western.ascendant?.sign ?? null;
  const signs = [sun, moon, rising].filter(Boolean) as Sign[];
  const moods = ls?.moods ?? Array.from(new Set(signs.map((s) => ELEMENT_MOOD[ELEMENT_OF(s)]))).join('; ');
  const colors = (ls?.colors ?? palette(chart)).join(', ');
  // One tradition chosen: describe the look from that tradition only.
  if (ls) {
    const insp = `Inspired by ${ls.from}. Mood: ${moods}. Color story: ${colors}.`;
    switch (kind) {
      case 'outfit': return `A full outfit laid out as an overhead fashion flat lay on a plain warm backdrop, no person. ${insp} Include shoes, a bag and one piece of jewelry. ${GUARD}`;
      case 'makeup': return `A close-up beauty portrait of an adult model with ${skin(look)}, eyes softly open, showing a makeup look. ${insp} Show eyes, lips and glow clearly. Studio light, neutral background. ${GUARD}`;
      case 'nails': return `A close-up of an adult's hands with ${skin(look)} resting on soft fabric, showing a set of manicured nails with nail art. ${insp} Each nail a little different, celestial details like tiny stars and moons. ${GUARD}`;
      case 'hair': return `An editorial hair portrait of an adult with ${skin(look)} and ${look.hair ?? 'natural'} hair, with accessories. ${insp} Three-quarter view from behind and side so the style is the focus. ${GUARD}`;
      case 'getaway': return `A dreamy illustrated travel poster of ${place?.label ?? 'a beautiful city'} at golden hour, with its real landmarks and streets, painterly and luminous, a faint arc of stars across the sky. Mood: ${moods}. Color story: ${colors}. ${GUARD}`;
      case 'lovestory': return `A romantic cinematic illustration of a date in ${place?.label ?? 'a beautiful city'} with its real streets and light. Mood: ${moods}. Two adults shown only from behind or as soft silhouettes, faces never visible, ordinary modern clothes, gender and appearance left ambiguous. Warm, tender, hopeful. Color story: ${colors}. ${GUARD}`;
    }
  }
  const skinTone = skin(look);
  switch (kind) {
    case 'outfit':
      return `A full outfit laid out as an overhead fashion flat lay on a plain warm backdrop, no person. Inspired by a ${sun} Sun (${SIGN_STYLE[sun]}), a ${moon} Moon (${SIGN_STYLE[moon]})${rising ? ` and ${rising} Rising (${SIGN_STYLE[rising]})` : ''}. Mood: ${moods}. Color story: ${colors}. Include shoes, a bag and one piece of jewelry. ${GUARD}`;
    case 'makeup':
      return `A close-up beauty portrait of an adult model with ${skinTone}, eyes softly open, showing a makeup look inspired by a ${sun} Sun and ${moon} Moon${rising ? ` with ${rising} Rising` : ''}: ${moods}. Palette: ${colors}. Show eyes, lips and glow clearly. Studio light, neutral background. ${GUARD}`;
    case 'nails':
      return `A close-up of an adult's hands with ${skinTone} resting on soft fabric, showing a set of manicured nails with nail art inspired by ${signs.join(', ')} energy (${moods}), using ${colors}. Each nail a little different, celestial details like tiny stars and moons. ${GUARD}`;
    case 'hair':
      return `An editorial hair portrait of an adult with ${skinTone} and ${look.hair ?? 'natural'} hair, styled for a ${sun} Sun and ${moon} Moon (${moods}), with accessories in ${colors}. Three-quarter view from behind and side so the style is the focus. ${GUARD}`;
    case 'lovestory': {
      const venus = chart.western.planets.venus.sign;
      const dsc = rising ? OPPOSITE(rising) : null;
      return `A romantic cinematic illustration of ${LOVE_SCENE[venus]}${dsc ? `, with a touch of ${LOVE_SCENE[dsc]}` : ''}, set in ${place?.label ?? 'a beautiful city'} with its real streets and light. Two adults shown only from behind or as soft silhouettes, faces never visible, ordinary modern clothes, gender and appearance left ambiguous. Warm, tender, hopeful mood. Color story: ${colors}. ${GUARD}`;
    }
    case 'getaway':
      return `A dreamy illustrated travel poster of ${place?.label ?? 'a beautiful city'} at golden hour, with its real landmarks and streets, painterly and luminous, a faint arc of stars across the sky. Color story: ${colors}. ${GUARD}`;
  }
}
