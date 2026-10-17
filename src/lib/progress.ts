/** Oracle Levels, streaks, XP and badges. Pure functions so they can move server-side later. */

/** 'seen': checked in just by opening Orbori (the old ratings stay on past days). */
export type Answer = 'nailed' | 'kinda' | 'nope' | 'seen';
export interface CheckIn { answer: Answer; score: number }

export const LEVELS = [
  { name: 'Stargazer', xp: 0 },
  { name: 'Seer', xp: 250 },
  { name: 'Mystic', xp: 1200 },
  { name: 'Oracle', xp: 5000 },
  { name: 'Celestial', xp: 12000 },
] as const;

/** Star ranks: the quiet second ladder past Celestial (the secret track). */
export const STAR_RANKS = [
  { name: 'Comet', xp: 15000 },
  { name: 'Nebula', xp: 19000 },
  { name: 'Pulsar', xp: 24000 },
  { name: 'Supernova', xp: 30000 },
  { name: 'Galaxy', xp: 40000 },
] as const;
export function starRank(xp: number) {
  let cur: (typeof STAR_RANKS)[number] | null = null;
  for (const r of STAR_RANKS) if (xp >= r.xp) cur = r;
  const next = STAR_RANKS.find((r) => r.xp > xp) ?? null;
  return { rank: cur?.name ?? null, next };
}

export const XP = {
  checkIn: 10, streak7: 50, streak30: 150,
  /** A match you entered yourself (counts for the first 5). */
  match: 5,
  /** A real person linked to you. */
  linked: 25,
  challenge: 40,
  deep: 5, learn: 5, share: 5, nudge: 5, question: 10, sync: 10, journal: 10,
  /** Each different minigame finished that day. */
  game: 10,
  /** One time only: opening Orbori from the Home Screen, and turning on notifications. */
  install: 25, notify: 25,
} as const;
export const DAILY_ACTIVITY_CAP = 60;
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
  /** Learn terms opened for the first time that day (ids). */
  terms?: string[];
  /** Minigames finished that day (ids). */
  games?: string[];
  /** Minigames finished with a perfect result that day (ids). */
  perfect?: string[];
  /** Traditions opened in depth that day (system ids). */
  deepOn?: string[];
  /** Circles whose weekly challenge was won (recorded on the week's Monday). */
  circleWins?: string[];
  /** First opened from the Home Screen (counts once, ever). */
  installed?: boolean;
  /** Turned on notifications (counts once, ever). */
  notified?: boolean;
  /** Opened Orbori on a Convergence day (all 7 voices agreed). */
  converged?: boolean;
  /** Everyone in your constellation checked in that night. */
  fullSky?: boolean;
}
export type ActivityLog = Record<string, Activity>;

/** Every Learn term someone has opened, across all days. */
export const seenTerms = (log: ActivityLog | undefined): Set<string> =>
  new Set(Object.values(log ?? {}).flatMap((a) => a.terms ?? []));

const dayMs = 86400000;
const toDay = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / dayMs;
const fromDay = (n: number) => new Date(n * dayMs).toISOString().slice(0, 10);

export function activityXp(a: Activity | undefined): number {
  if (!a) return 0;
  const raw = (a.deep ? XP.deep : 0) + (a.learn ? XP.learn : 0) + (a.share ? XP.share : 0) + (a.nudge ? XP.nudge : 0) + (a.question ? XP.question : 0) + (a.sync ? XP.sync : 0) + (a.journal ? XP.journal : 0) + (a.games?.length ?? 0) * XP.game;
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
  /** Convergence days seen. */
  converged: number;
  /** Nights your whole constellation was lit. */
  fullSky: number;
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
  for (const d of Object.keys(activity)) xp += activityXp(activity[d]) + (activity[d].circleWins?.length ?? 0) * XP.challenge;
  const acts = Object.values(activity);
  if (acts.some((a) => a.installed)) xp += XP.install;
  if (acts.some((a) => a.notified)) xp += XP.notify;

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
    converged: Object.values(activity).filter((a) => a.converged).length,
    fullSky: Object.values(activity).filter((a) => a.fullSky).length,
  };
}

export interface Badge { id: string; name: string; how: string; earned: boolean; status: string; icon: string }

export function badges(p: Progress, opts: { mythic: boolean; matches: number; founding?: number | null }): Badge[] {
  return [
    ...(opts.founding ? [{ id: 'founding-member', name: 'Founding Member', how: `One of the Founding 111 (#${opts.founding})`, earned: true, status: `#${opts.founding}`, icon: 'M12 3l2.4 5.6L20 9.3l-4.3 3.9 1.3 5.8L12 16l-5 3 1.3-5.8L4 9.3l5.6-.7z' }] : []),
    { id: 'first-light', name: 'First Light', how: 'Your first day on Orbori', earned: p.checkIns >= 1, status: p.checkIns >= 1 ? 'EARNED' : '0 / 1', icon: 'M3 18h18M7 18a5 5 0 0110 0M12 6v4M5 11l2 2M19 11l-2 2' },
    { id: 'seven-night', name: '7-Night Watch', how: '7-night streak', earned: p.bestStreak >= 7, status: p.bestStreak >= 7 ? 'EARNED' : `${Math.min(p.streak, 7)} / 7`, icon: 'M16 4a8 8 0 100 16a6.5 6.5 0 010-16z' },
    // Retired with "Did it land?": shown only to people who already earned it.
    ...(p.calledIt >= 5 ? [{ id: 'called-it', name: 'Called It', how: '"Nailed it" on 5 low-convergence days', earned: true, status: 'EARNED', icon: 'M12 3a9 9 0 110 18a9 9 0 010-18zM8 12l3 3 5-6' }] : []),
    { id: 'constellation', name: 'Constellation Maker', how: '5 compatibility matches', earned: opts.matches >= 5, status: opts.matches >= 5 ? 'EARNED' : `${opts.matches} / 5`, icon: 'M5 18l5-11 9 6-14 5z' },
    { id: 'thirty-night', name: '30-Night Orbit', how: '30-night streak', earned: p.bestStreak >= 30, status: p.bestStreak >= 30 ? 'EARNED' : `${Math.min(p.streak, 30)} / 30`, icon: 'M12 4a8 8 0 110 16a8 8 0 010-16zM12 1v6' },
    { id: 'founding-celestial', name: 'Founding Celestial', how: 'Reach Celestial, the top level', earned: p.levelIndex >= 4, status: p.levelIndex >= 4 ? 'EARNED' : 'CELESTIAL', icon: 'M12 2l1.8 5.5H19l-4.6 3.4 1.8 5.6L12 13l-4.2 3.5 1.8-5.6L5 7.5h5.2z' },
    { id: 'converged', name: 'Converged', how: 'Be here on a Convergence day, when all 7 voices agree', earned: p.converged >= 1, status: p.converged >= 1 ? (p.converged > 1 ? `×${p.converged}` : 'EARNED') : 'RARE', icon: 'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3M12 9a3 3 0 110 6a3 3 0 010-6z' },
    { id: 'full-sky', name: 'Full Sky', how: 'Every star in your constellation lit on the same night', earned: p.fullSky >= 1, status: p.fullSky >= 1 ? (p.fullSky > 1 ? `×${p.fullSky}` : 'EARNED') : 'TOGETHER', icon: 'M5 18l4-9 5 4 5-8M5 18h0M9 9h0M14 13h0M19 5h0' },
    { id: 'mythic', name: 'Mythic Chart', how: 'Mythic chart rarity', earned: opts.mythic, status: opts.mythic ? 'EARNED' : 'MYTHIC ONLY', icon: 'M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z' },
  ];
}
