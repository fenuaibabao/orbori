import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/admin';
import { igToken, whoAmI } from '@/lib/social';

export const runtime = 'nodejs';

/** Owner: the Instagram queue, its connection and the pause switch. */
export async function GET() {
  const o = await requireOwner();
  if ('error' in o) return o.error;
  const { admin } = o;
  const [posts, paused] = await Promise.all([
    admin.from('social_posts').select('id, kind, slug, scheduled_at, status, caption, error, posted_at').order('scheduled_at', { ascending: true, nullsFirst: false }).limit(60),
    admin.from('social_settings').select('value').eq('key', 'paused').maybeSingle(),
  ]);
  let account: { username: string } | null = null;
  let connection = 'not connected';
  const token = await igToken(admin).catch(() => null);
  if (token && process.env.IG_USER_ID) {
    try { account = await whoAmI(token); connection = 'connected'; } catch (e) { connection = (e as Error).message; }
  }
  return NextResponse.json({ posts: posts.data ?? [], paused: paused.data?.value === 'true', connection, account });
}

/** POST { action: 'pause' | 'resume' | 'release' | 'cancel' | 'retry', id? } */
export async function POST(req: Request) {
  const o = await requireOwner();
  if ('error' in o) return o.error;
  const { admin } = o;
  const { action, id } = (await req.json().catch(() => ({}))) as { action?: string; id?: string };
  if (action === 'pause' || action === 'resume') {
    await admin.from('social_settings').upsert({ key: 'paused', value: String(action === 'pause'), updated_at: new Date().toISOString() });
  } else if (action === 'release' && id) {
    // Held post (Founding 111): goes out on the next run.
    await admin.from('social_posts').update({ status: 'scheduled', scheduled_at: new Date().toISOString() }).eq('id', id).eq('status', 'held');
  } else if (action === 'cancel' && id) {
    await admin.from('social_posts').update({ status: 'canceled' }).eq('id', id).in('status', ['scheduled', 'held', 'failed']);
  } else if (action === 'retry' && id) {
    await admin.from('social_posts').update({ status: 'scheduled', attempts: 0, error: null, scheduled_at: new Date().toISOString() }).eq('id', id).in('status', ['failed', 'canceled']);
  } else return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
