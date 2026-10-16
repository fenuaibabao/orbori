'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBirthFields, type BirthValue } from '@/components/BirthFields';
import { Logo } from '@/components/Logo';
import { MatchResult } from '@/components/MatchResult';
import { Sigil } from '@/components/Sigil';
import { btnPrimary, Screen } from '@/components/ui';
import type { Coarse } from '@/lib/coarse';
import type { Compatibility } from '@/lib/compat';
import { saveDraft, useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

type Inviter = Coarse & { handle: string; seed: number; nickname: string | null; linkable: boolean };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [inviter, setInviter] = useState<Inviter | null>(null);
  const [compat, setCompat] = useState<Compatibility | null>(null);
  const [mine, setMine] = useState<BirthValue | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const form = useBirthFields('me');
  const auth = useAuth();
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);
  const link = async () => {
    setLinking(true); setError('');
    const r = await fetch('/api/links/accept', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json();
    setLinking(false);
    if (!r.ok) return setError(d.error);
    setLinked(true);
  };

  const store = useStore();
  useEffect(() => {
    fetch('/api/invite/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setInviter(d.inviter); })
      .catch((e) => setError(e.message));
  }, [token]);
  // Someone who already has an Orbori chart on this device skips the form.
  useEffect(() => {
    if (!inviter || compat || !store.ready || !store.state.profile) return;
    const input = store.state.profile.input;
    fetch('/api/invite/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, input }) })
      .then(async (r) => { const d = await r.json(); if (r.ok) setCompat(d.compat); })
      .catch(() => {});
  }, [inviter, compat, store.ready, store.state.profile, token]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = form.validate();
    if (typeof v === 'string') return setError(v);
    setBusy(true);
    try {
      const r = await fetch('/api/invite/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, input: v.input }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMine(v);
      setCompat(d.compat);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const join = () => {
    if (mine) saveDraft(mine);
    router.push('/onboarding/calculating');
  };

  if (error && !inviter) {
    return (
      <Screen className="items-center justify-center gap-4 text-center">
        <Logo size={44} />
        <p role="alert" className="text-mauve-lite">{error}</p>
        <Link href="/welcome" className="text-gold-lite underline">Get your own Cosmic Council</Link>
      </Screen>
    );
  }
  if (!inviter) return <div className="min-h-dvh" />;

  const meLabel = inviter.nickname ?? 'You';

  return (
    <Screen className="gap-6">
      <div className="flex justify-center"><Logo size={36} /></div>

      {!compat ? (
        <>
          <section className="flex flex-col items-center gap-3 text-center">
            <Sigil seed={inviter.seed} size={88} label={`${inviter.handle} sigil`} />
            <h1 className="font-display text-[26px] font-bold leading-tight">{inviter.handle} checked your compatibility.</h1>
            <p className="font-mono text-xs text-muted">{inviter.big3.toUpperCase()}</p>
            <p className="text-[15px] leading-relaxed text-muted">
              Seven traditions weighed in. Your half of the reading is locked until you add your birth details.
            </p>
          </section>
          <form onSubmit={unlock} noValidate className="flex flex-col gap-5">
            {form.fields}
            {error && <p role="alert" className="text-sm text-mauve-lite">{error}</p>}
            <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Unlocking…' : 'See your side'}</button>
            <p className="text-center text-xs leading-relaxed text-dim">
              {inviter.handle} never sees your birth details, only your Big Three. 18+ only.
            </p>
          </form>
        </>
      ) : (
        <>
          <MatchResult
            compat={compat}
            me={{ label: meLabel, seed: inviter.seed + 7919 }}
            them={{ label: inviter.handle, seed: inviter.seed }}
            theirHalfLocked={false}
          />
          {inviter.linkable && auth.enabled && (
            <section className="flex flex-col gap-3 rounded-[22px] border border-royal bg-night p-5 text-center">
              {linked ? (
                <>
                  <p className="font-display text-xl font-bold">You and {inviter.handle} are linked.</p>
                  <p className="text-sm text-muted">You&apos;ll see each other in your Constellations, with a live reading of how your days line up.</p>
                  <Link href="/compatibility" className={btnPrimary}>Open my Constellation</Link>
                </>
              ) : auth.user ? (
                <>
                  <p className="font-display text-xl font-bold">Link with {inviter.handle}?</p>
                  <p className="text-sm text-muted">You&apos;ll each see the other in your Constellation and how your days line up. Birth details stay private. Either of you can unlink any time.</p>
                  <button type="button" onClick={link} disabled={linking} className={btnPrimary}>{linking ? 'Linking…' : `Link with ${inviter.handle}`}</button>
                  {error && <p role="alert" className="text-sm text-mauve-lite">{error}</p>}
                </>
              ) : (
                <>
                  <p className="font-display text-xl font-bold">Want to stay connected?</p>
                  <p className="text-sm text-muted">Sign in and you and {inviter.handle} will see each other in your Constellations, with a live reading of how your days line up.</p>
                  <Link href={`/signin?next=${encodeURIComponent(`/invite/${token}`)}`} className={btnPrimary}>Sign in to link</Link>
                </>
              )}
            </section>
          )}
          <section className="flex flex-col gap-3 rounded-[22px] border border-gold bg-night p-5 text-center">
            <p className="font-display text-xl font-bold">That was the preview.</p>
            <p className="text-sm text-muted">Get your daily Cosmic Council, your chart rarity and your own Constellation.</p>
            <button type="button" onClick={join} className={btnPrimary}>Map my cosmos</button>
          </section>
        </>
      )}
    </Screen>
  );
}
