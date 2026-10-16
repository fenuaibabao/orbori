import { NextResponse } from 'next/server';
import { READING_MODEL, writeReading } from '@/lib/ai-reading';
import { computeChart } from '@/lib/astro';
import { cosmicCouncil } from '@/lib/council';
import { isOwnerEmail } from '@/lib/owner';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** GET: is the AI reading switched on? (Lets the page hide the card until the key exists.) */
export async function GET() {
  return NextResponse.json({ enabled: !!process.env.ANTHROPIC_API_KEY });
}

/**
 * POST { input, date, timeZone } → { body }.
 * Plus members only. One reading per person per day, stored so repeat visits are free.
 */
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 });

  try {
    const body = await req.json();
    const input = parseBirthInput(body?.input);
    const date = String(body?.date ?? '');
    const timeZone = String(body?.timeZone ?? input.timeZone);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Bad date.');
    // Only today's reading (allowing for time zones), so nobody can mint a year of readings.
    if (Math.abs(Date.parse(`${date}T12:00:00Z`) - Date.now()) > 36 * 3600 * 1000) throw new Error('Readings are for today only.');

    if (!isOwnerEmail(user.email)) {
      const { data: sub } = await admin.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle();
      if (!sub || !['active', 'trialing'].includes(sub.status)) return NextResponse.json({ error: 'plus' }, { status: 402 });
    }

    const { data: saved } = await admin.from('readings').select('body').eq('user_id', user.id).eq('date', date).maybeSingle();
    if (saved?.body) return NextResponse.json({ body: saved.body });

    const chart = computeChart(input);
    const reading = cosmicCouncil(chart, date, timeZone);
    const big3 = [`Sun ${chart.western.planets.sun.sign}`, `Moon ${chart.moonSignOptions[0]}`, chart.western.ascendant ? `Rising ${chart.western.ascendant.sign}` : null]
      .filter(Boolean).join(', ');
    const text = await writeReading(key, reading, big3);
    await admin.from('readings').upsert({ user_id: user.id, date, body: text, model: process.env.ANTHROPIC_MODEL || READING_MODEL });
    return NextResponse.json({ body: text });
  } catch (e) {
    console.error('[reading]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
