'use client';
import type { Chart } from './astro/types';
import { readPrefs } from './prefs';

export const big3 = (chart: Chart) =>
  [`Sun ${chart.western.planets.sun.sign}`, `Moon ${chart.moonSignOptions[0]}`, chart.western.ascendant ? `Rising ${chart.western.ascendant.sign}` : null]
    .filter(Boolean)
    .join(' · ');

export function cardUrl(kind: 'rarity' | 'score' | 'match' | 'level', params: Record<string, string | number>) {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  // Card design chosen on the Rewards page (only selectable once unlocked).
  const style = readPrefs().card;
  if (style !== 'classic') q.set('style', style);
  const no = readPrefs().celestialNo;
  if (style === 'foil' && no) q.set('no', String(no));
  return `/api/card/${kind}?${q}`;
}

/**
 * Share a story card image with the native share sheet (phones), falling back to
 * downloading the image, and returns what happened.
 */
export async function shareCard(url: string, text: string, filename: string, link?: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await (await fetch(url)).blob();
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: link ? `${text} ${link}` : text });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  if (link) { try { await navigator.clipboard.writeText(link); } catch { /* ignore */ } }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}
