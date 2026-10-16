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

export const XP = {
  checkIn: 10, streak7: 50, streak30: 150,
  /** A match you entered yourself (counts for the first 5). */
  match: 5,
  /** A real person linked to you. */
  linked: 25,
  challenge: 40,
  deep: 5, learn: 5, share: 5, nudge: 5, question: 10, sync: 10, journal: 10,
} as const;
export const DAILY_ACTIVITY_CAP = 40;
const MATCH_XP_LIMIT = 5;

/** What someone did on a given day besides checking in. */
export interface Activity {
  deep?: boolean;
  learn?: boolean;
  share?: boolean;
  nudge?: boolean;
  /** The day's question, answered: '<system>:<answer>' */
  question?: string;
  /** Checked in on a day a linked person also checked in. */
  sync?: boolean;
  /** Wrote in the journal. */
  journal?: boolean;
}
export type ActivityLog = Record<string, Activity>;

const dayMs = 86400000;
const toDay = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / dayMs;
const fromDay = (n: number) => new Date(n * dayMs).toISOString().slice(0, 10);

export function activityXp(a: Activity | undefined): number {
  if (!a) return 0;
  const raw = (a.deep ? XP.deep : 0) + (a.learn ? XP.learn : 0) + (a.share ? XP.share : 0) + (a.nudge ? XP.nudge : 0) + (a.question ? XP.question : 0) + (a.sync ? XP.sync : 0) + (a.journal ? XP.journal : 0);
  return Math.min(DAILY_ACTIVITY_CAP, raw);
}

/* ───── Weekly challenges (Monday–Sunday) ───── */

export interface Challenge { id: string; name: string; how: string; goal: number; progress: number; done: boolean }

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const n = toDay(date);
  const dow = (new Date(n * dayMs).getUTCDay() + 6) % 7; // Monday = 0
  return fromDay(n - dow);
}

export function weekChallenges(checkIns: Record<string, CheckIn>, activity: ActivityLog, monday: string): Challenge[] {
  const days = Array.from({ length: 7 }, (_, i) => fromDay(toDay(monday) + i));
  const count = (f: (d: string) => boolean) => days.filter(f).length;
  const mk = (id: string, name: string, how: string, goal: number, progress: number): Challenge => ({ id, name, how, goal, progress: Math.min(goal, progress), done: progress >= goal });
  return [
    mk('five-nights', 'Five Nights', 'Check in on 5 nights this week', 5, count((d) => !!checkIns[d])),
    mk('seeker', 'Seeker', 'Go deeper or read Learn on 4 days', 4, count((d) => !!(activity[d]?.deep || activity[d]?.learn))),
    mk('oracle-asks', 'The Oracle Asks', 'Answer the daily question on 4 days', 4, count((d) => !!activity[d]?.question)),
    mk('in-sync', 'In Sync', 'Check in on 2 days a linked person does too', 2, count((d) => !!activity[d]?.sync)),
    mk('messenger', 'Messenger', 'Nudge a linked person on 3 days', 3, count((d) => !!activity[d]?.nudge)),
  ];
}

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
  /** XP earned today (check-in + activities). */
  todayXp: number;
  /** True when yesterday was missed and the streak was knocked back a night. */
  knockedBack: boolean;
  thisWeek: Challenge[];
}

export interface ProgressInput {
  checkIns: Record<string, CheckIn>;
  today: string;
  activity?: ActivityLog;
  matches?: number;
  linked?: number;
}

/**
 * Streaks: checking in on consecutive nights adds one. Missing a single night
 * knocks the streak back by one instead of resetting it; missing two nights in a
 * row resets it.
 */
export function computeProgress(input: ProgressInput): Progress {
  const { checkIns, today } = input;
  const activity = input.activity ?? {};
  const days = Object.keys(checkIns).sort();
  let xp = Math.min(input.matches ?? 0, MATCH_XP_LIMIT) * XP.match + (input.linked ?? 0) * XP.linked;
  let run = 0;
  let best = 0;
  let prev: number | null = null;
  let calledIt = 0;
  let hit7 = false, hit30 = false;
  for (const d of days) {
    const n = toDay(d);
    const gap = prev === null ? Infinity : n - prev;
    if (gap === 1) run += 1;
    else if (gap === 2) run = Math.max(1, run); // one missed night: −1, then +1 for tonight
    else { run = 1; hit7 = false; hit30 = false; }
    prev = n;
    best = Math.max(best, run);
    xp += XP.checkIn;
    if (run >= 7 && !hit7) { xp += XP.streak7; hit7 = true; }
    if (run >= 30 && !hit30) { xp += XP.streak30; hit30 = true; }
    if (checkIns[d].answer === 'nailed' && checkIns[d].score < 5) calledIt++;
  }
  for (const d of Object.keys(activity)) xp += activityXp(activity[d]);

  // Weekly challenges, every week that has any history.
  const weeks = new Set([...days, ...Object.keys(activity)].map(weekStart));
  for (const w of weeks) for (const c of weekChallenges(checkIns, activity, w)) if (c.done) xp += XP.challenge;

  const t = toDay(today);
  const since = prev === null ? Infinity : t - prev;
  const streak = since <= 1 ? run : since === 2 ? Math.max(0, run - 1) : 0;

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
    todayXp: (checkIns[today] ? XP.checkIn : 0) + activityXp(activity[today]),
    knockedBack: since === 2 && run > 1,
    thisWeek: weekChallenges(checkIns, activity, weekStart(today)),
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
