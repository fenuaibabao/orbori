/** Shared Plus rule (client and server): active or trialing, and a gift with an end date hasn't ended. */
export function isPlusRow(row: { status?: string | null; plan?: string | null; current_period_end?: string | null } | null | undefined, now = Date.now()): boolean {
  if (!row || !['active', 'trialing'].includes(row.status ?? '')) return false;
  if (row.plan === 'gift' && row.current_period_end && Date.parse(row.current_period_end) < now) return false;
  return true;
}
