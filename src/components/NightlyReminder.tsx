'use client';
import { useEffect, useState } from 'react';
import { buzz } from '@/lib/haptics';
import { XP } from '@/lib/progress';
import { localToday, useAppStore } from '@/lib/store';

/**
 * Me → Nightly reminder. Turning it on asks the phone for permission, subscribes
 * through the service worker and earns +25 XP once. iPhones only allow this
 * once Orbori is on the Home Screen.
 */
type Status = 'loading' | 'unsupported' | 'homescreen' | 'denied' | 'off' | 'on';
const TIME_KEY = 'orbori-remind-at';
const TIMES = Array.from({ length: 14 }, (_, i) => { const m = 17 * 60 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`; });
const pretty = (t: string) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
const b64 = (s: string) => { const p = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(p), (c) => c.charCodeAt(0)); };
const getTime = () => { try { return localStorage.getItem(TIME_KEY) || '20:00'; } catch { return '20:00'; } };

async function subscription() {
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return { reg, sub: await reg.pushManager.getSubscription() };
}

export function NightlyReminder() {
  const { state, record } = useAppStore();
  const [status, setStatus] = useState<Status>('loading');
  const [time, setTime] = useState('20:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const earned = Object.values(state.activity ?? {}).some((a) => a.notified);

  useEffect(() => {
    setTime(getTime());
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const standalone = (navigator as { standalone?: boolean }).standalone || window.matchMedia('(display-mode: standalone)').matches;
        setStatus(ios && !standalone ? 'homescreen' : 'unsupported'); return;
      }
      if (Notification.permission === 'denied') { setStatus('denied'); return; }
      try { const { sub } = await subscription(); setStatus(sub ? 'on' : 'off'); } catch { setStatus('off'); }
    })();
  }, []);

  const save = async (sub: PushSubscription, at: string) => {
    const r = await fetch('/api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON(), remindAt: at, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Could not save the reminder.');
  };

  const turnOn = async () => {
    setBusy(true); setError('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setStatus(perm === 'denied' ? 'denied' : 'off'); return; }
      const { reg, sub: existing } = await subscription();
      const { publicKey } = await (await fetch('/api/push')).json();
      const sub = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(publicKey) });
      await save(sub, time);
      setStatus('on'); buzz('win');
      if (!earned) record(localToday().date, { notified: true });
    } catch (e) { setError((e as Error).message || 'Something went wrong. Try again?'); }
    finally { setBusy(false); }
  };

  const turnOff = async () => {
    setBusy(true); setError('');
    try {
      const { sub } = await subscription();
      if (sub) { await fetch('/api/push', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
      setStatus('off');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const changeTime = async (t: string) => {
    setTime(t); try { localStorage.setItem(TIME_KEY, t); } catch { /* fine */ }
    if (status !== 'on') return;
    try { const { sub } = await subscription(); if (sub) await save(sub, t); } catch (e) { setError((e as Error).message); }
  };

  const reward = !earned && <span className="ml-1.5 whitespace-nowrap rounded-full bg-royal px-2 py-0.5 font-mono text-[11px] text-gold-lite">+{XP.notify} XP</span>;

  return (
    <section>
      <p className="mb-2 ml-1 font-mono text-[11px] font-bold tracking-[0.08em] text-gold-lite">NIGHTLY REMINDER</p>
      <div className="flex flex-col gap-3 rounded-[18px] bg-night p-4">
        <div className="flex items-center gap-3">
          <span className="flex-1 text-[15px]">Remind me to open Orbori{reward}
            <span className="mt-0.5 block text-xs text-dim">
              {status === 'on' ? `Every night at ${pretty(time)}, only if you haven't opened Orbori yet that day.`
                : status === 'homescreen' ? 'On iPhone, add Orbori to your Home Screen first (Share → Add to Home Screen), then open it from there.'
                : status === 'denied' ? 'Notifications are blocked for Orbori. Allow them in your phone or browser settings, then come back.'
                : status === 'unsupported' ? 'This browser can\'t show notifications. Try Chrome, or Safari from the Home Screen.'
                : 'One gentle nudge a night, at a time you pick. Nothing else, ever.'}
            </span>
          </span>
          {(status === 'on' || status === 'off') && (
            <button type="button" role="switch" aria-checked={status === 'on'} aria-label="Nightly reminder" disabled={busy}
              onClick={status === 'on' ? turnOff : turnOn}
              className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${status === 'on' ? 'bg-gold' : 'bg-line-2'} disabled:opacity-60`}>
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-starlight transition-all ${status === 'on' ? 'left-[24px]' : 'left-1'}`} />
            </button>
          )}
        </div>
        {(status === 'on' || status === 'off') && (
          <label className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm text-muted">
            Time
            <select value={time} onChange={(e) => changeTime(e.target.value)} className="min-h-10 rounded-xl border border-line-2 bg-deep px-3 text-starlight">
              {TIMES.map((t) => <option key={t} value={t}>{pretty(t)}</option>)}
            </select>
          </label>
        )}
        {error && <p role="alert" className="text-xs text-mauve-lite">{error}</p>}
      </div>
    </section>
  );
}
