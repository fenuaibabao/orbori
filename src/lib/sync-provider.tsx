'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { readState, replaceState } from './store';
import { supabase } from './supabase/client';
import { merge, pullState, pushState } from './sync';

interface SyncState {
  /** true once the signed-in account has been merged into this device (or when signed out) */
  ready: boolean;
  error: string | null;
}
const SyncContext = createContext<SyncState>({ ready: true, error: null });
export const useSync = () => useContext(SyncContext);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { ready: authReady, user } = useAuth();
  const [state, setState] = useState<SyncState>({ ready: false, error: null });
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!authReady) return;
    const sb = supabase();
    if (!sb || !userId) { setState({ ready: true, error: null }); return; }

    let cancelled = false;
    let merged = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fail = (e: unknown) => { if (!cancelled) setState({ ready: true, error: (e as Error).message }); };
    const push = () => {
      if (!merged) return;
      clearTimeout(timer);
      timer = setTimeout(() => pushState(sb, userId, readState()).then(() => !cancelled && setState({ ready: true, error: null }), fail), 400);
    };
    setState({ ready: false, error: null });
    pullState(sb, userId)
      .then((remote) => {
        if (cancelled) return;
        const m = merge(readState(), remote);
        merged = true;
        replaceState(m); // fires 'orbori-store' → push
        setState({ ready: true, error: null });
      })
      .catch(fail);
    window.addEventListener('orbori-store', push);
    return () => { cancelled = true; clearTimeout(timer); window.removeEventListener('orbori-store', push); };
  }, [authReady, userId]);

  return <SyncContext.Provider value={state}>{children}</SyncContext.Provider>;
}
