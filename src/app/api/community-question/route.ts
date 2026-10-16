import { NextResponse } from 'next/server';
import { handleFromSeed } from '@/lib/identity';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** A Celestial-written journal question for the day (approved ones rotate by date), with the writer's handle. */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  const date = new URL(req.url).searchParams.get('date') ?? '';
  if (!admin || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ question: null });
  const { data } = await admin.from('question_submissions').select('user_id, text').eq('status', 'approved').order('reviewed_at');
  if (!data?.length) return NextResponse.json({ question: null });
  const n = Math.floor(Date.parse(`${date}T12:00:00Z`) / 86400000);
  const pick = data[n % data.length];
  const { data: p } = await admin.from('profiles').select('seed').eq('user_id', pick.user_id).maybeSingle();
  return NextResponse.json({ question: pick.text, by: p ? handleFromSeed(p.seed) : 'a Celestial' });
}
