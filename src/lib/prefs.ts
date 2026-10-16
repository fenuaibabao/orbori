'use client';
/** Per-device look preferences (theme, card style). Kept in this browser only. */
import { useEffect, useState } from 'react';
import type { CardStyle, FlameId, ThemeId } from './rewards';

const KEY = 'orbori.prefs';
export interface SigilDesign { sides: number; inner: boolean; ring: boolean; line: string; accent: string }
export interface Prefs {
  theme: ThemeId; card: CardStyle; flame: FlameId; icon: 'night' | 'gold'; seenLevel: number;
  /** Celestial looks */
  sigilMotion: boolean; sigil: SigilDesign | null; celestialNo: number | null; revealed: boolean;
  /** Cosmic Visions: how the person wants to be shown (optional). */
  look: { skin?: string; hair?: string };
}
const DEFAULTS: Prefs = { theme: 'night', card: 'classic', flame: 'gold', icon: 'night', seenLevel: 0, sigilMotion: false, sigil: null, celestialNo: null, revealed: false, look: {} };

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
