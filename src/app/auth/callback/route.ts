import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/** Where the magic-link email and Google send people back. Exchanges the code for a session, then lands in the app. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const sb = await supabaseServer();
  if (code && sb) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL('/signin?error=link', url.origin));
}
