'use client';
/**
 * On-device storage. Everything lives under one key; when someone is signed in,
 * SyncProvider (lib/sync-provider) mirrors every change to their account.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BirthInput } from './astro/types';
import type { Activity, ActivityLog, Answer, CheckIn } from './progress';

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

/** The day's reading, kept with a journal entry so you can look back at both together. */
export interface ReadingSnapshot {
  headline: string;
  score: number;
  agreeCount: number;
  voices: number;
  agreeText?: string;
  holdoutText?: string | null;
  /** The AI-written reading, when there was one. */
  ai?: string;
}

export interface JournalEntry {
  text: string;
  /** The prompt shown that day, if any. */
  prompt?: string;
  reading?: ReadingSnapshot;
  updatedAt: string;
}

export interface LocalState {
  profile: Profile | null;
  checkIns: Record<string, CheckIn>;
  matches: Match[];
  activity: ActivityLog;
  /** Private journal, one entry per date. */
  journal: Record<string, JournalEntry>;
}

const KEY = 'orbori.v1';
const EMPTY: LocalState = { profile: null, checkIns: {}, matches: [], activity: {}, journal: {} };

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
/** Used by account sync: read everything / replace everything. */
export const readState = read;
export const replaceState = write;

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
  /** Record something done today (XP, challenges). No-op when already recorded. */
  const record = useCallback((date: string, patch: Partial<Activity>) => {
    const s = read();
    const cur = s.activity?.[date] ?? {};
    const changed = (Object.keys(patch) as (keyof Activity)[]).some((k) => cur[k] !== patch[k] && !(k !== 'question' && cur[k]));
    if (!changed) return;
    write({ ...s, activity: { ...s.activity, [date]: { ...cur, ...patch } } });
  }, []);
  /** Save the journal entry for a date (empty text keeps an empty entry, so deletes sync too). */
  const writeJournal = useCallback((date: string, text: string, prompt?: string, reading?: ReadingSnapshot) => {
    const s = read();
    const cur = s.journal?.[date];
    const nextReading = reading ? { ...cur?.reading, ...reading, ai: reading.ai ?? cur?.reading?.ai } : cur?.reading;
    if (cur && cur.text === text && (prompt === undefined || cur.prompt === prompt) && JSON.stringify(nextReading) === JSON.stringify(cur.reading)) return;
    write({ ...s, journal: { ...s.journal, [date]: { text, prompt: prompt ?? cur?.prompt, reading: nextReading, updatedAt: new Date().toISOString() } } });
  }, []);
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

  return { ready: state !== null, state: state ?? EMPTY, setProfile, checkIn, reset, addMatch, removeMatch, record, writeJournal };
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
