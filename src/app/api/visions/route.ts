import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { computeChart } from '@/lib/astro';
import { ANGLE_NAME } from '@/lib/astrocarto-content';
import { bestGetaway, venusPlace } from '@/lib/astrocarto-server';
import { isOwnerEmail } from '@/lib/owner';
import { isPlusRow } from '@/lib/plus-status';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';
import { parseBirthInput } from '@/lib/validate';
import { imageCost, PACKS } from '@/lib/credits';
import { BETA } from '@/lib/beta';
import { HAIR, palette, SKIN, visionPrompt, VISION_KINDS, type Look, type VisionKind } from '@/lib/visions';

export const runtime = 'nodejs';
export const maxDuration = 120;

const DAILY = 3;
/** Per calendar month, so heavy use can't outrun what Plus costs. */
const MONTHLY = 20;
const BUCKET = 'visions';
/** With credits, a looser daily ceiling that only stops runaway use. */
const CREDIT_DAILY = 25;

/** In a discounted Founding year, free visions are 10 a month. */
async function monthlyCap(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, userId: string, sub: { plan?: string | null } | null) {
  if (sub?.plan !== 'yearly') return MONTHLY;
  const { data } = await admin.from('founding_members').select('joined_at').eq('user_id', userId).maybeSingle();
  return data && Date.now() - Date.parse(data.joined_at) < 365 * 86400000 ? 10 : MONTHLY;
}

async function balance(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, userId: string) {
  const { data } = await admin.from('credit_ledger').select('delta').eq('user_id', userId);
  return (data ?? []).reduce((s, r) => s + r.delta, 0);
}
const MODEL = () => process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const FALLBACK = 'gpt-image-1.5';

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
  const owner = isOwnerEmail(user.email);
  const { count: month } = await admin.from('visions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('paid', false).gte('created_at', `${today.slice(0, 7)}-01T00:00:00Z`);
  const { count: freeToday } = await admin.from('visions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('paid', false).gte('created_at', `${today}T00:00:00Z`);
  const usedToday = owner ? rows.filter((r) => r.created_at.startsWith(today)).length : freeToday ?? 0;
  const credits = await balance(admin, user.id);
  let plusOn = owner;
  let cap = MONTHLY;
  if (!owner) {
    const { data: sub } = await admin.from('subscriptions').select('status, plan, current_period_end').eq('user_id', user.id).maybeSingle();
    plusOn = isPlusRow(sub);
    cap = await monthlyCap(admin, user.id, sub);
  }
  return NextResponse.json({
    credits,
    allowance: plusOn,
    packs: PACKS.map((p) => ({ ...p, open: !BETA || owner })),
    enabled,
    items: rows.map((r, i) => ({ id: r.id, kind: r.kind, note: r.note, created_at: r.created_at, url: signed.data?.[i]?.signedUrl ?? null })),
    usedToday,
    limit: owner ? 50 : plusOn ? Math.max(0, Math.min(DAILY, cap - (month ?? 0) + usedToday)) : 0,
    monthLeft: owner || !plusOn ? null : Math.max(0, cap - (month ?? 0)),
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
  const today = new Date().toISOString().slice(0, 10);
  // Plus allowance first (3 a day, 20 a month); after that, or without Plus, a credit pays for each vision.
  let useCredit = false;
  if (!owner) {
    const { data: sub } = await admin.from('subscriptions').select('status, plan, current_period_end').eq('user_id', user.id).maybeSingle();
    const { count: day } = await admin.from('visions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`);
    const { count: month } = await admin.from('visions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('paid', false).gte('created_at', `${today.slice(0, 7)}-01T00:00:00Z`);
    const { count: freeToday } = await admin.from('visions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('paid', false).gte('created_at', `${today}T00:00:00Z`);
    const allowanceLeft = isPlusRow(sub) && (freeToday ?? 0) < DAILY && (month ?? 0) < (await monthlyCap(admin, user.id, sub));
    if (!allowanceLeft) {
      if ((await balance(admin, user.id)) < 1) {
        return NextResponse.json({ error: isPlusRow(sub) ? 'You\'ve used your free visions for now. Grab a pack of credits to keep going.' : 'Visions come with Orbori Plus, or with a pack of credits.', needCredits: true }, { status: 402 });
      }
      if ((day ?? 0) >= CREDIT_DAILY) return NextResponse.json({ error: `That's ${CREDIT_DAILY} visions today. Your credits will keep until tomorrow.` }, { status: 429 });
      useCredit = true;
    }
  } else {
    const { count } = await admin.from('visions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`);
    if ((count ?? 0) >= 50) return NextResponse.json({ error: 'That\'s 50 today.' }, { status: 429 });
  }

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
    if (kind === 'lovestory') {
      const v = venusPlace(input, Math.floor(Math.random() * 1000));
      const venus = chart.western.planets.venus.sign;
      const dsc = chart.western.ascendant ? ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].indexOf(chart.western.ascendant.sign) + 6) % 12] : null;
      if (v) place = { label: v.label, planet: 'Venus' };
      note = `Venus in ${venus}${dsc ? `, ${dsc} on your Descendant` : ''}${v ? `, set in ${v.label} on your Venus ${ANGLE_NAME[v.angle].toLowerCase()} line` : ''}. For fun: love writes its own story.`;
    }
    if (!note) {
      const big3 = [`Sun in ${chart.western.planets.sun.sign}`, `Moon in ${chart.moonSignOptions[0]}`, chart.western.ascendant ? `${chart.western.ascendant.sign} Rising` : null].filter(Boolean).join(', ');
      note = `Inspired by ${big3}. Colors: ${palette(chart).join(', ')}.`;
    }
    const prompt = visionPrompt(kind, chart, look, place);

    const call = (model: string) => fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, prompt, size: '1024x1536', quality: 'medium', n: 1, user: createHash('sha256').update(user.id).digest('hex').slice(0, 16) }),
    });
    let model = MODEL();
    let res = await call(model);
    let out = await res.json().catch(() => ({}));
    // If the newest model isn't available on this account yet, use the previous one.
    if (!res.ok && res.status !== 429 && out?.error?.code !== 'moderation_blocked' && /model|verif|access/i.test(out?.error?.message ?? '')) {
      console.error('[visions] falling back:', out?.error?.message);
      model = FALLBACK;
      res = await call(FALLBACK);
      out = await res.json().catch(() => ({}));
    }
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
    await admin.from('visions').insert({ id, user_id: user.id, kind, note, path, model, cost_usd: imageCost(model, out?.usage), paid: useCredit });
    if (useCredit) await admin.from('credit_ledger').insert({ id: `vision:${id}`, user_id: user.id, delta: -1, reason: kind });
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
