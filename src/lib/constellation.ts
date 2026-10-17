/**
 * The live Constellation: you and the people you're linked with. Pure helpers,
 * shared by the server (and tests).
 */
import type { Chart } from './astro/types';
import { cosmicCouncil } from './council';
import type { Advice } from './council/types';
import { addDays } from './convergence';

export interface GroupDay { d: string; adv: Advice }

/**
 * Constellation Days: every member's Council gives the same advice, and each
 * has at least 5 of 7 voices agreeing. Rare for groups: a few times a year.
 */
export function constellationDays(charts: Chart[], from: string, days: number, timeZone: string): GroupDay[] {
  const out: GroupDay[] = [];
  if (charts.length < 2) return out;
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i);
    let adv: Advice | null = null, ok = true;
    for (const c of charts) {
      const r = cosmicCouncil(c, d, timeZone);
      if (r.agreeCount < 5 || (adv && r.majority !== adv)) { ok = false; break; }
      adv = r.majority;
    }
    if (ok && adv) out.push({ d, adv });
  }
  return out;
}

/** Nights in a row (ending tonight, or last night if tonight isn't complete) when every member checked in. */
export function groupStreak(memberIds: string[], checkIns: { user_id: string; date: string }[], today: string): { streak: number; litTonight: boolean } {
  const by = new Map<string, Set<string>>();
  for (const c of checkIns) { if (!by.has(c.date)) by.set(c.date, new Set()); by.get(c.date)!.add(c.user_id); }
  const all = (d: string) => memberIds.every((id) => by.get(d)?.has(id));
  const litTonight = memberIds.length >= 2 && all(today);
  let d = litTonight ? today : addDays(today, -1), n = 0;
  while (memberIds.length >= 2 && all(d) && n < 400) { n++; d = addDays(d, -1); }
  return { streak: n, litTonight };
}
