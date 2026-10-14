import { NextResponse } from 'next/server';
import { computeChart } from '@/lib/astro';
import { cosmicCouncil } from '@/lib/council';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseBirthInput(body?.input);
    const date = String(body?.date ?? '');
    const timeZone = String(body?.timeZone ?? input.timeZone);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Bad date.');
    const reading = cosmicCouncil(computeChart(input), date, timeZone);
    return NextResponse.json({ reading });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
