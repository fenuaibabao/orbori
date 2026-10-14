/** Plain-English meanings in the Orbori voice. */
import type { Sign } from './astro/types';

export const SIGN_GLYPH: Record<Sign, string> = {
  Aries: '♈︎', Taurus: '♉︎', Gemini: '♊︎', Cancer: '♋︎', Leo: '♌︎', Virgo: '♍︎',
  Libra: '♎︎', Scorpio: '♏︎', Sagittarius: '♐︎', Capricorn: '♑︎', Aquarius: '♒︎', Pisces: '♓︎',
};

const SIGN_CORE: Record<Sign, { vibe: string; need: string; look: string }> = {
  Aries: { vibe: 'go first and figure it out mid-air', need: 'action and a little danger', look: 'direct, bold, a bit impatient' },
  Taurus: { vibe: 'build things that last and enjoy them slowly', need: 'comfort, consistency and good snacks', look: 'calm, grounded, quietly expensive' },
  Gemini: { vibe: 'collect ideas, people and tabs', need: 'conversation and variety', look: 'quick, curious, funny' },
  Cancer: { vibe: 'lead with feelings and reason backward', need: 'safety and your people close', look: 'warm, protective, hard to read at first' },
  Leo: { vibe: 'shine on purpose and make it everyone\'s party', need: 'to be seen and appreciated', look: 'magnetic, generous, a little dramatic' },
  Virgo: { vibe: 'fix, refine and quietly carry the team', need: 'order and being useful', look: 'sharp, composed, helpful' },
  Libra: { vibe: 'make things fair and beautiful', need: 'harmony and good company', look: 'charming, polished, diplomatic' },
  Scorpio: { vibe: 'go deep or not at all', need: 'trust, privacy and intensity', look: 'intense, private, observant' },
  Sagittarius: { vibe: 'chase meaning and the next horizon', need: 'freedom and adventure', look: 'upbeat, blunt, adventurous' },
  Capricorn: { vibe: 'play the long game and win it', need: 'progress you can measure', look: 'capable, dry-humored, serious' },
  Aquarius: { vibe: 'question the rules and redesign them', need: 'independence and your weird people', look: 'original, cool, a little detached' },
  Pisces: { vibe: 'feel everything and turn it into art', need: 'softness, imagination and rest', look: 'dreamy, gentle, intuitive' },
};

export const westernExplain = {
  sun: (s: Sign) => `Your core self. You ${SIGN_CORE[s].vibe}.`,
  moon: (s: Sign) => `Your emotional wiring. To feel okay you need ${SIGN_CORE[s].need}.`,
  rising: (s: Sign) => `Your first impression. People read you as ${SIGN_CORE[s].look}.`,
  planet: (name: string, s: Sign) => `${name} in ${s} colors this part of you with ${SIGN_CORE[s].look.split(',')[0]} energy.`,
};

export const vedicExplain = {
  sun: (s: Sign, w: Sign) =>
    s === w
      ? `Same sign in both systems, so your core story is consistent: you ${SIGN_CORE[s].vibe}.`
      : `Vedic counts from the actual stars, which slides your Sun back to ${s}. Add a layer: you also ${SIGN_CORE[s].vibe}.`,
  moon: (s: Sign, w: Sign) =>
    s === w
      ? `Your Moon stays in ${s} here too. Emotionally you need ${SIGN_CORE[s].need}.`
      : `Vedic moves your Moon from ${w} to ${s}. Underneath, you also need ${SIGN_CORE[s].need}.`,
  lagna: (s: Sign) => `Your Vedic rising (lagna) sets the frame of your whole chart: ${SIGN_CORE[s].look}.`,
};

export const NAKSHATRA_LINE: Record<string, string> = {
  Ashwini: 'the healer-horseman: fast starts, quick recoveries.',
  Bharani: 'the bearer: intense, creative, unafraid of big feelings.',
  Krittika: 'the blade: sharp standards and a protective fire.',
  Rohini: 'the beloved: magnetic, artistic, loves beautiful things.',
  Mrigashira: 'the seeker: curious, restless, always following a scent.',
  Ardra: 'the storm: transformation through a good emotional rinse.',
  Punarvasu: 'the return of light: optimistic, forgiving, always bounces back.',
  Pushya: 'the nourisher: caring, steady, quietly lucky.',
  Ashlesha: 'the serpent: perceptive, strategic, a little hypnotic.',
  Magha: 'the throne: pride, legacy and a sense of ancestry.',
  'Purva Phalguni': 'the lounge: pleasure, romance and well-earned rest.',
  'Uttara Phalguni': 'the patron: loyal, generous, good at partnerships.',
  Hasta: 'the hand: skillful, witty, good with details.',
  Chitra: 'the jewel: stylish, inventive, built to make things.',
  Swati: 'the wind: independent, adaptable, hard to pin down.',
  Vishakha: 'the gateway: driven, focused, goal-obsessed.',
  Anuradha: 'the friendship star: devoted, loyal, great in groups.',
  Jyeshtha: 'the elder: protective, capable, secretly sensitive.',
  Mula: 'the root: digs to the bottom of everything.',
  'Purva Ashadha': 'the undefeated: persuasive and hard to discourage.',
  'Uttara Ashadha': 'the final victory: patient, principled, wins late.',
  Shravana: 'the listener: learns by listening, remembers everything.',
  Dhanishta: 'the drum: rhythm, wealth and a big presence.',
  Shatabhisha: 'the hundred healers: private, scientific, a little mystical.',
  'Purva Bhadrapada': 'the fire: idealistic, intense, two-sided.',
  'Uttara Bhadrapada': 'the deep: calm, wise, emotionally deep water.',
  Revati: 'the shepherd: gentle, protective, the last star of the cycle.',
};

export const ANIMAL_LINE: Record<string, string> = {
  Rat: 'Resourceful, fast and charming. You find the exit before anyone finds the problem.',
  Ox: 'Steady, strong and patient. You outwork everyone and never brag about it.',
  Tiger: 'Brave, magnetic and restless. You were born for the dramatic entrance.',
  Rabbit: 'Gentle, clever and lucky. You win by being impossible to dislike.',
  Dragon: 'Ambitious, gifted and loud about it. Main-character energy, officially.',
  Snake: 'Wise, private and elegant. You see the plot twist three chapters early.',
  Horse: 'Free, energetic and social. You need room to run and people to run with.',
  Goat: 'Creative, kind and sensitive. You make life softer for everyone around you.',
  Monkey: 'Witty, inventive and mischievous. Problems are just puzzles you haven\'t played yet.',
  Rooster: 'Confident, precise and honest. You notice what everyone else missed.',
  Dog: 'Loyal, fair and protective. Your friends would follow you anywhere.',
  Pig: 'Generous, warm and easygoing. You know how to enjoy a life.',
};

export const ELEMENT_LINE: Record<string, string> = {
  Wood: 'Wood adds growth and generosity.',
  Fire: 'Fire adds nerve and charisma.',
  Earth: 'Earth adds patience and reliability.',
  Metal: 'Metal adds focus and backbone.',
  Water: 'Water adds intuition and flow.',
};

export const LIFE_PATH_LINE: Record<number, string> = {
  1: 'The leader. Independent, original, allergic to waiting for permission.',
  2: 'The peacemaker. Intuitive, cooperative, the glue in every group.',
  3: 'The communicator. Creative, expressive, at your best with an audience.',
  4: 'The builder. Practical, loyal, you make dreams load-bearing.',
  5: 'The free spirit. Freedom, change, motion. Routine is your kryptonite.',
  6: 'The nurturer. Responsible, loving, everyone\'s safe place.',
  7: 'The seeker. Analytical, spiritual, happiest deep in a question.',
  8: 'The powerhouse. Ambitious, strategic, built for big rooms.',
  9: 'The humanitarian. Compassionate, wise, here to give back.',
  11: 'Master number 11: the intuitive. Sensitive antennae, big inspiration.',
  22: 'Master number 22: the master builder. Big visions made real.',
  33: 'Master number 33: the master teacher. Healing through service.',
};

export const TZOLKIN_LINE: Record<string, string> = {
  Imix: 'Crocodile: the primal mother. Nurturing, original, a starter of things.',
  "Ik'": 'Wind: breath and spirit. Expressive, quick, words are your medium.',
  "Ak'bal": 'Night: the dreamer. Inner depth, home and hidden light.',
  "K'an": 'Seed: growth and abundance. Patient, fertile, slow magic.',
  Chikchan: 'Serpent: life force. Instinct, passion and raw energy.',
  Kimi: 'Death: transformation. A bridge to ancestors and new beginnings.',
  "Manik'": 'Deer: the healer\'s hands. Generous, grounded, protective.',
  Lamat: 'Star: harmony and multiplication. You make things grow.',
  Muluk: 'Water: offering and emotion. Flowing, purifying, feeling.',
  Ok: 'Dog: loyalty and heart. Faithful friend, fierce protector.',
  Chuwen: 'Monkey: the artist-trickster. Play is how you think.',
  "Eb'": 'Road: the path of life. Destiny, service and long journeys.',
  "B'en": 'Reed: home and authority. Steady pillar of your circle.',
  Ix: 'Jaguar: earth magic. Intuitive, secretive, powerful at night.',
  Men: 'Eagle: vision. Ambitious, far-seeing, high-flying.',
  "Kib'": 'Owl: wisdom. Forgiving, reflective, an old soul.',
  "Kab'an": 'Earth: thought and movement. Ideas that move the world.',
  "Etz'nab'": 'Flint: truth. Sharp, decisive, cuts through illusion.',
  Kawak: 'Storm: renewal. Healing, family and dramatic weather.',
  Ajaw: 'Sun: the lord. Radiant, idealistic, a natural leader.',
};
