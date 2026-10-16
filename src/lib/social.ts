import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';

/**
 * Orbori's Instagram autopilot: a queue of posts (social_posts) published through
 * Instagram's official API at their scheduled time, plus a daily "Sky today" post.
 */
export const SITE = 'https://www.orbori.app';
const GRAPH = 'https://graph.instagram.com';
export const DAILY_FROM = '2026-10-23';
const DAILY_TIME = { hour: 7, minute: 30 }; // Pacific
const TAGS = '#astrology #moonphases #dailyhoroscope #birthchart #zodiac';

const SKY_CAPTIONS = [
  'The sky today, seven ways. ✦ Which voice is speaking loudest for you? Your own Council is waiting at the link in bio.',
  'Seven traditions, one day. ✦ Same sky, seven ways of reading it. Find out what yours says today: link in bio.',
  'Good morning from all seven. ✦ The Moon, the day count, the night of the month, the number. Your personal reading is at the link in bio.',
  'Today, through seven lenses. ✦ Which one feels truest to your morning? Tell us below, and get your own daily Council at the link in bio.',
];

export function imageUrl(post: { kind: string; slug: string }) {
  return post.kind === 'sky' ? `${SITE}/api/social/sky?date=${post.slug}&format=jpg` : `${SITE}/api/social/${post.slug}?format=jpg`;
}

async function setting(admin: SupabaseClient, key: string) {
  const { data } = await admin.from('social_settings').select('value, updated_at').eq('key', key).maybeSingle();
  return data as { value: string; updated_at: string } | null;
}
async function setSetting(admin: SupabaseClient, key: string, value: string) {
  await admin.from('social_settings').upsert({ key, value, updated_at: new Date().toISOString() });
}

/** The access token: the stored (refreshed) one, else the one set in Vercel. Refreshed every ~30 days (they last 60). */
export async function igToken(admin: SupabaseClient): Promise<string | null> {
  const stored = await setting(admin, 'ig_token');
  let token = stored?.value || process.env.IG_ACCESS_TOKEN || null;
  if (!token) return null;
  const age = stored ? Date.now() - Date.parse(stored.updated_at) : Infinity;
  if (age > 30 * 86400000) {
    const r = await fetch(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.access_token) { token = d.access_token as string; await setSetting(admin, 'ig_token', token); }
    else if (!stored) await setSetting(admin, 'ig_token', token); // remember it; refresh again later
  }
  return token;
}

/** Make sure the next two days of "Sky today" posts are queued. */
export async function queueDaily(admin: SupabaseClient, now = DateTime.now().setZone('America/Los_Angeles')) {
  for (let i = 0; i < 2; i++) {
    const day = now.plus({ days: i });
    const date = day.toISODate()!;
    if (date < DAILY_FROM) continue;
    const at = day.set({ ...DAILY_TIME, second: 0, millisecond: 0 });
    const n = Math.floor(day.toMillis() / 86400000);
    await admin.from('social_posts').upsert(
      { kind: 'sky', slug: date, scheduled_at: at.toUTC().toISO(), status: 'scheduled', caption: `${SKY_CAPTIONS[n % SKY_CAPTIONS.length]}\n\n${TAGS}` },
      { onConflict: 'kind,slug', ignoreDuplicates: true },
    );
  }
}

async function graph(path: string, token: string, body?: Record<string, string>) {
  const r = await fetch(`${GRAPH}/${path}`, body
    ? { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...body, access_token: token }) }
    : { headers: { authorization: `Bearer ${token}` } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d?.error?.message ?? `Instagram error ${r.status}`);
  return d;
}

/** Who the token belongs to (a check that posts nothing). */
export async function whoAmI(token: string) {
  return graph('me?fields=user_id,username', token) as Promise<{ user_id: string; username: string }>;
}

/** Publish one post: create the media container, wait until Instagram has the image, then publish. */
export async function publish(token: string, userId: string, image: string, caption: string): Promise<string> {
  const c = await graph(`${userId}/media`, token, { image_url: image, caption });
  for (let i = 0; i < 12; i++) {
    const s = await graph(`${c.id}?fields=status_code`, token);
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`Instagram could not process the image (${s.status_code}).`);
    await new Promise((r) => setTimeout(r, 2500));
  }
  const p = await graph(`${userId}/media_publish`, token, { creation_id: c.id });
  return p.id as string;
}
