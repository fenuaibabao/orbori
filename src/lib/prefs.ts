'use client';
/** Per-device look preferences (theme, card style). Kept in this browser only. */
import { useEffect, useState } from 'react';
import type { CardStyle, ThemeId } from './rewards';

const KEY = 'orbori.prefs';
export interface Prefs { theme: ThemeId; card: CardStyle; seenLevel: number }
const DEFAULTS: Prefs = { theme: 'night', card: 'classic', seenLevel: 0 };

export function readPrefs(): Prefs {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return DEFAULTS; }
}
export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...readPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
  window.dispatchEvent(new Event('orbori-prefs'));
}
export function usePrefs(): Prefs {
  const [p, setP] = useState<Prefs>(DEFAULTS);
  useEffect(() => {
    const load = () => setP(readPrefs());
    load();
    window.addEventListener('orbori-prefs', load);
    return () => window.removeEventListener('orbori-prefs', load);
  }, []);
  return p;
}
