import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeProgress, type ActivityLog, type CheckIn } from './progress';

/**
 * A person's progress worked out on the server from their account data, so
 * rewards with real value (free Plus) can't be claimed by editing the browser.
 */
export async function serverProgress(admin: SupabaseClient, userId: string, today: string) {
  const [c, p, m, l] = await Promise.all([
    admin.from('check_ins').select('date, answer, score').eq('user_id', userId),
    admin.from('profiles').select('activity').eq('user_id', userId).maybeSingle(),
    admin.from('matches').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('links').select('id', { count: 'exact', head: true }).or(`a.eq.${userId},b.eq.${userId}`),
  ]);
  const checkIns: Record<string, CheckIn> = {};
  for (const r of c.data ?? []) checkIns[r.date] = { answer: r.answer, score: Number(r.score) };
  return computeProgress({ checkIns, today, activity: (p.data?.activity ?? {}) as ActivityLog, matches: m.count ?? 0, linked: l.count ?? 0 });
}
