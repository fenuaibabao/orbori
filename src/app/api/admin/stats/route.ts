import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET() {
  const r = await requireOwner();
  if ('error' in r) return r.error;
  const { admin } = r;
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [users, profiles, plus, gifts, checkIns, links, recent, visions] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('profiles').select('user_id', { count: 'exact', head: true }),
    admin.from('subscriptions').select('user_id', { count: 'exact', head: true }).in('status', ['active', 'trialing']).neq('plan', 'gift'),
    admin.from('subscriptions').select('user_id', { count: 'exact', head: true }).eq('plan', 'gift').eq('status', 'active'),
    admin.from('check_ins').select('user_id', { count: 'exact', head: true }).gte('date', since),
    admin.from('links').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('user_id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    admin.from('visions').select('cost_usd').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);
  const costs = (visions.data ?? []).map((v) => Number(v.cost_usd)).filter((x) => x > 0);
  return NextResponse.json({
    accounts: users.data?.users.length ?? null,
    accountsTotalApprox: users.data && users.data.users.length >= 1000 ? '1000+' : null,
    charts: profiles.count ?? 0,
    newThisWeek: recent.count ?? 0,
    plusPaying: plus.count ?? 0,
    plusGifted: gifts.count ?? 0,
    checkInsThisWeek: checkIns.count ?? 0,
    links: links.count ?? 0,
    visions30d: visions.data?.length ?? 0,
    visionCostAvg: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
    visionCost30d: costs.reduce((a, b) => a + b, 0),
  });
}
