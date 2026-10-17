import 'server-only';
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeChart } from './astro';
import type { BirthInput } from './astro/types';
import { cosmicCouncil } from './council';
import { addDays } from './convergence';
import { constellationDays, groupStreak, type GroupDay } from './constellation';
import { labelsFor } from './friend-names';

interface ProfileRow { user_id: string; input: BirthInput; seed: number }
const MAX_MEMBERS = 12;

/** You plus everyone you're linked with (capped), with their profiles. */
async function members(admin: SupabaseClient, me: string) {
  const { data: links } = await admin.from('links').select('id, a, b').or(`a.eq.${me},b.eq.${me}`).limit(MAX_MEMBERS - 1);
  const linkOf = new Map((links ?? []).map((l) => [l.a === me ? l.b : l.a, l.id as string]));
  const ids = [me, ...linkOf.keys()];
  const { data: profiles } = await admin.from('profiles').select('user_id, input, seed').in('user_id', ids).returns<ProfileRow[]>();
  const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return { ids: ids.filter((id) => byId.has(id)), byId, linkOf };
}

/** Tonight's sky: who's in, who's glowing, the lines between friends, the group streak. */
export async function skyFor(admin: SupabaseClient, me: string, date: string, timeZone: string) {
  const { ids, byId, linkOf } = await members(admin, me);
  const mine = byId.get(me);
  if (!mine) return null;
  const since = addDays(date, -400);
  const [{ data: edges }, { data: checks }, { data: named }, { data: nudgesIn }, { data: nudgesOut }] = await Promise.all([
    ids.length > 1 ? admin.from('links').select('a, b').in('a', ids).in('b', ids) : Promise.resolve({ data: [] as { a: string; b: string }[] }),
    admin.from('check_ins').select('user_id, date').in('user_id', ids).gte('date', since),
    admin.from('constellations').select('name').eq('user_id', me).maybeSingle(),
    admin.from('nudges').select('from_user').eq('to_user', me).eq('date', date),
    admin.from('nudges').select('to_user').eq('from_user', me).eq('date', date),
  ]);
  const myCouncil = cosmicCouncil(computeChart(mine.input), date, timeZone);
  const labels = await labelsFor(admin, me, ids.map((id) => ({ id, seed: byId.get(id)!.seed })));
  const tonight = new Set((checks ?? []).filter((c) => c.date === date).map((c) => c.user_id));
  const sentMe = new Set((nudgesIn ?? []).map((n) => n.from_user));
  const sentByMe = new Set((nudgesOut ?? []).map((n) => n.to_user));
  const stars = ids.map((id) => {
    const p = byId.get(id)!;
    const council = id === me ? myCouncil : cosmicCouncil(computeChart(p.input), date, timeZone);
    return {
      id, me: id === me, linkId: linkOf.get(id) ?? null, handle: labels.get(id)!.label, realHandle: labels.get(id)!.handle, friendName: labels.get(id)!.friendName, nickname: labels.get(id)!.nickname, seed: p.seed,
      checkedIn: tonight.has(id), score: council.score,
      agree: id === me ? 7 : myCouncil.systems.filter((s, i) => s.advice === council.systems[i].advice).length,
      advice: council.majority, sentMe: sentMe.has(id), sentByMe: sentByMe.has(id),
    };
  });
  const { streak, litTonight } = groupStreak(ids, checks ?? [], date);
  return {
    name: named?.name ?? null,
    stars,
    edges: (edges ?? []).map((e) => [e.a, e.b] as [string, string]),
    lit: litTonight, streak,
  };
}

/** The next year of Constellation Days for you and your linked people (cached for a week). */
export async function groupDaysFor(admin: SupabaseClient, me: string, timeZone: string, today: string): Promise<{ days: GroupDay[]; members: number }> {
  const { ids, byId } = await members(admin, me);
  if (ids.length < 2) return { days: [], members: ids.length };
  const key = createHash('sha256').update(JSON.stringify(['g1', timeZone, ...ids.map((id) => [id, byId.get(id)!.input])])).digest('hex').slice(0, 24);
  const { data: cached } = await admin.from('constellation_cache').select('key, from_date, data').eq('user_id', me).maybeSingle();
  let days: GroupDay[];
  if (cached?.key === key && cached.from_date <= today && addDays(cached.from_date, 7) >= today) days = cached.data as GroupDay[];
  else {
    days = constellationDays(ids.map((id) => computeChart(byId.get(id)!.input)), today, 372, timeZone);
    await admin.from('constellation_cache').upsert({ user_id: me, key, from_date: today, data: days, computed_at: new Date().toISOString() });
  }
  const end = addDays(today, 365);
  return { days: days.filter((g) => g.d >= today && g.d < end), members: ids.length };
}
