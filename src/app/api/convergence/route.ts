import { NextResponse } from 'next/server';
import { feedToken, forecastAccess, forecastFor } from '@/lib/convergence-server';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST { input, timeZone, today, reset? } → the Convergence forecast.
 * Yearly, Founding and beta members get the dates and their calendar link;
 * everyone else gets only how many glowing days are ahead.
 */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 });
  try {
    const body = await req.json();
    const input = parseBirthInput(body?.input);
    const today = String(body?.today ?? '');
    let timeZone = String(body?.timeZone ?? input.timeZone);
    try { new Intl.DateTimeFormat('en-US', { timeZone }); } catch { timeZone = input.timeZone; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || Math.abs(Date.parse(`${today}T12:00:00Z`) - Date.now()) > 36 * 3600 * 1000) throw new Error('Bad date.');

    const access = await forecastAccess(admin, user);
    const f = await forecastFor(admin, user.id, input, timeZone, today);
    const counts = { alignments: f.days.filter((g) => g.n === 6).length, convergences: f.days.filter((g) => g.n === 7).length };
    if (!access) return NextResponse.json({ access: false, counts, hasNext: !!f.next });
    const token = await feedToken(admin, user.id, timeZone, body?.reset === true);
    return NextResponse.json({ access: true, counts, days: f.days, next: f.next, token });
  } catch (e) {
    console.error('[convergence]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
