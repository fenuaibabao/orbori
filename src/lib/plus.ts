'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { isOwnerEmail } from './owner';
import { isPlusRow } from './plus-status';
import { supabase } from './supabase/client';

export interface PlusState {
  ready: boolean;
  /** true while a subscription is active (including the paid-up remainder after cancelling) */
  plus: boolean;
  status: string;
  plan: 'monthly' | 'yearly' | 'gift' | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Founding 111 member number, kept forever. */
  founding: number | null;
  refresh: () => Promise<void>;
}

const NONE = { plus: false, status: 'none', plan: null, periodEnd: null, cancelAtPeriodEnd: false, founding: null };

export function usePlus(): PlusState {
  const { ready: authReady, user } = useAuth();
  const [s, setS] = useState<Omit<PlusState, 'ready' | 'refresh'>>(NONE);
  const [ready, setReady] = useState(false);
  const userId = user?.id ?? null;
  const owner = isOwnerEmail(user?.email);

  const refresh = useCallback(async () => {
    const sb = supabase();
    if (!sb || !userId) { setS(NONE); setReady(true); return; }
    const { data: fm } = await sb.from('founding_members').select('number').eq('user_id', userId).maybeSingle();
    const founding = (fm?.number as number | undefined) ?? null;
    if (owner) { setS({ plus: true, status: 'owner', plan: null, periodEnd: null, cancelAtPeriodEnd: false, founding }); setReady(true); return; }
    const { data } = await sb.from('subscriptions').select('status, plan, current_period_end, cancel_at_period_end').eq('user_id', userId).maybeSingle();
    const status = data?.status ?? 'none';
    setS({
      plus: isPlusRow(data),
      status,
      plan: (data?.plan as 'monthly' | 'yearly' | 'gift' | null) ?? null,
      periodEnd: data?.current_period_end ?? null,
      cancelAtPeriodEnd: Boolean(data?.cancel_at_period_end),
      founding,
    });
    setReady(true);
  }, [userId, owner]);

  useEffect(() => { if (authReady) refresh(); }, [authReady, refresh]);
  useEffect(() => {
    const onFocus = () => { if (userId) refresh(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userId, refresh]);

  return { ready, refresh, ...s };
}

/** POSTs to a billing route and sends the browser to Stripe. Returns an error message, or null after redirecting. */
export async function goToBilling(path: '/api/billing/checkout' | '/api/billing/portal', body?: unknown): Promise<string | null> {
  const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.url) return d.error ?? 'Something went wrong. Try again.';
  window.location.assign(d.url);
  return null;
}
