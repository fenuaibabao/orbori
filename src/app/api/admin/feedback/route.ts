import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/admin';
import { betaCode } from '@/lib/beta';

export const runtime = 'nodejs';

/** Recent feedback, beta testers and the tester link, for Mission control. */
export async function GET() {
  const r = await requireOwner();
  if ('error' in r) return r.error;
  const { admin } = r;
  const [{ data: feedback }, { data: testers }, users] = await Promise.all([
    admin.from('feedback').select('id, email, page, message, created_at').order('created_at', { ascending: false }).limit(100),
    admin.from('subscriptions').select('user_id, updated_at').eq('note', 'beta tester').eq('status', 'active'),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const emailOf = new Map((users.data?.users ?? []).map((u) => [u.id, u.email]));
  return NextResponse.json({
    betaPath: `/beta/${betaCode()}`,
    feedback: feedback ?? [],
    testers: (testers ?? []).map((t) => ({ email: emailOf.get(t.user_id) ?? '(unknown)', since: t.updated_at })),
  });
}
