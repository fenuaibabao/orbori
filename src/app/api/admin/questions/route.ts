import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/admin';
import { handleFromSeed } from '@/lib/identity';

export const runtime = 'nodejs';

/** Owner: review daily questions Celestials have written. */
export async function GET() {
  const o = await requireOwner();
  if ('error' in o) return o.error;
  const { data } = await o.admin.from('question_submissions').select('id, user_id, text, status, created_at').order('created_at', { ascending: false }).limit(100);
  const ids = Array.from(new Set((data ?? []).map((d) => d.user_id)));
  const { data: profiles } = ids.length ? await o.admin.from('profiles').select('user_id, seed').in('user_id', ids) : { data: [] };
  const seed = new Map((profiles ?? []).map((p) => [p.user_id, p.seed]));
  return NextResponse.json({ items: (data ?? []).map(({ user_id, ...r }) => ({ ...r, by: seed.has(user_id) ? handleFromSeed(seed.get(user_id)!) : 'unknown' })) });
}

export async function POST(req: Request) {
  const o = await requireOwner();
  if ('error' in o) return o.error;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || !['approved', 'rejected', 'pending'].includes(status ?? '')) return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  const { error } = await o.admin.from('question_submissions').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
