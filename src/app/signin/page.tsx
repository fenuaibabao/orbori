'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { btnGhost, btnPrimary, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { googleEnabled } from '@/lib/supabase/config';

export default function SignInPage() {
  return <Suspense fallback={<div className="min-h-dvh" />}><SignIn /></Suspense>;
}

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user, enabled, signInWithEmail, signInWithGoogle, verifyEmailCode, signInWithApple, appleEnabled } = useAuth();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true); setError(null);
    const r = await verifyEmailCode(email.trim(), code);
    setChecking(false);
    if (r.error) setError(r.error);
  };
  const next = params.get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(params.get('error') === 'link' ? 'That sign-in link has expired. Request a new one.' : null);

  useEffect(() => { if (ready && user) router.replace(next.startsWith('/') ? next : '/'); }, [ready, user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    // Remember where to return after the email link (it lands on the home page).
    try { if (next.startsWith('/') && next !== '/') localStorage.setItem('orbori.next', next); } catch { /* ignore */ }
    const r = await signInWithEmail(email.trim());
    setBusy(false);
    if (r.error) setError(r.error); else setSent(true);
  };

  return (
    <Screen className="gap-6">
      <Link href="/" className="self-center"><Logo size={44} /></Link>
      <header className="flex flex-col gap-1.5 text-center">
        <h1 className="font-display text-2xl font-bold">Keep your cosmos</h1>
        <p className="text-sm text-muted">Sign in and your chart, streak and matches follow you to every device.</p>
      </header>

      {!enabled ? (
        <p className="rounded-2xl bg-night p-4 text-center text-sm text-muted">Accounts are almost ready. For now everything stays on this device.</p>
      ) : sent ? (
        <div className="flex flex-col gap-3 rounded-[22px] border border-royal bg-night p-5 text-center">
          <p className="font-display text-lg font-bold">Check your email</p>
          <p className="text-sm text-muted">We sent an email to <span className="text-starlight">{email}</span> with a sign-in link and a code. It can take a minute to arrive.</p>
          <form onSubmit={verify} className="flex flex-col gap-2">
            <label htmlFor="code" className="text-xs text-dim">Using Orbori from your Home Screen? Type the code from the email here:</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Code"
              className="h-14 rounded-2xl border border-line-2 bg-deep px-4 text-center font-mono text-2xl tracking-[0.3em] text-starlight placeholder:text-dim placeholder:tracking-normal" />
            <button type="submit" disabled={checking || code.length < 6} className={btnPrimary}>{checking ? 'Checking…' : 'Sign in with code'}</button>
            {error && <p role="alert" className="text-sm text-mauve-lite">{error}</p>}
          </form>
          <p className="text-xs text-dim">Or tap the link in the email on this device.</p>
          <p className="text-xs text-dim">Don&apos;t see it? Check your spam or junk folder for &ldquo;Your sign-in link&rdquo; from Orbori, and mark it &ldquo;not spam&rdquo; so the next one lands in your inbox.</p>
          <button type="button" onClick={() => setSent(false)} className="text-sm text-gold-lite">Use a different email</button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">EMAIL</span>
            <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="h-14 rounded-2xl border border-line-2 bg-night px-4 text-base text-starlight placeholder:text-dim" />
          </label>
          <button type="submit" disabled={busy || !email} className={btnPrimary}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
          {appleEnabled && (
            <button type="button" onClick={async () => { const r = await signInWithApple(); if (r.error) setError(r.error); }}
              className="flex h-14 items-center justify-center rounded-2xl bg-white text-base font-semibold text-black">
              Continue with Apple
            </button>
          )}
          {googleEnabled && (
            <button type="button" onClick={async () => { const r = await signInWithGoogle(); if (r.error) setError(r.error); }} className={btnGhost}>
              Continue with Google
            </button>
          )}
          {error && <p role="alert" className="text-center text-sm text-mauve-lite">{error}</p>}
          <p className="mt-1 text-center text-xs text-dim">No password to remember. The link signs you in; new emails become new accounts.</p>
        </form>
      )}

      <Link href={next.startsWith('/') ? next : '/'} className="mt-auto self-center text-sm text-muted">Not now</Link>
    </Screen>
  );
}
