import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { DateTime } from 'luxon';

/**
 * The app's Web Push keys. Made once, the first time they're needed, and kept in
 * the server-only settings table, so there's nothing to paste into Vercel.
 */
export async function vapidKeys(admin: SupabaseClient): Promise<{ publicKey: string; privateKey: string }> {
  const { data } = await admin.from('social_settings').select('key, value').in('key', ['vapid_public', 'vapid_private']);
  const pub = data?.find((r) => r.key === 'vapid_public')?.value;
  const priv = data?.find((r) => r.key === 'vapid_private')?.value;
  if (pub && priv) return { publicKey: pub, privateKey: priv };
  const k = webpush.generateVAPIDKeys();
  // ignoreDuplicates: if two requests race, the first pair wins and we re-read it.
  await admin.from('social_settings').upsert([{ key: 'vapid_public', value: k.publicKey }, { key: 'vapid_private', value: k.privateKey }], { onConflict: 'key', ignoreDuplicates: true });
  const { data: again } = await admin.from('social_settings').select('key, value').in('key', ['vapid_public', 'vapid_private']);
  return { publicKey: again!.find((r) => r.key === 'vapid_public')!.value, privateKey: again!.find((r) => r.key === 'vapid_private')!.value };
}

export const REMINDERS = [
  'Your check-in is waiting ✦',
  'Seven voices weighed in on your day. Did they call it?',
  'Tonight\'s Council is ready. Two minutes before bed?',
  'How did today really go? Your check-in is waiting.',
  'The sky had something to say about today. Take a look ✦',
  'Keep your streak glowing. Open Orbori tonight.',
  'One question, one tap: how did today go?',
];

/** Is a reminder due for someone right now? Due from their chosen time until 2 hours after, once a day. */
export function isDue(remindAt: string, timeZone: string, lastSentOn: string | null, now: DateTime = DateTime.utc()) {
  const local = now.setZone(timeZone);
  if (!local.isValid) return { due: false, date: '' };
  const date = local.toISODate()!;
  if (lastSentOn === date) return { due: false, date };
  const [h, m] = remindAt.split(':').map(Number);
  const mins = local.hour * 60 + local.minute - (h * 60 + m);
  return { due: mins >= 0 && mins < 120, date };
}

export function reminderText(date: string) {
  const n = [...date].reduce((s, c) => s + c.charCodeAt(0), 0);
  return REMINDERS[n % REMINDERS.length];
}
