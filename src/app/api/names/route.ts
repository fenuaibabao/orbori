import { NextResponse } from 'next/server';
import { cleanName } from '@/lib/friend-names';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function who() {
  const admin = supabaseAdmin();
  const user = admin ? await currentUser() : null;
  return { admin, user };
}

/** GET → the name you've asked friends to call you. */
export async function GET() {
  const { admin, user } = await who();
  if (!admin || !user) return NextResponse.json({ error: 'signin' }, { status: 401 });
  const { data } = await admin.from('profiles').select('friend_name').eq('user_id', user.id).maybeSingle();
  return NextResponse.json({ friendName: data?.friend_name ?? null });
}

/**
 * POST { friendName } → set (or clear) what friends call you.
 * POST { friendId, nickname } → set (or clear) your private nickname for a linked friend.
 */
export async function POST(req: Request) {
  const { admin, user } = await who();
  if (!admin || !user) return NextResponse.json({ error: 'signin' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if ('friendName' in body) {
    const name = cleanName(body.friendName) || null;
    const { error, count } = await admin.from('profiles').update({ friend_name: name }, { count: 'exact' }).eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!count) return NextResponse.json({ error: 'Set up your chart first.' }, { status: 409 });
    return NextResponse.json({ ok: true, friendName: name });
  }
  const friend = String(body.friendId ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(friend) || friend === user.id) return NextResponse.json({ error: 'Pick a friend.' }, { status: 400 });
  const { data: link } = await admin.from('links').select('id')
    .or(`and(a.eq.${user.id},b.eq.${friend}),and(a.eq.${friend},b.eq.${user.id})`).limit(1).maybeSingle();
  if (!link) return NextResponse.json({ error: 'You can only nickname people you are linked with.' }, { status: 403 });
  const nickname = cleanName(body.nickname);
  if (!nickname) await admin.from('star_nicknames').delete().eq('owner', user.id).eq('friend', friend);
  else await admin.from('star_nicknames').upsert({ owner: user.id, friend, nickname, updated_at: new Date().toISOString() });
  return NextResponse.json({ ok: true, nickname: nickname || null });
}
