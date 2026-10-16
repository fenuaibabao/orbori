/** Level rewards. Everyone earns them, free or Plus. Levels: 0 Stargazer, 1 Seer, 2 Mystic, 3 Oracle, 4 Celestial. */
export interface Reward { id: string; level: number; title: string; body: string }

export const REWARDS: Reward[] = [
  { id: 'themes', level: 1, title: 'Color themes', body: 'Dress Orbori in Dawn (plum and rose gold) or Moonlit (silver and midnight blue).' },
  { id: 'sigil-ring', level: 1, title: 'Gold sigil ring', body: 'A gold ring around your sigil wherever it appears.' },
  { id: 'card-designs', level: 2, title: 'Special share cards', body: 'Eclipse and Gold Leaf designs for every card you share.' },
  { id: 'week-recap', level: 2, title: 'Week in the stars', body: 'A weekly recap of your check-ins, scores, journal and learning, side by side.' },
  { id: 'hard-mode', level: 2, title: 'Hard mode', body: 'Term Quest against the clock, with every answer from the same tradition.' },
  { id: 'plus-month', level: 3, title: 'A month of Plus, free', body: 'Thirty days of Orbori Plus. Claim it whenever you like; it starts the day you claim.' },
  { id: 'level-badge', level: 3, title: 'Your level, shown to links', body: 'People you are linked with see your level beside your sigil.' },
  { id: 'founding', level: 4, title: 'Founding Celestial', body: 'A lifetime badge for reaching the top. It never goes away.' },
  { id: 'thank-you', level: 4, title: 'A note from the founder', body: 'A personal thank-you for walking the whole path.' },
  { id: 'early-access', level: 4, title: 'Early access', body: 'First in line for new features like The Cosmos and Cosmic Visions.' },
];

export const isUnlocked = (levelIndex: number, id: string) => levelIndex >= (REWARDS.find((r) => r.id === id)?.level ?? 99);

export const THEMES = [
  { id: 'night', name: 'Night', swatch: ['#060528', '#343e9f', '#d4a24c'], level: 0 },
  { id: 'dawn', name: 'Dawn', swatch: ['#1a0b24', '#7a3a63', '#f0a46a'], level: 1 },
  { id: 'moonlit', name: 'Moonlit', swatch: ['#050b16', '#2f5277', '#c9d6e6'], level: 1 },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];

export const CARD_STYLES = [
  { id: 'classic', name: 'Classic', level: 0 },
  { id: 'eclipse', name: 'Eclipse', level: 2 },
  { id: 'leaf', name: 'Gold Leaf', level: 2 },
] as const;
export type CardStyle = (typeof CARD_STYLES)[number]['id'];
