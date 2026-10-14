'use client';
import { useEffect, useState } from 'react';
import type { Chart } from './astro/types';
import type { CouncilReading } from './council/types';
import type { Rarity } from './rarity';
import type { Profile } from './store';
import { localToday } from './store';

const cacheGet = <T,>(k: string): T | null => {
  try { const r = sessionStorage.getItem(k); return r ? (JSON.parse(r) as T) : null; } catch { return null; }
};
const cacheSet = (k: string, v: unknown) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

export interface ChartData { chart: Chart; rarity: Rarity }

export async function fetchChart(input: Profile['input']): Promise<ChartData> {
  const key = 'orbori.chart.' + JSON.stringify(input);
  const hit = cacheGet<ChartData>(key);
  if (hit) return hit;
  const res = await fetch('/api/chart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Could not calculate your chart.');
  cacheSet(key, data);
  return data;
}

export function useChart(profile: Profile | null) {
  const [data, setData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!profile) return;
    fetchChart(profile.input).then(setData, (e) => setError(e.message));
  }, [profile]);
  return { data, error };
}

export function useToday(profile: Profile | null) {
  const [reading, setReading] = useState<CouncilReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!profile) return;
    const { date, timeZone } = localToday();
    const key = `orbori.today.${date}.${JSON.stringify(profile.input)}`;
    const hit = cacheGet<CouncilReading>(key);
    if (hit) { setReading(hit); return; }
    fetch('/api/today', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input: profile.input, date, timeZone }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); cacheSet(key, d.reading); setReading(d.reading); })
      .catch((e) => setError(e.message));
  }, [profile]);
  return { reading, error };
}

/** Share text (and a link) with the native share sheet, falling back to the clipboard. */
export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  try {
    if (navigator.share) { await navigator.share({ text, url }); return 'shared'; }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
