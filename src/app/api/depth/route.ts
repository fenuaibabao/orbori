import { NextResponse } from 'next/server';
import { computeChart } from '@/lib/astro';
import { chartDepth } from '@/lib/astro/depth';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseBirthInput(body?.input);
    const today = String(body?.today ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error('Bad date.');
    return NextResponse.json({ depth: chartDepth(computeChart(input), today) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
