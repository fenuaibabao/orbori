'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { LEVELS } from '@/lib/progress';
import { setPrefs, usePrefs } from '@/lib/prefs';
import { FLAMES, isUnlocked, REWARDS, THEMES } from '@/lib/rewards';
import { FlameIcon } from './icons';
import { useProgress } from '@/lib/use-progress';
import { Sigil } from './Sigil';

/** Applies the chosen theme (if unlocked) and announces new levels once. Lives inside the app shell. */
export function RewardEffects() {
  const { levelIndex } = useProgress();
  const prefs = usePrefs();
  const theme = THEMES.find((t) => t.id === prefs.theme && levelIndex >= t.level)?.id ?? 'night';

  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'night') delete el.dataset.theme; else el.dataset.theme = theme;
  }, [theme]);

  // The gold icon (Celestial): swap the tab and home-screen icons on this device.
  const gold = levelIndex >= 4 && prefs.icon === 'gold';
  useEffect(() => {
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach((l) => {
      if (!l.dataset.orig) l.dataset.orig = l.getAttribute('href') ?? '';
      const apple = l.rel === 'apple-touch-icon';
      l.href = gold ? (apple ? '/apple-icon-gold.png' : '/icon-gold.svg') : l.dataset.orig;
      if (!apple) l.type = gold ? 'image/svg+xml' : l.type;
    });
  }, [gold]);

  if (levelIndex <= prefs.seenLevel) return null;
  const fresh = REWARDS.filter((r) => r.level > prefs.seenLevel && r.level <= levelIndex);
  return (
    <div role="status" className="anim-pop fixed inset-x-3 top-[calc(env(safe-area-inset-top)+12px)] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-gold bg-night p-4 shadow-2xl lg:left-auto lg:right-6 lg:mx-0">
      <span aria-hidden="true" className="font-display text-2xl text-gold-lite">✦</span>
      <div className="flex-1 text-sm">
        <p className="font-semibold">You&apos;re a {LEVELS[levelIndex].name} now.</p>
        <p className="text-muted">{fresh.length} new {fresh.length === 1 ? 'reward' : 'rewards'} unlocked.</p>
      </div>
      <Link href={levelIndex >= 4 && !prefs.revealed ? '/beyond' : '/rewards'} onClick={() => setPrefs({ seenLevel: levelIndex })} className="flex min-h-10 items-center rounded-full bg-gold px-4 text-sm font-bold text-space">See</Link>
      <button type="button" aria-label="Dismiss" onClick={() => setPrefs({ seenLevel: levelIndex })} className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:text-starlight">✕</button>
    </div>
  );
}

/** Your own sigil: gold ring from Seer, double ring at Celestial, and the Celestial looks (motion, your own design). */
export function MySigil({ seed, size }: { seed: number; size: number }) {
  const { levelIndex } = useProgress();
  const prefs = usePrefs();
  const ring = isUnlocked(levelIndex, 'sigil-ring');
  const top = levelIndex >= 4;
  return (
    <span className={`inline-flex rounded-full ${ring ? 'ring-2 ring-gold-lite ring-offset-2 ring-offset-space' : ''} ${top ? 'outline outline-1 outline-offset-[6px] outline-gold' : ''}`}>
      <Sigil seed={seed} size={size} custom={top ? prefs.sigil : null} className={top && prefs.sigilMotion ? 'anim-sigil' : ''} label="Your sigil" />
    </span>
  );
}

/** The streak flame, in the color chosen on the Rewards page (Seer and up). */
export function MyFlame({ size }: { size?: number }) {
  const { levelIndex } = useProgress();
  const { flame } = usePrefs();
  const f = FLAMES.find((x) => x.id === flame && isUnlocked(levelIndex, 'flame-colors')) ?? FLAMES[0];
  return <FlameIcon size={size} colors={f.colors} />;
}
