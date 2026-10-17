import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeChart } from './astro';
import type { BirthInput } from './astro/types';
import { BETA } from './beta';
import { addDays, findConvergence, glowingDays, type GlowDay } from './convergence';
import { isOwnerEmail } from './owner';
import { isPlusRow } from './plus-status';

/** Who sees the forecast: yearly members, the Founding 111, and beta testers while the beta is on. */
export async function forecastAccess(admin: SupabaseClient, user: { id: string; email?: string | null }): Promise<boolean> {
  if (isOwnerEmail(user.email)) return true;
  const [{ data: sub }, { data: founding }] = await Promise.all([
    admin.from('subscriptions').select('status, plan, current_period_end, note').eq('user_id', user.id).maybeSingle(),
    admin.from('founding_members').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  if (founding) return true;
  if (!isPlusRow(sub)) return false;
  if (sub?.plan === 'yearly') return true;
  return BETA && sub?.plan === 'gift' && sub?.note === 'beta tester';
}

export interface Forecast { from: string; days: GlowDay[]; next: GlowDay | null }
const WINDOW = 400;          // days computed per refresh
const REFRESH_AFTER = 30;    // recompute once the window has slid this far
const FAR = 6 * 365;         // how far to look for the next Convergence

/** A year of glowing days from `today`, plus the next Convergence (cached per person). */
export async function forecastFor(admin: SupabaseClient, userId: string, input: BirthInput, timeZone: string, today: string): Promise<Forecast> {
  const key = createHash('sha256').update(JSON.stringify(['w2', input.date, input.time, input.latitude, input.longitude, input.timeZone, timeZone])).digest('hex').slice(0, 24);
  const { data: cached } = await admin.from('convergence_cache').select('key, from_date, data').eq('user_id', userId).maybeSingle();
  let data = cached?.key === key && cached.from_date <= today && addDays(cached.from_date, REFRESH_AFTER) >= today ? cached.data as Forecast : null;
  if (!data) {
    const chart = computeChart(input);
    const days = glowingDays(chart, today, WINDOW, timeZone);
    let next = days.find((g) => g.n === 7) ?? null;
    if (!next) next = findConvergence(chart, addDays(today, WINDOW), FAR - WINDOW, timeZone);
    data = { from: today, days, next };
    await admin.from('convergence_cache').upsert({ user_id: userId, key, from_date: today, data, computed_at: new Date().toISOString() });
  }
  const end = addDays(today, 365);
  return { from: today, days: data.days.filter((g) => g.d >= today && g.d < end), next: data.next && data.next.d >= today ? data.next : null };
}

/** The person's private calendar link token (made on first use). */
export async function feedToken(admin: SupabaseClient, userId: string, timeZone: string, reset = false): Promise<string> {
  const { data } = await admin.from('calendar_feeds').select('token, time_zone').eq('user_id', userId).maybeSingle();
  if (data && !reset) {
    if (data.time_zone !== timeZone) await admin.from('calendar_feeds').update({ time_zone: timeZone }).eq('user_id', userId);
    return data.token;
  }
  const token = randomBytes(18).toString('base64url');
  await admin.from('calendar_feeds').upsert({ user_id: userId, token, time_zone: timeZone });
  return token;
}
