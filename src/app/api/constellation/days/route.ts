import { NextResponse } from 'next/server';
import { groupDaysFor } from '@/lib/constellation-server';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** GET ?today=&tz= → the next year of Constellation Days. */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const today = q.get('today') ?? '';
  let tz = q.get('tz') ?? 'UTC';
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch { tz = 'UTC'; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || Math.abs(Date.parse(`${today}T12:00:00Z`) - Date.now()) > 36 * 3600 * 1000) return NextResponse.json({ error: 'Bad date.' }, { status: 400 });
  try { return NextResponse.json(await groupDaysFor(admin, user.id, tz, today)); }
  catch (e) { console.error('[constellation days]', e); return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}
