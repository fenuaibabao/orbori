import { NextResponse } from 'next/server';
import { computeChart } from '@/lib/astro';
import { coarse } from '@/lib/coarse';
import { compatibility } from '@/lib/compat';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const a = computeChart(parseBirthInput(body?.a));
    const b = computeChart(parseBirthInput(body?.b));
    return NextResponse.json({ compat: compatibility(a, b), a: coarse(a), b: coarse(b) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
