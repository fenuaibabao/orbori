import { createHash } from 'node:crypto';
import { DateTime } from 'luxon';
import { forecastAccess, forecastFor } from '@/lib/convergence-server';
import { calendar, glowEvent } from '@/lib/ics';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { BirthInput } from '@/lib/astro/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cal/<token>.ics → the person's glowing days as a calendar feed that
 * calendar apps subscribe to. ?date=YYYY-MM-DD → just that one day, as a download.
 * The link is private; it carries only dates and the Council's advice.
 */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const admin = supabaseAdmin();
  if (!admin) return new Response('Not configured', { status: 503 });
  const token = (await params).file.replace(/\.ics$/, '');
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return new Response('Not found', { status: 404 });
  const { data: feed } = await admin.from('calendar_feeds').select('user_id, time_zone').eq('token', token).maybeSingle();
  if (!feed) return new Response('Not found', { status: 404 });

  const uidSeed = createHash('sha256').update(feed.user_id).digest('hex').slice(0, 12);
  const { data: auth } = await admin.auth.admin.getUserById(feed.user_id);
  const { data: profile } = await admin.from('profiles').select('input').eq('user_id', feed.user_id).maybeSingle<{ input: BirthInput }>();
  let events: string[][] = [];
  if (auth?.user && profile?.input && await forecastAccess(admin, auth.user)) {
    const today = DateTime.now().setZone(feed.time_zone).toISODate()!;
    const f = await forecastFor(admin, feed.user_id, profile.input, feed.time_zone, today);
    const all = [...f.days, ...(f.next && !f.days.some((g) => g.d === f.next!.d) ? [f.next] : [])];
    const only = new URL(req.url).searchParams.get('date');
    events = (only ? all.filter((g) => g.d === only) : all).map((g) => glowEvent(g, uidSeed));
    if (only) {
      return new Response(calendar('Orbori', events), {
        headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="orbori-${only}.ics"`, 'cache-control': 'private, no-store' },
      });
    }
  }
  return new Response(calendar('Orbori ✦ glowing days', events), {
    headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'private, max-age=3600' },
  });
}
