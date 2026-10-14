import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { accountsEnabled, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/** Server client that reads the signed-in user from cookies (route handlers and server components). */
export async function supabaseServer() {
  if (!accountsEnabled) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => { try { for (const c of list) store.set(c.name, c.value, c.options); } catch { /* read-only context */ } },
    },
  });
}

/** The signed-in user for this request, or null. */
export async function currentUser() {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

/** Service-role client for trusted server work (the Stripe webhook). Bypasses row-level security: never expose. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!accountsEnabled || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
