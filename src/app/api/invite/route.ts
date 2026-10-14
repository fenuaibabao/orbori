import { NextResponse } from 'next/server';
import { invitesEnabled, sealInvite } from '@/lib/invite';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';

const cleanText = (v: unknown, max: number) => String(v ?? '').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, max).trim();

/** Create a "See your side" invite link for the signed-in device's profile. */
export async function POST(req: Request) {
  if (!invitesEnabled()) return NextResponse.json({ error: 'Invites are switching on soon.' }, { status: 503 });
  try {
    const body = await req.json();
    const token = sealInvite({
      input: parseBirthInput(body?.input),
      handle: cleanText(body?.handle, 30) || 'A Cosmic Stranger',
      seed: Math.abs(Number(body?.seed) | 0),
      nickname: cleanText(body?.nickname, 24) || undefined,
    });
    return NextResponse.json({ path: `/invite/${token}` });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
