import 'server-only';
import { NextResponse } from 'next/server';
import { isOwnerEmail } from './owner';
import { currentUser, supabaseAdmin } from './supabase/server';

/** Resolves the owner and the service-role client, or a ready-made error response. */
export async function requireOwner() {
  const user = await currentUser();
  if (!user || !isOwnerEmail(user.email)) return { error: NextResponse.json({ error: 'Owners only.' }, { status: 403 }) };
  const admin = supabaseAdmin();
  if (!admin) return { error: NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 }) };
  return { user, admin };
}

/** Find an auth user by email (small user base: page through). */
export async function findUserByEmail(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, email: string) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 1000) break;
  }
  return null;
}
