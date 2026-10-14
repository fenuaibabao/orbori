import { NextResponse } from 'next/server';
import { searchCities } from '@/lib/cities';

export const runtime = 'nodejs';

export function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  return NextResponse.json({ cities: searchCities(q.slice(0, 80)) });
}
