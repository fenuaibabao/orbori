'use client';
/**
 * Keeps the on-device store and the account in step.
 * Signed out: nothing happens, the app works on-device as before.
 * Signed in: every local change is pushed; on sign-in the two are merged so
 * nobody loses a chart, a streak or a match when they create an account.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckIn } from './progress';
import type { LocalState, Match, Profile } from './store';

interface ProfileRow { input: Profile['input']; city_label: string; seed: number; created_at: string }
interface CheckInRow { date: string; answer: CheckIn['answer']; score: number }
interface MatchRow { id: string; nickname: string; input: Match['input']; city_label: string; seed: number; added_at: string }

export async function pullState(sb: SupabaseClient, userId: string): Promise<LocalState> {
  const [p, c, m] = await Promise.all([
    sb.from('profiles').select('input, city_label, seed, created_at').eq('user_id', userId).maybeSingle<ProfileRow>(),
    sb.from('check_ins').select('date, answer, score').eq('user_id', userId).returns<CheckInRow[]>(),
    sb.from('matches').select('id, nickname, input, city_label, seed, added_at').eq('user_id', userId).returns<MatchRow[]>(),
  ]);
  if (p.error) throw p.error;
  if (c.error) throw c.error;
  if (m.error) throw m.error;
  const checkIns: Record<string, CheckIn> = {};
  for (const r of c.data ?? []) checkIns[r.date] = { answer: r.answer, score: Number(r.score) };
  return {
    profile: p.data ? { input: p.data.input, cityLabel: p.data.city_label, seed: p.data.seed, createdAt: p.data.created_at } : null,
    checkIns,
    matches: (m.data ?? []).map((r) => ({ id: r.id, nickname: r.nickname, input: r.input, cityLabel: r.city_label, seed: r.seed, addedAt: r.added_at })),
  };
}

export async function pushState(sb: SupabaseClient, userId: string, s: LocalState) {
  if (s.profile) {
    const { error } = await sb.from('profiles').upsert({
      user_id: userId, input: s.profile.input, city_label: s.profile.cityLabel, seed: s.profile.seed,
      created_at: s.profile.createdAt, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
  const checkRows = Object.entries(s.checkIns).map(([date, c]) => ({ user_id: userId, date, answer: c.answer, score: c.score }));
  if (checkRows.length) {
    const { error } = await sb.from('check_ins').upsert(checkRows);
    if (error) throw error;
  }
  const matchRows = s.matches.map((m) => ({ user_id: userId, id: m.id, nickname: m.nickname, input: m.input, city_label: m.cityLabel, seed: m.seed, added_at: m.addedAt }));
  if (matchRows.length) {
    const { error } = await sb.from('matches').upsert(matchRows);
    if (error) throw error;
  }
  // Matches removed on this device are removed from the account too.
  const keep = s.matches.map((m) => m.id);
  const del = sb.from('matches').delete().eq('user_id', userId);
  const { error } = keep.length ? await del.not('id', 'in', `(${keep.map((k) => `"${k}"`).join(',')})`) : await del;
  if (error) throw error;
}

/** Account data wins for the chart; check-ins and matches are combined. */
export function merge(local: LocalState, remote: LocalState): LocalState {
  const ids = new Set(remote.matches.map((m) => m.id));
  return {
    profile: remote.profile ?? local.profile,
    checkIns: { ...local.checkIns, ...remote.checkIns },
    matches: [...remote.matches, ...local.matches.filter((m) => !ids.has(m.id))].sort((a, b) => a.addedAt.localeCompare(b.addedAt)),
  };
}

/** "Start over": wipe the account's chart, check-ins and matches (the account itself stays). */
export async function clearAccount(sb: SupabaseClient, userId: string) {
  for (const t of ['matches', 'check_ins', 'profiles'] as const) {
    const { error } = await sb.from(t).delete().eq('user_id', userId);
    if (error) throw error;
  }
}
