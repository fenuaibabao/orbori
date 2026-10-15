/** Plain-English meanings for the "Go deeper" pages, in the Orbori voice. */

export const HOUSE_THEME = [
  '', 'self, body and first impressions', 'money, possessions and self-worth', 'communication, siblings and your neighborhood',
  'home, family and roots', 'creativity, romance and play', 'routines, health and daily work', 'partnerships and one-on-ones',
  'intimacy, shared resources and transformation', 'travel, beliefs and big ideas', 'career, reputation and public life',
  'friends, communities and hopes', 'the subconscious, rest and what you keep private',
];

export const PLANET_THEME: Record<string, string> = {
  Sun: 'your core identity', Moon: 'your emotional needs', Mercury: 'how you think and talk', Venus: 'how you love and what you value',
  Mars: 'how you chase things and fight', Jupiter: 'where luck and growth find you', Saturn: 'where you earn mastery the hard way',
  Uranus: 'where you rebel and innovate', Neptune: 'where you dream and dissolve', Pluto: 'where you transform',
  'North Node': 'the direction your soul is growing toward', 'Black Moon Lilith': 'your untamed, unapologetic side',
};

export const ASPECT_LINE: Record<string, string> = {
  conjunction: 'fused together: they act as one',
  sextile: 'easy teammates when you make the first move',
  square: 'productive friction that pushes you to grow',
  trine: 'natural flow: this comes easily to you',
  opposition: 'a tug-of-war you learn to balance',
};

export const ELEMENT_WEST: Record<string, string> = {
  Fire: 'drive, courage and spark', Earth: 'practicality and staying power', Air: 'ideas, words and connection', Water: 'feeling, intuition and empathy',
};
export const MODE_WEST: Record<string, string> = {
  Cardinal: 'starting things', Fixed: 'sticking with things', Mutable: 'adapting and changing course',
};

export const DASHA_LINE: Record<string, string> = {
  Ketu: 'a quiet, spiritual chapter of letting go and looking inward',
  Venus: 'a chapter of love, beauty, comfort and creative pleasure',
  Sun: 'a chapter of visibility, confidence and stepping into authority',
  Moon: 'a chapter of feelings, home, family and emotional growth',
  Mars: 'a chapter of energy, courage, competition and bold moves',
  Rahu: 'a hungry, ambitious chapter of big leaps and unusual paths',
  Jupiter: 'a chapter of growth, wisdom, teachers and good fortune',
  Saturn: 'a chapter of hard work, structure and earned rewards',
  Mercury: 'a chapter of learning, business, writing and wit',
};

export const PILLAR_ROLE = {
  year: 'Year pillar: your public face, ancestry and early life',
  month: 'Month pillar: career, parents and your working style',
  day: 'Day pillar: your true self (the Day Master) and your partner',
  hour: 'Hour pillar: your inner self, dreams and later life. Its animal is your "secret animal".',
};

export const DAY_MASTER_LINE: Record<string, string> = {
  'Yang Wood': 'the tall tree: upright, principled, always growing toward the light.',
  'Yin Wood': 'the vine and flower: flexible, graceful, finds a way around anything.',
  'Yang Fire': 'the sun: warm, generous, impossible to ignore.',
  'Yin Fire': 'the candle: focused, insightful, lights up one room perfectly.',
  'Yang Earth': 'the mountain: steady, protective, hard to move once decided.',
  'Yin Earth': 'the garden soil: nurturing, adaptable, helps everything grow.',
  'Yang Metal': 'the sword: decisive, just, built for big decisions.',
  'Yin Metal': 'the jewel: refined, precise, quietly valuable.',
  'Yang Water': 'the ocean: big-picture, restless, full of momentum.',
  'Yin Water': 'the rain and mist: intuitive, gentle, seeps into everything.',
};

export const MISSING_ELEMENT: Record<string, string> = {
  Wood: 'Missing Wood: growth and planning can stall. Traditionally balanced with green, plants and new projects.',
  Fire: 'Missing Fire: passion and visibility can run low. Traditionally balanced with red, sunlight and celebrations.',
  Earth: 'Missing Earth: grounding and routine can wobble. Traditionally balanced with yellow, cooking and steady habits.',
  Metal: 'Missing Metal: boundaries and decisions can blur. Traditionally balanced with white, structure and decluttering.',
  Water: 'Missing Water: rest and intuition can dry up. Traditionally balanced with blue and black, water and quiet time.',
};

export const PERSONAL_YEAR_LINE: Record<number, string> = {
  1: 'A fresh start. Plant seeds; this year sets the next nine.',
  2: 'Patience and partnership. Slow growth, deeper bonds.',
  3: 'Expression and joy. Create, socialize, be seen.',
  4: 'Foundations. Hard work now pays for years.',
  5: 'Change and freedom. Expect movement and say yes to new doors.',
  6: 'Home, love and responsibility. Care for your people.',
  7: 'Reflection and study. A quieter, wiser year.',
  8: 'Power and money. Ambition gets rewarded.',
  9: 'Completion. Finish, release and make room for the next cycle.',
};

export const NAME_NUMBER_ROLE = {
  expression: 'Expression: your natural talents and how you show up',
  soulUrge: 'Soul Urge: what your heart secretly wants',
  personality: 'Personality: the first impression you give',
};

export const CROSS_ROLE = {
  conception: 'Conception (below): your roots and the energy you came in with',
  destiny: 'Destiny (above): who you are growing into',
  left: 'Left side: your helpers and support',
  right: 'Right side: your challenges and teachers',
};

export const PINNACLE_LINE: Record<number, string> = {
  1: 'A period for independence and standing on your own. You learn to lead yourself.',
  2: 'A period for partnership, patience and diplomacy. Progress comes through others.',
  3: 'A period for creativity, expression and social life. Say it, make it, share it.',
  4: 'A period for building. Work, structure and discipline lay the ground for later.',
  5: 'A period of change, travel and freedom. Expect movement and many doors.',
  6: 'A period for home, family and responsibility. Love and duty grow together.',
  7: 'A period for study and inner life. Specialize, reflect, go deep.',
  8: 'A period for achievement, money and authority. Ambition is rewarded if it stays honest.',
  9: 'A period of completion and service. Give back, let go, widen the circle.',
  11: 'A period of inspiration and heightened intuition, with the nerves to match.',
  22: 'A period for building something larger than yourself, with practical vision.',
  33: 'A period for teaching and healing through compassion.',
};

export const CHALLENGE_LINE: Record<number, string> = {
  0: 'No single lesson: the challenge is choice itself, and using every gift wisely.',
  1: 'The lesson of self-reliance: standing up for yourself without steamrolling others.',
  2: 'The lesson of sensitivity: feeling deeply without taking everything personally.',
  3: 'The lesson of expression: sharing yourself instead of scattering or hiding.',
  4: 'The lesson of discipline: finishing, organizing and doing the unglamorous work.',
  5: 'The lesson of freedom: embracing change without becoming reckless.',
  6: 'The lesson of responsibility: caring for others without controlling them.',
  7: 'The lesson of trust: opening up and believing in something beyond the provable.',
  8: 'The lesson of power: handling money and authority without being ruled by them.',
};

export const KARMIC_DEBT_LINE: Record<number, string> = {
  13: '13/4: the debt of effort. Work that once was avoided must now be done steadily. Shortcuts fail; persistence frees you.',
  14: '14/5: the debt of freedom. Excess and restlessness are the trap; moderation and commitment are the way out.',
  16: '16/7: the debt of the ego. Sudden falls that rebuild you humbler and wiser; love and faith over pride.',
  19: '19/1: the debt of independence. Learning to accept help and to lead without dominating.',
};

export const LESSON_LINE: Record<number, string> = {
  1: 'initiative and self-confidence', 2: 'patience and cooperation', 3: 'self-expression and optimism', 4: 'discipline and follow-through',
  5: 'adaptability and healthy freedom', 6: 'responsibility and commitment', 7: 'reflection and trust', 8: 'handling money and authority', 9: 'compassion and letting go',
};

export const MOON_PHASE_LINE: Record<string, string> = {
  'New Moon': 'Born at the start of the cycle: instinctive, spontaneous, here to begin things, often without knowing why yet.',
  'Crescent Moon': 'Born as the light grows: eager, striving, pushing against the pull of the past to make something new.',
  'First Quarter': 'Born at the turning point: a builder and a fighter who acts first and reflects later.',
  'Gibbous Moon': 'Born as the Moon fills: a refiner and perfectionist, always asking how it could be better.',
  'Full Moon': 'Born in full light: relationship is the mirror; you see yourself most clearly through others.',
  'Disseminating Moon': 'Born as the light begins to wane: a teacher and sharer, here to pass on what you learn.',
  'Last Quarter': 'Born at the second turning point: a reformer who questions the old rules and rewrites them.',
  'Balsamic Moon': 'Born in the dark before the new cycle: an old soul, visionary and reflective, closing chapters for everyone.',
};

export const TRANSIT_PLANET: Record<string, { blend: string; easy: string; hard: string }> = {
  Pluto: { blend: 'is rebuilding this from the ground up, a years-long transformation', easy: 'is quietly empowering this', hard: 'is applying deep pressure here, forcing what is buried to surface' },
  Neptune: { blend: 'is dissolving the edges here; inspiration and confusion both', easy: 'is softening and inspiring this', hard: 'is fogging this; be careful what you believe right now' },
  Uranus: { blend: 'is shaking this awake with sudden change', easy: 'is opening a surprising new door here', hard: 'is disrupting this; expect the unexpected' },
  Saturn: { blend: 'is testing and maturing this, a season of hard-won structure', easy: 'is stabilizing this; steady effort pays', hard: 'is putting limits on this; patience and discipline get you through' },
  Jupiter: { blend: 'is expanding this; say yes', easy: 'is bringing luck and ease here', hard: 'is overdoing this; big is not always better' },
  Mars: { blend: 'is firing this up; act, but do not pick fights', easy: 'is giving this energy and courage', hard: 'is making this irritable; count to ten' },
  Sun: { blend: 'puts a spotlight on this today', easy: 'brightens this today', hard: 'puts this under a bit of strain today' },
};

export const NATAL_POINT_THEME: Record<string, string> = {
  ...{ Sun: 'your sense of self', Moon: 'your emotional life', Mercury: 'your mind and communication', Venus: 'your relationships and values', Mars: 'your drive', Jupiter: 'your growth and beliefs', Saturn: 'your responsibilities and structures' },
  Ascendant: 'how you meet the world', Midheaven: 'your career and public life',
};

export const FORTUNE_LINE = 'An ancient point where the Sun, Moon and Ascendant combine: where things tend to go right for you with little effort, and where luck feels at home.';

export const DIGNITY_LINE: Record<string, string> = {
  Exalted: 'at its strongest and happiest; its gifts come easily',
  Moolatrikona: 'in its root sign, strong and comfortable',
  'Own sign': 'at home and able to act freely',
  "Friend's sign": 'among friends, supported and effective',
  'Neutral sign': 'neither helped nor hindered',
  "Enemy's sign": 'in uncomfortable territory; its results take extra effort',
  Debilitated: 'at its weakest, a part of life that asks for humility and work (and often gives unexpected depth)',
};

export const GRAHA_THEME: Record<string, string> = {
  Sun: 'vitality, self and father', Moon: 'mind, feelings and mother', Mars: 'energy, courage and siblings', Mercury: 'intellect, speech and trade',
  Jupiter: 'wisdom, fortune and teachers', Venus: 'love, pleasure and the arts', Saturn: 'discipline, delay and lasting work',
  Rahu: 'obsession, ambition and the unfamiliar', Ketu: 'detachment, intuition and the past',
};

export const TITHI_LINE: Record<string, string> = {
  Shukla: 'Born in the bright half, as the Moon waxes: outward-moving, building, optimistic.',
  Krishna: 'Born in the dark half, as the Moon wanes: inward-moving, reflective, reducing things to what matters.',
};

export const SADE_SATI_LINE: Record<string, string> = {
  'rising (first phase)': 'Saturn is in the sign before your Moon: the first phase of Sade Sati, when pressure builds, mostly around money and family.',
  'peak (second phase)': 'Saturn is on your Moon: the peak of Sade Sati, the most demanding stretch, where emotional endurance and simple living carry you through.',
  'setting (third phase)': 'Saturn has passed your Moon: the final phase of Sade Sati, when the lessons settle and results start to arrive.',
};

export const TEN_GOD_LINE: Record<string, string> = {
  Friend: 'peers, siblings and allies; self-reliance and competition on equal terms',
  'Rob Wealth': 'rivals and close friends who share your resources; generosity and the risk of being taken advantage of',
  'Eating God': 'creativity, enjoyment, food and easy self-expression; talent that flows',
  'Hurting Officer': 'bold talent, rebellion and sharp speech; brilliance that chafes at rules',
  'Indirect Wealth': 'windfalls, enterprise and money that comes and goes; father, for some readers',
  'Direct Wealth': 'steady income, thrift and what you control; the spouse in a man\'s chart',
  'Seven Killings': 'pressure, discipline, danger and the authority you earn by force of will',
  'Direct Officer': 'status, duty, rules and recognition; the spouse in a woman\'s chart',
  'Indirect Resource': 'unconventional learning, intuition and solitude; mother, for some readers',
  'Direct Resource': 'support, education, protection and mother; what nourishes you',
};

export const TEN_GOD_GROUP: Record<string, string> = {
  Companion: 'your own element: identity, friends and competition',
  Output: 'what you produce: talent, expression and children',
  Wealth: 'what you control: money, goals and enterprise',
  Power: 'what controls you: career, authority and pressure',
  Resource: 'what feeds you: knowledge, support and mother',
};

export const INTERACTION_LINE: Record<string, string> = {
  clash: 'Clash: two branches in conflict. Movement, change and friction between the areas those pillars govern.',
  combination: 'Six Combination: two branches that attract and merge, producing a new element. Harmony and binding between those pillars.',
  harm: 'Harm: a subtle undermining between branches. Watch for hidden tension in those areas.',
  'three harmony': 'Three Harmony: a complete triangle of branches forming one strong element. A powerful, unified current in your chart.',
  'half three harmony': 'Half Three Harmony: two of the three harmony branches, with the central one present. A partial but real alliance.',
};

export const STAR_LINE: Record<string, string> = {
  Nobleman: 'The Nobleman star: helpful people appear when you need them, and trouble tends to resolve. The most prized star in BaZi.',
  'Academic star': 'The Academic star: a gift for study, writing and exams; learning comes naturally.',
  'Peach Blossom': 'The Peach Blossom star: charm, attraction and social magnetism, for better and occasionally for drama.',
};

export const LUCK_LINE = 'Luck pillars are ten-year chapters that bring a new stem and branch into your chart. Each is read by its Ten God: the relationship between its stem and your Day Master sets the theme of that decade.';
