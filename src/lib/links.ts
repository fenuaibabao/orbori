import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeChart } from './astro';
import type { BirthInput } from './astro/types';
import { coarse } from './coarse';
import { compatibility } from './compat';
import { cosmicCouncil } from './council';
import { labelsFor } from './friend-names';
import { LEVELS } from './progress';
import { serverProgress } from './server-progress';

interface ProfileRow { user_id: string; input: BirthInput; seed: number }

/** Everything a person may see about a linked partner. Never the partner's birth details. */
export async function linkSummaries(admin: SupabaseClient, me: string, date: string, timeZone: string) {
  const { data: links, error } = await admin.from('links').select('id, a, b, created_at').or(`a.eq.${me},b.eq.${me}`);
  if (error) throw error;
  if (!links?.length) return [];
  const ids = [me, ...links.map((l) => (l.a === me ? l.b : l.a))];
  const { data: profiles } = await admin.from('profiles').select('user_id, input, seed').in('user_id', ids).returns<ProfileRow[]>();
  const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const mine = byId.get(me);
  if (!mine) return [];
  const myChart = computeChart(mine.input);
  const myCouncil = cosmicCouncil(myChart, date, timeZone);
  const [{ data: checkIns }, { data: nudgesIn }, { data: nudgesOut }] = await Promise.all([
    admin.from('check_ins').select('user_id').eq('date', date).in('user_id', ids.slice(1)),
    admin.from('nudges').select('from_user').eq('to_user', me).eq('date', date),
    admin.from('nudges').select('to_user').eq('from_user', me).eq('date', date),
  ]);
  const labels = await labelsFor(admin, me, ids.slice(1).filter((id) => byId.has(id)).map((id) => ({ id, seed: byId.get(id)!.seed })));
  const checked = new Set((checkIns ?? []).map((c) => c.user_id));
  const nudgedMe = new Set((nudgesIn ?? []).map((n) => n.from_user));
  const nudgedByMe = new Set((nudgesOut ?? []).map((n) => n.to_user));
  // Oracle and up show their level to the people they're linked with (a level reward).
  const levels = new Map(await Promise.all(ids.slice(1).map(async (id) => {
    try { const p = await serverProgress(admin, id, date); return [id, p.levelIndex >= 3 ? LEVELS[p.levelIndex].name : null] as const; } catch { return [id, null] as const; }
  })));
  return links.flatMap((l) => {
    const other = l.a === me ? l.b : l.a;
    const p = byId.get(other);
    if (!p) return [];
    const chart = computeChart(p.input);
    const council = cosmicCouncil(chart, date, timeZone);
    const agree = myCouncil.systems.filter((s, i) => s.advice === council.systems[i].advice).length;
    const sameMajority = myCouncil.majority === council.majority;
    return [{
      id: l.id, userId: other, handle: labels.get(other)?.label ?? '', realHandle: labels.get(other)?.handle ?? '', seed: p.seed, since: l.created_at, level: levels.get(other) ?? null,
      ...coarse(chart),
      compat: compatibility(myChart, chart).score,
      today: { agree, total: myCouncil.systems.length, sameMajority, theirHeadline: council.headline, theirScore: council.score, checkedIn: checked.has(other) },
      nudgedMe: nudgedMe.has(other), nudgedByMe: nudgedByMe.has(other),
    }];
  });
}
