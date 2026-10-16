import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { isDue, reminderText, vapidKeys } from '@/lib/push';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Called every 5 minutes by the database scheduler: sends the nightly reminders that are due. */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const { data: secret } = await admin.from('social_settings').select('value').eq('key', 'cron_secret').maybeSingle();
  if (!secret?.value || req.headers.get('x-cron-secret') !== secret.value) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { publicKey, privateKey } = await vapidKeys(admin);
  webpush.setVapidDetails('mailto:hello@orbori.app', publicKey, privateKey);

  const { data: subs } = await admin.from('push_subscriptions').select('endpoint, user_id, p256dh, auth, remind_at, time_zone, last_sent_on, failures').limit(5000);
  const due = (subs ?? []).map((s) => ({ s, ...isDue(s.remind_at, s.time_zone, s.last_sent_on) })).filter((x) => x.due);
  let sent = 0, skipped = 0, removed = 0;

  for (const { s, date } of due) {
    // Already checked in tonight (signed-in people only)? Then no nudge needed.
    if (s.user_id) {
      const { data: done } = await admin.from('check_ins').select('date').eq('user_id', s.user_id).eq('date', date).maybeSingle();
      if (done) { await admin.from('push_subscriptions').update({ last_sent_on: date }).eq('endpoint', s.endpoint); skipped++; continue; }
    }
    // Claim tonight's send first so two runs never double-send.
    const { data: claimed } = await admin.from('push_subscriptions').update({ last_sent_on: date }).eq('endpoint', s.endpoint)
      .or(`last_sent_on.is.null,last_sent_on.neq.${date}`).select('endpoint');
    if (!claimed?.length) continue;
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: 'Orbori', body: reminderText(date), url: '/today' }), { TTL: 4 * 3600, urgency: 'normal' });
      sent++;
      if (s.failures) await admin.from('push_subscriptions').update({ failures: 0 }).eq('endpoint', s.endpoint);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      // 404/410: the phone turned notifications off or the app was removed.
      if (code === 404 || code === 410 || (s.failures ?? 0) >= 4) { await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint); removed++; }
      else await admin.from('push_subscriptions').update({ failures: (s.failures ?? 0) + 1 }).eq('endpoint', s.endpoint);
    }
  }
  return NextResponse.json({ ok: true, due: due.length, sent, skipped, removed });
}
