import { NextResponse } from 'next/server';
import { handleFromSeed } from '@/lib/identity';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Hall of the Sky: Celestials who chose to be listed. Handles only. */
export async function GET() {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ people: [] });
  const { data: rows } = await admin.from('celestials').select('user_id, number, reached_at').eq('public', true).order('number');
  const ids = (rows ?? []).map((r) => r.user_id);
  const { data: profiles } = ids.length ? await admin.from('profiles').select('user_id, seed').in('user_id', ids) : { data: [] };
  const seed = new Map((profiles ?? []).map((p) => [p.user_id, p.seed]));
  return NextResponse.json({
    people: (rows ?? []).filter((r) => seed.has(r.user_id)).map((r) => ({ number: r.number, handle: handleFromSeed(seed.get(r.user_id)!), seed: seed.get(r.user_id), reached: r.reached_at.slice(0, 10) })),
  });
}
