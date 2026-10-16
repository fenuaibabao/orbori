import { NextResponse } from 'next/server';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Feedback is switching on soon.' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { message?: string; page?: string; email?: string };
  const message = String(body.message ?? '').trim().slice(0, 4000);
  if (!message) return NextResponse.json({ error: 'Write something first.' }, { status: 400 });
  const user = await currentUser();
  const email = user?.email ?? (String(body.email ?? '').trim().slice(0, 200) || null);
  const { error } = await admin.from('feedback').insert({ user_id: user?.id ?? null, email, page: String(body.page ?? '').slice(0, 200), message });
  if (error) return NextResponse.json({ error: 'Could not send. Try again in a moment.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
