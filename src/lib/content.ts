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

/** K'iche' nawales (Chol Q'ij), keyed by K'iche' name. Orbori's own words, following the K'iche' tradition. */
export const TZOLKIN_LINE: Record<string, string> = {
  Imox: "Water and dreams. The unconscious, intuition and the left-handed genius who sees what others miss.",
  "Iq'": "Wind and breath. Spirit, voice and communication; you move ideas the way wind moves seeds.",
  "Aq'ab'al": "Dawn. The first light after the dark: new beginnings, fresh concepts and hope.",
  "K'at": "The net. Gathering, abundance and connection, and the knots you learn to untie.",
  Kan: "The feathered serpent. Power, wisdom and justice, the energy that rises up the spine.",
  Kame: "Death and rebirth. Close to the ancestors, a natural guide through endings and change.",
  Kej: "The deer. Strength, leadership and the four pillars that hold a community up.",
  "Q'anil": "The seed. Fertility, creation and abundance; whatever you plant tends to grow.",
  Toj: "The offering. Gratitude and repayment: you keep things in balance by giving back.",
  "Tz'i": "The dog. Loyalty, justice and authority; a fierce protector of fairness.",
  "B'atz'": "The thread. Weaver of time, art and creativity; you spin the story others live in.",
  "E'": "The road. Destiny, travel and the life path; you are always on your way somewhere.",
  Aj: "The cane. Home, family and harmony; the steady pillar people come back to.",
  Ix: "The jaguar. Mother Earth, magic and feminine power, fierce and deeply intuitive.",
  "Tz'ikin": "The bird. Vision, prosperity and messages between worlds; you see the big picture.",
  Ajmak: "Forgiveness. Wisdom earned through mistakes, and the gift of letting go.",
  "No'j": "Knowledge. Ideas, wisdom and good counsel; a natural thinker and problem-solver.",
  Tijax: "Obsidian. The healer's blade that cuts away what is false, and sometimes divides.",
  Kawok: "The storm. Community, family and healing; clearing the air so new life can grow.",
  Ajpu: "The sun. Spirit, divinity and the hunter's focus; a natural light for others.",
};

/** K'iche' number energies, 1 to 13: a rising and settling wave through each trecena. */
export const NUMBER_LINE: Record<number, string> = {
  1: 'new potential', 2: 'partnership and duality', 3: 'inner ideas taking shape', 4: 'stability and the physical',
  5: 'power and action', 6: 'balance through change', 7: 'the peak, full strength', 8: 'maturity and abundance',
  9: 'the feminine and the flow of life', 10: 'community and cooperation', 11: 'healing and resolving division',
  12: 'learning from experience', 13: 'spirit, ancestors and completion',
};
