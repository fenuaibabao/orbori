/** Oracle Levels, streaks, XP and badges. Pure functions so they can move server-side later. */

export type Answer = 'nailed' | 'kinda' | 'nope';
export interface CheckIn { answer: Answer; score: number }

export const LEVELS = [
  { name: 'Stargazer', xp: 0 },
  { name: 'Seer', xp: 250 },
  { name: 'Mystic', xp: 800 },
  { name: 'Oracle', xp: 2000 },
  { name: 'Celestial', xp: 4500 },
] as const;

export const XP = { checkIn: 10, streak7: 50, streak30: 150, match: 25, challenge: 40 } as const;

const dayMs = 86400000;
const toDay = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / dayMs;

export interface Progress {
  xp: number;
  level: (typeof LEVELS)[number]['name'];
  levelIndex: number;
  nextLevel: { name: string; xp: number } | null;
  /** 0–1 progress toward next level */
  levelProgress: number;
  streak: number;
  bestStreak: number;
  checkIns: number;
  calledIt: number;
}

export function computeProgress(checkIns: Record<string, CheckIn>, today: string, extraXp = 0): Progress {
  const days = Object.keys(checkIns).sort();
  let xp = extraXp;
  let run = 0;
  let best = 0;
  let prev: number | null = null;
  let calledIt = 0;
  for (const d of days) {
    const n = toDay(d);
    run = prev !== null && n - prev === 1 ? run + 1 : 1;
    prev = n;
    best = Math.max(best, run);
    xp += XP.checkIn;
    if (run === 7) xp += XP.streak7;
    if (run === 30) xp += XP.streak30;
    if (checkIns[d].answer === 'nailed' && checkIns[d].score < 5) calledIt++;
  }
  // A streak stays alive until a full day is missed (today not checked in yet is fine).
  const last = prev;
  const t = toDay(today);
  const streak = last !== null && t - last <= 1 ? run : 0;

  let levelIndex = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) levelIndex = i;
  const next = LEVELS[levelIndex + 1] ?? null;
  const cur = LEVELS[levelIndex];
  return {
    xp,
    level: cur.name,
    levelIndex,
    nextLevel: next,
    levelProgress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1,
    streak,
    bestStreak: best,
    checkIns: days.length,
    calledIt,
  };
}

export interface Badge { id: string; name: string; how: string; earned: boolean; status: string; icon: string }

export function badges(p: Progress, opts: { mythic: boolean; matches: number }): Badge[] {
  return [
    { id: 'first-light', name: 'First Light', how: 'First check-in', earned: p.checkIns >= 1, status: p.checkIns >= 1 ? 'EARNED' : '0 / 1', icon: 'M3 18h18M7 18a5 5 0 0110 0M12 6v4M5 11l2 2M19 11l-2 2' },
    { id: 'seven-night', name: '7-Night Watch', how: '7-night streak', earned: p.bestStreak >= 7, status: p.bestStreak >= 7 ? 'EARNED' : `${Math.min(p.streak, 7)} / 7`, icon: 'M16 4a8 8 0 100 16a6.5 6.5 0 010-16z' },
    { id: 'called-it', name: 'Called It', how: '"Nailed it" on 5 low-convergence days', earned: p.calledIt >= 5, status: p.calledIt >= 5 ? 'EARNED' : `${p.calledIt} / 5`, icon: 'M12 3a9 9 0 110 18a9 9 0 010-18zM8 12l3 3 5-6' },
    { id: 'constellation', name: 'Constellation Maker', how: '5 compatibility matches', earned: opts.matches >= 5, status: opts.matches >= 5 ? 'EARNED' : `${opts.matches} / 5`, icon: 'M5 18l5-11 9 6-14 5z' },
    { id: 'thirty-night', name: '30-Night Orbit', how: '30-night streak', earned: p.bestStreak >= 30, status: p.bestStreak >= 30 ? 'EARNED' : `${Math.min(p.streak, 30)} / 30`, icon: 'M12 4a8 8 0 110 16a8 8 0 010-16zM12 1v6' },
    { id: 'mythic', name: 'Mythic Chart', how: 'Mythic chart rarity', earned: opts.mythic, status: opts.mythic ? 'EARNED' : 'MYTHIC ONLY', icon: 'M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z' },
  ];
}
