import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ASK_SYSTEM, askClaude, readingPrompt, REFLECT_SYSTEM } from '@/lib/ai-reading';
import { computeChart } from '@/lib/astro';
import { requireCelestial, serverPaths, todayUtc, weekKey } from '@/lib/celestial-server';
import { cosmicCouncil } from '@/lib/council';
import { POLL } from '@/lib/polls';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';
export const maxDuration = 45;

/** Everything on the secret page: number, hall setting, this week's question, this month's reflection, the poll, submissions, gifts. */
export async function GET() {
  const g = await requireCelestial();
  if ('error' in g) return g.error;
  const { admin, user } = g;
  const today = todayUtc();
  // Joining is automatic: the first visit assigns your Celestial number.
  await admin.from('celestials').upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
  const [cel, ask, refl, vote, tally, subs, gifts, paths] = await Promise.all([
    admin.from('celestials').select('number, public, reached_at').eq('user_id', user.id).maybeSingle(),
    admin.from('ai_questions').select('question, answer').eq('user_id', user.id).eq('week', weekKey(today)).maybeSingle(),
    admin.from('monthly_reflections').select('body').eq('user_id', user.id).eq('month', today.slice(0, 7)).maybeSingle(),
    admin.from('votes').select('choice').eq('user_id', user.id).eq('poll', POLL.id).maybeSingle(),
    admin.from('votes').select('choice').eq('poll', POLL.id),
    admin.from('question_submissions').select('id, text, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    admin.from('plus_gifts').select('code, days, redeemed_at, created_at').eq('from_user', user.id).eq('days', 30).order('created_at'),
    serverPaths(admin, user.id),
  ]);
  const counts: Record<string, number> = {};
  for (const v of tally.data ?? []) counts[v.choice] = (counts[v.choice] ?? 0) + 1;
  return NextResponse.json({
    number: cel.data?.number ?? null, public: !!cel.data?.public,
    ask: ask.data ?? null, reflection: refl.data?.body ?? null,
    poll: { ...POLL, mine: vote.data?.choice ?? null, counts },
    submissions: subs.data ?? [],
    gifts: { earned: paths.filter((p) => p.done).length, links: (gifts.data ?? []).map((x) => ({ code: x.code, redeemed: !!x.redeemed_at })) },
  });
}

export async function POST(req: Request) {
  const g = await requireCelestial();
  if ('error' in g) return g.error;
  const { admin, user } = g;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const today = todayUtc();
  const key = process.env.ANTHROPIC_API_KEY;

  switch (body.action) {
    case 'hall': {
      await admin.from('celestials').update({ public: !!body.public }).eq('user_id', user.id);
      return NextResponse.json({ ok: true });
    }
    case 'ask': {
      if (!key) return NextResponse.json({ error: 'The AI is not set up yet.' }, { status: 503 });
      const question = String(body.question ?? '').trim().slice(0, 400);
      if (question.length < 8) return NextResponse.json({ error: 'Ask a full question.' }, { status: 400 });
      const week = weekKey(today);
      const { data: had } = await admin.from('ai_questions').select('answer').eq('user_id', user.id).eq('week', week).maybeSingle();
      if (had) return NextResponse.json({ error: 'You\'ve asked this week\'s question. A new one opens on Monday.' }, { status: 409 });
      const input = parseBirthInput(body.input);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date)) ? String(body.date) : today;
      const council = cosmicCouncil(computeChart(input), date, String(body.timeZone ?? input.timeZone));
      const answer = await askClaude(key, ASK_SYSTEM, `${readingPrompt(council, '')}\n\nTheir question: ${question}`, 3000);
      await admin.from('ai_questions').insert({ user_id: user.id, week, question, answer });
      return NextResponse.json({ question, answer });
    }
    case 'reflect': {
      if (!key) return NextResponse.json({ error: 'The AI is not set up yet.' }, { status: 503 });
      if (body.consent !== true) return NextResponse.json({ error: 'Tick the box to send this month\'s entries to the AI.' }, { status: 400 });
      const month = today.slice(0, 7);
      const { data: had } = await admin.from('monthly_reflections').select('body').eq('user_id', user.id).eq('month', month).maybeSingle();
      if (had) return NextResponse.json({ body: had.body });
      // Entries come from the person's own account, only this month's, and only now.
      const { data: entries } = await admin.from('journal_entries').select('date, text, reading').eq('user_id', user.id).gte('date', `${month}-01`).order('date');
      const usable = (entries ?? []).filter((e) => e.text?.trim());
      if (usable.length < 3) return NextResponse.json({ error: 'Write on at least 3 days this month first.' }, { status: 400 });
      const lines = usable.map((e) => `${e.date}${e.reading?.headline ? ` (Council: "${e.reading.headline}")` : ''}: ${e.text.trim().slice(0, 1200)}`).join('\n\n');
      const text = await askClaude(key, REFLECT_SYSTEM, `Their journal this month:\n\n${lines}`, 3000);
      await admin.from('monthly_reflections').insert({ user_id: user.id, month, body: text });
      return NextResponse.json({ body: text });
    }
    case 'vote': {
      const choice = String(body.choice ?? '');
      if (!POLL.options.includes(choice)) return NextResponse.json({ error: 'Pick one of the options.' }, { status: 400 });
      await admin.from('votes').upsert({ user_id: user.id, poll: POLL.id, choice });
      return NextResponse.json({ ok: true });
    }
    case 'submit': {
      const text = String(body.text ?? '').trim().replace(/\s+/g, ' ');
      if (text.length < 15 || text.length > 200 || !text.endsWith('?')) return NextResponse.json({ error: 'Write one question, 15 to 200 characters, ending with a question mark.' }, { status: 400 });
      const { count } = await admin.from('question_submissions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending');
      if ((count ?? 0) >= 3) return NextResponse.json({ error: 'You have 3 waiting for review already.' }, { status: 409 });
      await admin.from('question_submissions').insert({ user_id: user.id, text });
      return NextResponse.json({ ok: true });
    }
    case 'gift-month': {
      const paths = await serverPaths(admin, user.id);
      const earned = paths.filter((p) => p.done).length;
      const { count } = await admin.from('plus_gifts').select('code', { count: 'exact', head: true }).eq('from_user', user.id).eq('days', 30);
      if ((count ?? 0) >= earned) return NextResponse.json({ error: 'Finish another path to earn another month to give.' }, { status: 403 });
      const code = randomBytes(8).toString('base64url');
      const { error } = await admin.from('plus_gifts').insert({ code, from_user: user.id, days: 30 });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ code });
    }
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
