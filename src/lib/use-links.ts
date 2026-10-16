'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { localToday, readState, replaceState } from './store';

export interface LinkedPerson {
  id: string; userId: string; handle: string; seed: number; since: string;
  sun: string; moon: string; rising: string | null; animal: string; lifePath: number; tzolkin: string; big3: string;
  compat: number;
  today: { agree: number; total: number; sameMajority: boolean; theirHeadline: string; theirScore: number; checkedIn: boolean };
  nudgedMe: boolean; nudgedByMe: boolean;
}

export function useLinks() {
  const { user, ready } = useAuth();
  const [links, setLinks] = useState<LinkedPerson[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!user) { setLinks([]); return; }
    const { date, timeZone } = localToday();
    try {
      const r = await fetch(`/api/links?date=${date}&tz=${encodeURIComponent(timeZone)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setLinks(d.links);
    } catch (e) { setError((e as Error).message); setLinks([]); }
  }, [user]);
  useEffect(() => { if (ready) refresh(); }, [ready, refresh]);

  const nudge = useCallback(async (to: string) => {
    const { date } = localToday();
    const r = await fetch('/api/links/nudge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to, date }) });
    if (r.ok) {
      setLinks((ls) => ls?.map((l) => (l.userId === to ? { ...l, nudgedByMe: true } : l)) ?? null);
      const s = readState();
      replaceState({ ...s, activity: { ...s.activity, [date]: { ...(s.activity?.[date] ?? {}), nudge: true } } });
    }
    return r.ok;
  }, []);
  const unlink = useCallback(async (id: string) => {
    const r = await fetch('/api/links', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
    if (r.ok) setLinks((ls) => ls?.filter((l) => l.id !== id) ?? null);
    return r.ok;
  }, []);
  return { links, error, refresh, nudge, unlink, signedIn: Boolean(user) };
}
