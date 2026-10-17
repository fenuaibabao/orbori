import { NextResponse } from 'next/server';
import { handleFromSeed } from '@/lib/identity';
import { invitesEnabled, sealInvite } from '@/lib/invite';
import type { BirthInput } from '@/lib/astro/types';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** POST → a "Join my constellation" link for the signed-in person. */
export async function POST() {
  if (!invitesEnabled()) return NextResponse.json({ error: 'Invites are switching on soon.' }, { status: 503 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { data: p } = await admin.from('profiles').select('input, seed').eq('user_id', user.id).maybeSingle<{ input: BirthInput; seed: number }>();
  if (!p) return NextResponse.json({ error: 'Your chart is still syncing. Try again in a moment.' }, { status: 409 });
  const token = sealInvite({ uid: user.id, input: p.input, handle: handleFromSeed(p.seed), seed: p.seed, kind: 'constellation' });
  return NextResponse.json({ path: `/join/${token}` });
}
