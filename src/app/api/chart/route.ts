import { NextResponse } from 'next/server';
import { computeChart } from '@/lib/astro';
import { chartRarity } from '@/lib/rarity';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const input = parseBirthInput(await req.json());
    const chart = computeChart(input);
    return NextResponse.json({ chart, rarity: chartRarity(chart) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
