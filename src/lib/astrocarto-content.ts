/** Astrocartography meanings, in Orbori's words. */
import type { Angle, CartoPlanet } from './astro/astrocarto';

export const ANGLE_NAME: Record<Angle, string> = { ASC: 'Rising', DSC: 'Setting', MC: 'Overhead', IC: 'Underfoot' };
export const ANGLE_AREA: Record<Angle, string> = {
  ASC: 'how you feel in yourself and how you come across there',
  DSC: 'the people you meet and the partnerships that form there',
  MC: 'your work, reputation and how visible you are there',
  IC: 'home, family, roots and feeling settled there',
};
export const PLANET_GIFT: Record<CartoPlanet, string> = {
  Sun: 'confidence, vitality and being seen for who you are',
  Moon: 'comfort, feeling and a sense of belonging',
  Mercury: 'ideas, learning, talk and connections',
  Venus: 'love, beauty, pleasure and ease',
  Mars: 'drive, courage and heat, with some friction',
  Jupiter: 'luck, growth, generosity and open doors',
  Saturn: 'discipline and hard-won mastery; heavy but lasting',
  Uranus: 'surprise, freedom and sudden change',
  Neptune: 'dreams, art and spirit, with a risk of fog',
  Pluto: 'intensity, power and transformation',
};
/** The lines people usually seek out for travel, love and luck. */
export const BENEFIC: CartoPlanet[] = ['Venus', 'Jupiter', 'Sun'];
export const PLANET_COLOR: Record<CartoPlanet, string> = {
  Sun: '#F2C14E', Moon: '#ECE8F4', Mercury: '#8FC0F0', Venus: '#F6A7C1', Mars: '#E5604D',
  Jupiter: '#9EF0C8', Saturn: '#B9A27A', Uranus: '#63D2E8', Neptune: '#8A7BD1', Pluto: '#C46FA8',
};
export const lineMeaning = (p: CartoPlanet, a: Angle) => `${p} ${ANGLE_NAME[a].toLowerCase()}: ${PLANET_GIFT[p]}, coloring ${ANGLE_AREA[a]}.`;
