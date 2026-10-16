import { NextResponse } from 'next/server';
import { igToken, imageUrl, publish, queueDaily, whoAmI } from '@/lib/social';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * The autopilot's heartbeat, called every few minutes by the database's scheduler.
 * ?check=1 only confirms the Instagram connection; it never posts.
 */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const { data: secret } = await admin.from('social_settings').select('value').eq('key', 'cron_secret').maybeSingle();
  if (!secret?.value || req.headers.get('x-cron-secret') !== secret.value) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const token = await igToken(admin);
  const userId = process.env.IG_USER_ID;
  if (!token || !userId) return NextResponse.json({ ok: true, note: 'waiting for IG_ACCESS_TOKEN and IG_USER_ID' });
  if (new URL(req.url).searchParams.get('check')) {
    try { return NextResponse.json({ ok: true, account: await whoAmI(token) }); } catch (e) { return NextResponse.json({ ok: false, error: (e as Error).message }); }
  }
  const { data: paused } = await admin.from('social_settings').select('value').eq('key', 'paused').maybeSingle();
  if (paused?.value === 'true') return NextResponse.json({ ok: true, note: 'paused' });

  await queueDaily(admin);
  const { data: due } = await admin.from('social_posts').select('id, kind, slug, caption, attempts')
    .eq('status', 'scheduled').lte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(3);
  const results = [];
  for (const p of due ?? []) {
    // Claim it so two runs never post the same thing.
    const { data: claimed } = await admin.from('social_posts').update({ status: 'publishing' }).eq('id', p.id).eq('status', 'scheduled').select('id');
    if (!claimed?.length) continue;
    try {
      const mediaId = await publish(token, userId, imageUrl(p), p.caption);
      await admin.from('social_posts').update({ status: 'posted', ig_media_id: mediaId, posted_at: new Date().toISOString(), error: null }).eq('id', p.id);
      results.push({ id: p.id, posted: mediaId });
    } catch (e) {
      const attempts = (p.attempts ?? 0) + 1;
      await admin.from('social_posts').update({ status: attempts >= 3 ? 'failed' : 'scheduled', attempts, error: (e as Error).message }).eq('id', p.id);
      results.push({ id: p.id, error: (e as Error).message });
    }
  }
  return NextResponse.json({ ok: true, results });
}
