import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { computeChart } from '@/lib/astro';
import { ANGLE_NAME } from '@/lib/astrocarto-content';
import { bestGetaway } from '@/lib/astrocarto-server';
import { isOwnerEmail } from '@/lib/owner';
import { isPlusRow } from '@/lib/plus-status';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';
import { parseBirthInput } from '@/lib/validate';
import { HAIR, SKIN, visionPrompt, VISION_KINDS, type Look, type VisionKind } from '@/lib/visions';

export const runtime = 'nodejs';
export const maxDuration = 120;

const DAILY = 3;
const BUCKET = 'visions';
const MODEL = () => process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

async function who() {
  const admin = supabaseAdmin();
  const user = await currentUser();
  return { admin, user };
}

/** GET → whether Visions are on, and your saved visions (private links that last a week). */
export async function GET() {
  const enabled = !!process.env.OPENAI_API_KEY;
  const { admin, user } = await who();
  if (!admin || !user) return NextResponse.json({ enabled, items: [], usedToday: 0, limit: DAILY });
  const { data } = await admin.from('visions').select('id, kind, note, path, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
  const rows = data ?? [];
  const signed = rows.length ? await admin.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.path), 7 * 86400) : { data: [] };
  const today = new Date().toISOString().slice(0, 10);
  return NextResponse.json({
    enabled,
    items: rows.map((r, i) => ({ id: r.id, kind: r.kind, note: r.note, created_at: r.created_at, url: signed.data?.[i]?.signedUrl ?? null })),
    usedToday: rows.filter((r) => r.created_at.startsWith(today)).length,
    limit: isOwnerEmail(user.email) ? 50 : DAILY,
  });
}

/** POST { kind, input, look } → a new vision (Plus members, a few a day). */
export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'Cosmic Visions are being switched on. Check back soon.' }, { status: 503 });
  const { admin, user } = await who();
  if (!admin) return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
  if (!user) return NextResponse.json({ error: 'Sign in to make visions.' }, { status: 401 });
  const owner = isOwnerEmail(user.email);
  if (!owner) {
    const { data: sub } = await admin.from('subscriptions').select('status, plan, current_period_end').eq('user_id', user.id).maybeSingle();
    if (!isPlusRow(sub)) return NextResponse.json({ error: 'Cosmic Visions are part of Orbori Plus.' }, { status: 402 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await admin.from('visions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`);
  if ((count ?? 0) >= (owner ? 50 : DAILY)) return NextResponse.json({ error: `That's today's ${DAILY} visions. More tomorrow.` }, { status: 429 });

  try {
    const body = await req.json();
    const kind = body?.kind as VisionKind;
    if (!VISION_KINDS.some((k) => k.id === kind)) throw new Error('Pick a vision.');
    const input = parseBirthInput(body?.input);
    const look: Look = {
      skin: SKIN.includes(body?.look?.skin) ? body.look.skin : undefined,
      hair: HAIR.includes(body?.look?.hair) ? body.look.hair : undefined,
    };
    const chart = computeChart(input);
    let note: string | null = null;
    let place: { label: string; planet: string } | undefined;
    if (kind === 'getaway') {
      const g = bestGetaway(input, Math.floor(Math.random() * 1000));
      if (!g) throw new Error('None of your Venus, Jupiter or Sun lines pass close to a big city. Your map is still worth a look.');
      place = { label: g.label, planet: g.planet };
      note = `${g.label}: ${g.km} km from your ${g.planet} ${ANGLE_NAME[g.angle].toLowerCase()} line.`;
    }
    const prompt = visionPrompt(kind, chart, look, place);

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL(), prompt, size: '1024x1536', quality: 'medium', n: 1, user: createHash('sha256').update(user.id).digest('hex').slice(0, 16) }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[visions]', out?.error);
      const msg = out?.error?.code === 'moderation_blocked' ? 'That vision was blocked by the image safety filter. Try another.' : out?.error?.message ?? `Image error ${res.status}`;
      throw new Error(msg);
    }
    const b64 = out?.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image came back. Try again.');

    const id = randomUUID();
    const path = `${user.id}/${id}.png`;
    const up = await admin.storage.from(BUCKET).upload(path, Buffer.from(b64, 'base64'), { contentType: 'image/png' });
    if (up.error) throw new Error(up.error.message);
    await admin.from('visions').insert({ id, user_id: user.id, kind, note, path });
    const { data: s } = await admin.storage.from(BUCKET).createSignedUrl(path, 7 * 86400);
    return NextResponse.json({ id, kind, note, url: s?.signedUrl ?? null, created_at: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

/** DELETE ?id= → remove one of your visions. */
export async function DELETE(req: Request) {
  const { admin, user } = await who();
  if (!admin || !user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const { data } = await admin.from('visions').select('path').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  await admin.storage.from(BUCKET).remove([data.path]);
  await admin.from('visions').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
