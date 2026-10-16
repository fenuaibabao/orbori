'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { btnPrimary, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync-provider';

/** Tester link: sign in and Plus is switched on for the beta. */
export default function Beta() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { ready, user } = useAuth();
  const store = useStore();
  const { ready: synced } = useSync();
  const [state, setState] = useState<'idle' | 'joining' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready || !user || state !== 'idle') return;
    setState('joining');
    fetch('/api/beta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setState('done'); })
      .catch((e) => { setError(e.message); setState('error'); });
  }, [ready, user, code, state]);

  const hasChart = store.ready && synced && !!store.state.profile;
  const next = encodeURIComponent(`/beta/${code}`);

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <Logo size={56} />
      <p className="font-mono text-xs tracking-[0.12em] text-gold-lite">ORBORI BETA</p>
      {!ready || state === 'joining' ? (
        <p className="text-muted">Opening the doors…</p>
      ) : !user ? (
        <>
          <h1 className="font-display text-[26px] font-bold leading-tight">You&apos;re invited to test Orbori.</h1>
          <p className="max-w-[300px] text-[15px] leading-relaxed text-muted">Seven traditions, one Cosmic Council. Testers get Orbori Plus free while we&apos;re in beta. Sign in with your email to claim it.</p>
          <Link href={`/signin?next=${next}`} className={btnPrimary}>Sign in to join</Link>
          <p className="text-xs text-dim">The sign-in email can take a few minutes, and may land in spam the first time.</p>
        </>
      ) : state === 'done' ? (
        <>
          <h1 className="font-display text-[26px] font-bold leading-tight">Welcome to the beta.</h1>
          <p className="max-w-[300px] text-[15px] leading-relaxed text-muted">Plus is on: every tradition in depth, free while we test. Tap <strong className="text-starlight">Feedback</strong> anywhere in the app to tell us what you think. Honest is best.</p>
          <button type="button" onClick={() => router.push(hasChart ? '/today' : '/onboarding/birth')} className={btnPrimary}>{hasChart ? 'Open Orbori' : 'Map my cosmos'}</button>
        </>
      ) : (
        <>
          <p role="alert" className="text-mauve-lite">{error}</p>
          <Link href="/" className="text-gold-lite">Go to Orbori</Link>
        </>
      )}
    </Screen>
  );
}
