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

export function visionPrompt(kind: VisionKind, chart: Chart, look: Look = {}, place?: { label: string; planet: string }, twist?: string): string {
  const base = basePrompt(kind, chart, look, place);
  return twist ? `${base} This time: ${twist}.` : base;
}

function basePrompt(kind: VisionKind, chart: Chart, look: Look, place?: { label: string; planet: string }): string {
  const sun = chart.western.planets.sun.sign, moon = chart.moonSignOptions[0], rising = chart.western.ascendant?.sign ?? null;
  const signs = [sun, moon, rising].filter(Boolean) as Sign[];
  const moods = Array.from(new Set(signs.map((s) => ELEMENT_MOOD[ELEMENT_OF(s)]))).join('; ');
  const colors = palette(chart).join(', ');
  const skin = look.skin ? `${look.skin} skin` : 'skin tone left natural';
  switch (kind) {
    case 'outfit':
      return `A full outfit laid out as an overhead fashion flat lay on a plain warm backdrop, no person. Inspired by a ${sun} Sun (${SIGN_STYLE[sun]}), a ${moon} Moon (${SIGN_STYLE[moon]})${rising ? ` and ${rising} Rising (${SIGN_STYLE[rising]})` : ''}. Mood: ${moods}. Color story: ${colors}. Include shoes, a bag and one piece of jewelry. ${GUARD}`;
    case 'makeup':
      return `A close-up beauty portrait of an adult model with ${skin}, eyes softly open, showing a makeup look inspired by a ${sun} Sun and ${moon} Moon${rising ? ` with ${rising} Rising` : ''}: ${moods}. Palette: ${colors}. Show eyes, lips and glow clearly. Studio light, neutral background. ${GUARD}`;
    case 'nails':
      return `A close-up of an adult's hands with ${skin} resting on soft fabric, showing a set of manicured nails with nail art inspired by ${signs.join(', ')} energy (${moods}), using ${colors}. Each nail a little different, celestial details like tiny stars and moons. ${GUARD}`;
    case 'hair':
      return `An editorial hair portrait of an adult with ${skin} and ${look.hair ?? 'natural'} hair, styled for a ${sun} Sun and ${moon} Moon (${moods}), with accessories in ${colors}. Three-quarter view from behind and side so the style is the focus. ${GUARD}`;
    case 'lovestory': {
      const venus = chart.western.planets.venus.sign;
      const dsc = rising ? OPPOSITE(rising) : null;
      return `A romantic cinematic illustration of ${LOVE_SCENE[venus]}${dsc ? `, with a touch of ${LOVE_SCENE[dsc]}` : ''}, set in ${place?.label ?? 'a beautiful city'} with its real streets and light. Two adults shown only from behind or as soft silhouettes, faces never visible, ordinary modern clothes, gender and appearance left ambiguous. Warm, tender, hopeful mood. Color story: ${colors}. ${GUARD}`;
    }
    case 'getaway':
      return `A dreamy illustrated travel poster of ${place?.label ?? 'a beautiful city'} at golden hour, with its real landmarks and streets, painterly and luminous, a faint arc of stars across the sky. Color story: ${colors}. ${GUARD}`;
  }
}
