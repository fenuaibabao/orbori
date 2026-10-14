import { NextResponse } from 'next/server';
import { computeChart } from '@/lib/astro';
import { coarse } from '@/lib/coarse';
import { compatibility } from '@/lib/compat';
import { openInvite } from '@/lib/invite';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';

/**
 * Open an invite. Without `input` it returns who invited you (handle, sigil, Big Three).
 * With the visitor's own `input` it returns the full reading from the visitor's side.
 * The inviter's birth details never leave the server.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const p = openInvite(String(body?.token ?? ''));
    const them = computeChart(p.input);
    const inviter = { handle: p.handle, seed: p.seed, nickname: p.nickname ?? null, ...coarse(them) };
    if (!body?.input) return NextResponse.json({ inviter });
    const me = computeChart(parseBirthInput(body.input));
    return NextResponse.json({ inviter, me: coarse(me), compat: compatibility(me, them) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
