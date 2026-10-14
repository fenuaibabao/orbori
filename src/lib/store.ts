'use client';
/**
 * On-device storage for the first build (before accounts exist).
 * Everything lives under one key so it can be migrated to the server later.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BirthInput } from './astro/types';
import type { Answer, CheckIn } from './progress';

export interface Profile {
  input: BirthInput;
  cityLabel: string;
  seed: number;
  createdAt: string;
}

export interface Match {
  id: string;
  nickname: string;
  input: BirthInput;
  cityLabel: string;
  seed: number;
  addedAt: string;
}

export interface LocalState {
  profile: Profile | null;
  checkIns: Record<string, CheckIn>;
  matches: Match[];
}

const KEY = 'orbori.v1';
const EMPTY: LocalState = { profile: null, checkIns: {}, matches: [] };

function read(): LocalState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(s: LocalState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: keep in memory */ }
  window.dispatchEvent(new Event('orbori-store'));
}

export const getProfile = () => read().profile;

/** Pending birth details while onboarding (not yet calculated). */
const DRAFT = 'orbori.draft';
export function saveDraft(p: Omit<Profile, 'seed' | 'createdAt'>) {
  try { sessionStorage.setItem(DRAFT, JSON.stringify(p)); } catch { /* ignore */ }
}
export function readDraft(): Omit<Profile, 'seed' | 'createdAt'> | null {
  try { const r = sessionStorage.getItem(DRAFT); return r ? JSON.parse(r) : null; } catch { return null; }
}

export function useStore() {
  const [state, setState] = useState<LocalState | null>(null);
  useEffect(() => {
    const load = () => setState(read());
    load();
    window.addEventListener('orbori-store', load);
    window.addEventListener('storage', load);
    return () => { window.removeEventListener('orbori-store', load); window.removeEventListener('storage', load); };
  }, []);

  const setProfile = useCallback((profile: Profile | null) => write({ ...read(), profile }), []);
  const checkIn = useCallback((date: string, answer: Answer, score: number) => {
    const s = read();
    write({ ...s, checkIns: { ...s.checkIns, [date]: { answer, score } } });
  }, []);
  const reset = useCallback(() => write(EMPTY), []);
  const addMatch = useCallback((m: Omit<Match, 'id' | 'addedAt'>) => {
    const s = read();
    const match: Match = { ...m, id: Math.random().toString(36).slice(2, 10), addedAt: new Date().toISOString() };
    write({ ...s, matches: [...s.matches, match] });
    return match;
  }, []);
  const removeMatch = useCallback((id: string) => {
    const s = read();
    write({ ...s, matches: s.matches.filter((m) => m.id !== id) });
  }, []);

  return { ready: state !== null, state: state ?? EMPTY, setProfile, checkIn, reset, addMatch, removeMatch };
}

/**
 * Inside the app shell the store is loaded once and shared, so screens can rely
 * on a profile being present on their very first render.
 */
export type Store = ReturnType<typeof useStore>;
export const StoreContext = createContext<Store | null>(null);
export function useAppStore(): Store & { state: LocalState & { profile: Profile } } {
  const s = useContext(StoreContext);
  if (!s || !s.state.profile) throw new Error('useAppStore must be used inside AppShell with a profile');
  return s as Store & { state: LocalState & { profile: Profile } };
}

/** Today's civil date in the viewer's own time zone. */
export function localToday(): { date: string; timeZone: string } {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return { date, timeZone };
}
