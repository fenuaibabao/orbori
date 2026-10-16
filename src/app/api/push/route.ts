import { NextResponse } from 'next/server';
import { vapidKeys } from '@/lib/push';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** GET → { publicKey }: what a phone needs to subscribe. */
export async function GET() {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const { publicKey } = await vapidKeys(admin);
  return NextResponse.json({ publicKey });
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** POST { subscription, remindAt, timeZone }: turn the nightly reminder on (or change its time). */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const body = await req.json().catch(() => null) as { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; remindAt?: string; timeZone?: string } | null;
  const sub = body?.subscription;
  const endpoint = String(sub?.endpoint ?? '');
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !sub?.keys?.p256dh || !sub.keys.auth) return NextResponse.json({ error: 'Bad subscription.' }, { status: 400 });
  const remindAt = TIME.test(String(body?.remindAt)) ? String(body!.remindAt) : '20:00';
  let timeZone = String(body?.timeZone ?? 'America/Los_Angeles');
  try { new Intl.DateTimeFormat('en-US', { timeZone }); } catch { timeZone = 'America/Los_Angeles'; }
  const user = await currentUser();
  const { error } = await admin.from('push_subscriptions').upsert({
    endpoint, user_id: user?.id ?? null, p256dh: String(sub.keys.p256dh).slice(0, 200), auth: String(sub.keys.auth).slice(0, 100),
    remind_at: remindAt, time_zone: timeZone, failures: 0, updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE { endpoint }: turn it off. */
export async function DELETE(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (endpoint) await admin.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
