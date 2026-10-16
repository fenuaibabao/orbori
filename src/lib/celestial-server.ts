import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isOwnerEmail } from './owner';
import { sevenPaths } from './paths';
import type { ActivityLog, CheckIn } from './progress';
import { serverProgress } from './server-progress';
import { currentUser, supabaseAdmin } from './supabase/server';

export const todayUtc = () => new Date().toISOString().slice(0, 10);

/** Signed-in Celestial (checked against account data) or a ready-made error. The owner always passes, for testing. */
export async function requireCelestial() {
  const admin = supabaseAdmin();
  if (!admin) return { error: NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 }) };
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: 'Sign in first.' }, { status: 401 }) };
  const progress = await serverProgress(admin, user.id, todayUtc());
  if (progress.levelIndex < 4 && !isOwnerEmail(user.email)) return { error: NextResponse.json({ error: 'This opens at Celestial.' }, { status: 403 }) };
  return { admin, user, progress };
}

/** The Seven Paths worked out from account data. */
export async function serverPaths(admin: SupabaseClient, userId: string) {
  const [c, p] = await Promise.all([
    admin.from('check_ins').select('date, answer, score').eq('user_id', userId),
    admin.from('profiles').select('input, activity').eq('user_id', userId).maybeSingle(),
  ]);
  const checkIns: Record<string, CheckIn> = {};
  for (const r of c.data ?? []) checkIns[r.date] = { answer: r.answer, score: Number(r.score) };
  const birthDate = (p.data?.input as { date?: string } | undefined)?.date ?? '2000-01-01';
  return sevenPaths({ checkIns, activity: (p.data?.activity ?? {}) as ActivityLog, birthDate });
}

/** ISO week key like 2026-W42 (Monday start). */
export function weekKey(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - first.getTime()) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
