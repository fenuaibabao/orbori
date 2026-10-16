'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { btnPrimary, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync-provider';

/** A friend's gift: sign in and get seven days of Plus. */
export default function Gift() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { ready, user } = useAuth();
  const store = useStore();
  const { ready: synced } = useSync();
  const [info, setInfo] = useState<{ valid: boolean; from?: string } | null>(null);
  const [state, setState] = useState<'idle' | 'opening' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => { fetch(`/api/gift?code=${encodeURIComponent(code)}`).then((r) => r.json()).then(setInfo).catch(() => setInfo({ valid: false })); }, [code]);

  const open = async () => {
    setState('opening');
    const r = await fetch('/api/gift/redeem', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d.error ?? 'Something went wrong.'); setState('error'); return; }
    setMsg(new Date(d.until).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }));
    setState('done');
  };

  const hasChart = store.ready && synced && !!store.state.profile;
  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <Logo size={56} />
      <p className="font-mono text-xs tracking-[0.12em] text-gold-lite">A GIFT FROM THE STARS</p>
      {!info || !ready ? <p className="text-muted">Unwrapping…</p> : !info.valid ? (
        <>
          <h1 className="font-display text-[26px] font-bold leading-tight">This gift has already been opened.</h1>
          <Link href="/" className="text-gold-lite">Go to Orbori</Link>
        </>
      ) : state === 'done' ? (
        <>
          <h1 className="font-display text-[26px] font-bold leading-tight">Plus is yours until {msg}.</h1>
          <p className="max-w-[300px] text-[15px] leading-relaxed text-muted">Every tradition in depth and your daily AI reading. Enjoy the week.</p>
          <button type="button" onClick={() => router.push(hasChart ? '/today' : '/onboarding/birth')} className={btnPrimary}>{hasChart ? 'Open Orbori' : 'Map my cosmos'}</button>
        </>
      ) : (
        <>
          <h1 className="font-display text-[26px] font-bold leading-tight">{info.from} sent you a week of Orbori Plus.</h1>
          <p className="max-w-[300px] text-[15px] leading-relaxed text-muted">Seven traditions, one Cosmic Council, every system in depth. {user ? 'Open it to start your seven days.' : 'Sign in with your email to open it.'}</p>
          {user
            ? <button type="button" onClick={open} disabled={state === 'opening'} className={btnPrimary}>{state === 'opening' ? 'Opening…' : 'Open my gift'}</button>
            : <Link href={`/signin?next=${encodeURIComponent(`/gift/${code}`)}`} className={btnPrimary}>Sign in to open</Link>}
          {state === 'error' && <p role="alert" className="max-w-[300px] text-sm text-mauve-lite">{msg}</p>}
        </>
      )}
    </Screen>
  );
}
