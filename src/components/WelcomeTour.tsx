'use client';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * The welcome tour: 7 short stops, shown once to new people on Today. Skippable,
 * and replayable from Me → Take the tour. Each stop spotlights real elements
 * marked with data-tour="…".
 */
const KEY = 'orbori-tour';
type Step = { title: string; text: string | ((desktop: boolean) => string); target: string | null; menu?: boolean; next?: string };
const STEPS: Step[] = [
  { title: 'Welcome to Orbori ✦', text: 'Seven sky traditions read your chart side by side, every day. Here\'s a 30-second tour.', target: null, next: 'Start' },
  { title: 'Your day', text: 'Today\'s headline, and how much the seven traditions agree, from 1 to 10.', target: 'day' },
  { title: 'The seven voices', text: 'What each tradition says, in plain English. Gold agrees; rose differs.', target: 'voices' },
  { title: 'Points and streaks', text: 'Check in nightly, learn, journal and play to earn points, climb levels and grow your 🔥 streak.', target: 'points' },
  { title: 'Your chart', text: 'Your full birth chart, all seven ways, each explained.', target: 'chart' },
  { title: 'Cosmic Visions', text: 'Orbori paints your chart: outfits, nails, wallpapers and more.', target: 'visions' },
  { title: 'The orb', text: (d) => (d ? 'Match, Learn, Journal, Play and Rewards are all in this menu.' : 'Tap the orb for Journal, Play, Learn, Match, the Cosmos and Rewards.'), target: 'more', menu: true },
  { title: 'Me', text: 'Settings, a nightly reminder, your Convergence Calendar, and this tour again.', target: 'me', next: 'Done' },
];
const get = () => { try { return localStorage.getItem(KEY); } catch { return 'done'; } };
const set = (v: string) => { try { localStorage.setItem(KEY, v); } catch { /* private mode */ } };
/** Start the tour again (from Me). */
export const replayTour = () => set('replay');

const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
function targets(name: string) { return [...document.querySelectorAll(`[data-tour="${name}"]`)].filter(visible); }
function unionRect(els: Element[]) {
  const rs = els.map((e) => e.getBoundingClientRect());
  const left = Math.min(...rs.map((r) => r.left)), top = Math.min(...rs.map((r) => r.top));
  return { left, top, width: Math.max(...rs.map((r) => r.right)) - left, height: Math.max(...rs.map((r) => r.bottom)) - top };
}

export function WelcomeTour() {
  const path = usePathname();
  const { state } = useAppStore();
  const [i, setI] = useState<number | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [desktop, setDesktop] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipTop, setTipTop] = useState(0);

  // Who sees it: new people (no check-ins yet) on Today, once; or anyone who asked to replay it.
  useEffect(() => {
    if (!path.startsWith('/today')) return;
    const flag = get();
    if (flag === 'replay') { set('done'); setI(0); return; }
    if (flag) return;
    if (Object.keys(state.checkIns ?? {}).length > 0) { set('done'); return; }
    set('done');
    const t = setTimeout(() => setI(0), 900); // let Today draw first
    return () => clearTimeout(t);
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = i === null ? null : STEPS[i];
  const place = useCallback(() => {
    const isDesk = window.matchMedia('(min-width: 1024px)').matches;
    setDesktop(isDesk);
    const name = skipped ? 'me' : step?.target;
    if (!name) { setBox(null); return; }
    const els = targets(name);
    if (!els.length) { setBox(null); return; }
    const r = unionRect(els);
    setBox({ left: r.left - 8, top: r.top - 8, width: r.width + 16, height: r.height + 16 });
  }, [step, skipped]);

  // Move to a step: open/close the phone menu, scroll the target into view, then measure.
  useEffect(() => {
    if (i === null) return;
    const isDesk = window.matchMedia('(min-width: 1024px)').matches;
    window.dispatchEvent(new CustomEvent('orbori-orb', { detail: !!step?.menu && !isDesk && !skipped }));
    const name = skipped ? 'me' : step?.target;
    const first = name ? targets(name)[0] : null;
    if (first && !first.closest('nav, aside, [role="dialog"]')) first.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
    const t1 = setTimeout(place, 60), t2 = setTimeout(place, 420);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [i, skipped, step, place]);
  useEffect(() => {
    if (i === null) return;
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [i, place]);
  // Keep the tip on screen: below the spotlight if it fits, otherwise above it.
  useLayoutEffect(() => {
    const h = tipRef.current?.offsetHeight ?? 180, vh = window.innerHeight;
    if (!box) { setTipTop(Math.max(24, vh / 2 - h / 2)); return; }
    const below = box.top + box.height + 14;
    const above = box.top - h - 14;
    // Tall targets: keep the card near the bottom so the top of the target stays readable.
    setTipTop(below + h < vh - 16 ? below : above >= 16 ? above : vh - h - (window.matchMedia('(min-width: 1024px)').matches ? 24 : 100));
  }, [box, i, skipped]);

  const finish = () => { window.dispatchEvent(new CustomEvent('orbori-orb', { detail: false })); setI(null); setSkipped(false); setBox(null); };
  useEffect(() => {
    if (i === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (skipped) finish(); else setSkipped(true); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [i, skipped]);

  if (i === null || !step) return null;
  const last = i === STEPS.length - 1;
  const text = typeof step.text === 'function' ? step.text(desktop) : step.text;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Welcome tour">
      {/* Dim everything except the spotlight; clicks outside the card do nothing. */}
      <div className="absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute rounded-[20px] border-2 border-gold-lite transition-all duration-300"
        style={box ? { left: box.left, top: box.top, width: box.width, height: box.height, boxShadow: '0 0 0 9999px rgba(6,5,40,0.82), 0 0 26px rgba(212,162,76,0.45)' }
          : { left: '50%', top: '45%', width: 0, height: 0, borderWidth: 0, boxShadow: '0 0 0 9999px rgba(6,5,40,0.82)' }} />
      <div ref={tipRef} className="absolute left-4 right-4 mx-auto max-w-sm rounded-[18px] bg-starlight p-4 text-space shadow-2xl transition-[top] duration-300" style={{ top: tipTop }}>
        {skipped ? (
          <>
            <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#6a5c9c]">TOUR SKIPPED</p>
            <p className="mt-1 text-[16px] font-extrabold">No problem ✦</p>
            <p className="mt-1 text-[13px] leading-snug text-[#2a2650]">You can take the tour any time from <b>Me → Take the tour</b>.</p>
            <div className="mt-3 flex justify-end"><button type="button" onClick={finish} autoFocus className="min-h-10 rounded-full bg-space px-5 text-sm font-bold text-starlight">Got it</button></div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#6a5c9c]">{i === 0 ? 'WELCOME' : `${i} OF ${STEPS.length - 1}`}</p>
              {!last && <button type="button" onClick={() => setSkipped(true)} className="-mr-1 -mt-1 px-1 text-xs font-bold text-[#7a71a8]">Skip</button>}
            </div>
            <p className="mt-1 text-[16px] font-extrabold">{step.title}</p>
            <p className="mt-1 text-[13px] leading-snug text-[#2a2650]">{text}</p>
            <div className="mt-3 flex items-center gap-2">
              {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="px-1 text-xs font-bold text-[#5b5290]">Back</button>}
              <div className="h-1 flex-1 overflow-hidden rounded bg-[#d9d5ee]"><div className="h-full bg-gold transition-all" style={{ width: `${(i / (STEPS.length - 1)) * 100}%` }} /></div>
              <button type="button" autoFocus onClick={() => (last ? finish() : setI(i + 1))} className="min-h-10 rounded-full bg-space px-5 text-sm font-bold text-starlight">{step.next ?? 'Next'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
