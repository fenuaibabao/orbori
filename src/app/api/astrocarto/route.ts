import { NextResponse } from 'next/server';
import { cartoFor } from '@/lib/astrocarto-server';
import { parseBirthInput } from '@/lib/validate';

export const runtime = 'nodejs';

/** POST { input } → planet lines and power places. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json(cartoFor(parseBirthInput(body?.input)));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
