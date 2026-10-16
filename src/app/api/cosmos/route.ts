import { NextResponse } from 'next/server';
import { computeChart } from '@/lib/astro';
import { challengeGoal, circleQuestion, circlesFor, MIN_CIRCLE, REACTIONS } from '@/lib/circles';
import { weekStart } from '@/lib/progress';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';

/**
 * POST { input, date } → your Circles with anonymous crowd stats.
 * POST { action: 'react', circle, reaction, date } and { action: 'optout', value }.
 * Stats only show for Circles with at least 10 people, so nobody can be picked out.
 */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date)) ? String(body.date) : new Date().toISOString().slice(0, 10);

  if (body.action === 'react') {
    if (!REACTIONS.some((r) => r.id === body.reaction)) return NextResponse.json({ error: 'Pick a reaction.' }, { status: 400 });
    const { data: p } = await admin.from('profiles').select('circles').eq('user_id', user.id).maybeSingle();
    if (!p?.circles?.includes(String(body.circle))) return NextResponse.json({ error: 'Not your Circle.' }, { status: 403 });
    await admin.from('circle_reactions').upsert({ user_id: user.id, circle: String(body.circle), date, reaction: body.reaction });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'optout') {
    await admin.from('profiles').update({ cosmos_opt_out: !!body.value }).eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  }

  try {
    const input = parseBirthInput(body.input);
    const circles = circlesFor(computeChart(input), date);
    const keys = circles.map((c) => c.key);
    const { data: prof } = await admin.from('profiles').update({ circles: keys }).eq('user_id', user.id).select('cosmos_opt_out').maybeSingle();
    const monday = weekStart(date);
    const [stats, reacts, mine] = await Promise.all([
      admin.rpc('cosmos_stats', { keys, d: date, week_start: monday }),
      admin.from('circle_reactions').select('circle, reaction').in('circle', keys).eq('date', date),
      admin.from('circle_reactions').select('circle, reaction').eq('user_id', user.id).eq('date', date),
    ]);
    if (stats.error) throw stats.error;
    const q = circleQuestion(date);
    return NextResponse.json({
      saved: !!prof, optOut: !!prof?.cosmos_opt_out, monday, question: q,
      circles: circles.map((c) => {
        const s = (stats.data ?? []).find((x: { circle: string }) => x.circle === c.key) as Record<string, number> | undefined;
        const members = Number(s?.members ?? 0);
        const open = members >= MIN_CIRCLE;
        const counts = Object.fromEntries(REACTIONS.map((r) => [r.id, (reacts.data ?? []).filter((x) => x.circle === c.key && x.reaction === r.id).length]));
        const goal = challengeGoal(members);
        return {
          ...c, members, open,
          today: open ? { checked: Number(s?.checked ?? 0), nailed: Number(s?.nailed ?? 0), kinda: Number(s?.kinda ?? 0), nope: Number(s?.nope ?? 0), avg: s?.avg_score == null ? null : Number(s.avg_score) } : null,
          week: open ? { checkins: Number(s?.week_checkins ?? 0), goal, won: Number(s?.week_checkins ?? 0) >= goal } : null,
          reactions: open ? counts : null,
          mine: (mine.data ?? []).find((x) => x.circle === c.key)?.reaction ?? null,
        };
      }),
    });
  } catch (e) {
    console.error('[cosmos]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
