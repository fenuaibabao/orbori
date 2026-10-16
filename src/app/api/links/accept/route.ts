import { NextResponse } from 'next/server';
import { openInvite } from '@/lib/invite';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** Accept an invite while signed in: links the two accounts both ways. Body: { token }. */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  try {
    const p = openInvite(String((await req.json())?.token ?? ''));
    if (!p.uid) return NextResponse.json({ error: 'This invite was made without an account, so it can\'t be linked. Ask them to send a new one while signed in.' }, { status: 400 });
    if (p.uid === user.id) return NextResponse.json({ error: 'That is your own invite.' }, { status: 400 });
    const { data: theirs } = await admin.from('profiles').select('user_id').eq('user_id', p.uid).maybeSingle();
    if (!theirs) return NextResponse.json({ error: 'The inviter\'s account no longer has a chart.' }, { status: 404 });
    const { data: mine } = await admin.from('profiles').select('user_id').eq('user_id', user.id).maybeSingle();
    if (!mine) return NextResponse.json({ error: 'Save your own chart first (it syncs a moment after you sign in).' }, { status: 409 });
    const [a, b] = [p.uid, user.id].sort();
    const { error } = await admin.from('links').upsert({ a, b }, { onConflict: 'a,b', ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, handle: p.handle });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
