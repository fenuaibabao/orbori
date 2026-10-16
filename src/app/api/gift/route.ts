import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { handleFromSeed } from '@/lib/identity';
import { serverProgress } from '@/lib/server-progress';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
const YEAR = 365 * 86400000;

/** GET ?code= → whether a gift link is still good (and who it's from, by handle only). */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const code = new URL(req.url).searchParams.get('code') ?? '';
  const { data: g } = await admin.from('plus_gifts').select('from_user, redeemed_at').eq('code', code).maybeSingle();
  if (!g) return NextResponse.json({ valid: false });
  const { data: p } = await admin.from('profiles').select('seed').eq('user_id', g.from_user).maybeSingle();
  return NextResponse.json({ valid: !g.redeemed_at, from: p ? handleFromSeed(p.seed) : 'A friend' });
}

/** POST → your gift link (Oracle and up, one a year). Returns the existing one if it's this year's. */
export async function POST() {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const p = await serverProgress(admin, user.id, new Date().toISOString().slice(0, 10));
  if (p.levelIndex < 3) return NextResponse.json({ error: 'Gifting unlocks at Oracle.' }, { status: 403 });
  const { data: last } = await admin.from('plus_gifts').select('code, created_at, redeemed_at').eq('from_user', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (last && Date.now() - Date.parse(last.created_at) < YEAR) return NextResponse.json({ code: last.code, redeemed: !!last.redeemed_at, next: new Date(Date.parse(last.created_at) + YEAR).toISOString() });
  const code = randomBytes(8).toString('base64url');
  const { error } = await admin.from('plus_gifts').insert({ code, from_user: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code, redeemed: false });
}
