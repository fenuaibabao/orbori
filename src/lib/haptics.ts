/**
 * A light tap of vibration for game answers. Works on Android phones;
 * iPhones don't let websites vibrate, so there it quietly does nothing.
 */
const PATTERNS = { right: 18, wrong: [30, 60, 30], win: [20, 40, 20, 40, 60] } as const;

export function buzz(kind: keyof typeof PATTERNS) {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    navigator.vibrate(PATTERNS[kind] as number | number[]);
  } catch { /* not supported */ }
}
