import { NextResponse } from 'next/server';
import { labelsFor } from '@/lib/friend-names';
import { openInvite } from '@/lib/invite';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** POST { token } → who's inviting you, their constellation's name, and a peek at its members. Never birth details. */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  try {
    const p = openInvite(String((await req.json())?.token ?? ''));
    if (!p.uid) throw new Error('This invite link is broken or expired.');
    const [{ data: named }, { data: links }, { data: inviter }] = await Promise.all([
      admin.from('constellations').select('name').eq('user_id', p.uid).maybeSingle(),
      admin.from('links').select('a, b').or(`a.eq.${p.uid},b.eq.${p.uid}`).limit(11),
      admin.from('profiles').select('seed').eq('user_id', p.uid).maybeSingle(),
    ]);
    // Show the inviter as they are now: the name they chose for friends, or their current handle.
    const seed = (inviter?.seed as number | undefined) ?? p.seed;
    const handle = (await labelsFor(admin, '00000000-0000-0000-0000-000000000000', [{ id: p.uid, seed }])).get(p.uid)!.label;
    const others = (links ?? []).map((l) => (l.a === p.uid ? l.b : l.a));
    const { data: seeds } = others.length ? await admin.from('profiles').select('seed').in('user_id', others.slice(0, 4)) : { data: [] };
    const user = await currentUser();
    return NextResponse.json({
      handle, seed, name: named?.name ?? null, count: others.length + 1,
      seeds: [seed, ...(seeds ?? []).map((s) => s.seed)], self: user?.id === p.uid, already: !!user && others.includes(user.id),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
