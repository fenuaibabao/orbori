'use client';
import { useEffect, useState } from 'react';

/**
 * "Add Orbori to your Home Screen", shown on phones from the third day someone
 * visits. Android gets a one-tap Install button; iPhone gets a two-step guide
 * (Safari has no install button websites can trigger).
 */
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIP | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIP; window.dispatchEvent(new Event('orbori-installable')); });
}

const DAYS_KEY = 'orbori-visit-days', HIDE_KEY = 'orbori-install-hidden';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

export function InstallPrompt() {
  const [mode, setMode] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone || window.innerWidth >= 1024) return;
    const today = new Date().toISOString().slice(0, 10);
    const days: string[] = JSON.parse(get(DAYS_KEY) || '[]');
    if (!days.includes(today)) { days.push(today); set(DAYS_KEY, JSON.stringify(days.slice(-10))); }
    const hiddenUntil = Number(get(HIDE_KEY) || 0);
    if (days.length < 3 || Date.now() < hiddenUntil) return;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (ios) { setMode('ios'); return; }
    if (deferred) setMode('android');
    const onReady = () => setMode('android');
    window.addEventListener('orbori-installable', onReady);
    return () => window.removeEventListener('orbori-installable', onReady);
  }, []);

  if (!mode) return null;
  const hide = () => { set(HIDE_KEY, String(Date.now() + 21 * 86400000)); setMode(null); };
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    if (outcome === 'accepted') set(HIDE_KEY, String(Date.now() + 3650 * 86400000));
    setMode(null);
  };

  return (
    <section aria-label="Add Orbori to your Home Screen" className="rounded-[22px] border border-gold/60 bg-night p-4 lg:hidden">
      <div className="flex items-start gap-3">
        <img src="/icon-192.png" alt="" width={44} height={44} className="rounded-[12px]" />
        <div className="flex-1">
          <p className="font-bold">Put Orbori on your Home Screen</p>
          <p className="mt-0.5 text-sm text-muted">Opens full screen like a real app, one tap from your nightly check-in.{mode === 'android' ? ' Long-press the icon to jump straight to your journal or games.' : ''}</p>
        </div>
        <button type="button" onClick={hide} aria-label="Not now" className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-dim">✕</button>
      </div>
      {mode === 'android' ? (
        <button type="button" onClick={install} className="mt-3 min-h-11 w-full rounded-full bg-gold text-sm font-bold text-space">Install Orbori</button>
      ) : (
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-3 rounded-2xl bg-deep px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-royal font-mono text-xs font-bold">1</span>
            <span>Tap the Share button
              <svg className="mx-1 inline -translate-y-0.5" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5B9BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share icon"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M6 11H5v10h14V11h-1" /></svg>
              at the bottom of Safari</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-deep px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-royal font-mono text-xs font-bold">2</span>
            <span>Scroll down and choose <b>Add to Home Screen</b></span>
          </li>
        </ol>
      )}
    </section>
  );
}
