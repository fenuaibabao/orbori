'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { Sigil } from '@/components/Sigil';
import { btnGhost, btnPrimary, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { saveFriendName } from '@/components/FriendName';

interface Preview { handle: string; seed: number; name: string | null; count: number; seeds: number[]; self: boolean; already: boolean }

/** "Join my constellation": the page a friend lands on from an invite link. */
export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const auth = useAuth();
  const [p, setP] = useState<Preview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [hadName, setHadName] = useState<string | null>(null);
  useEffect(() => {
    if (!auth.user) return;
    fetch('/api/names').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.friendName) { setHadName(d.friendName); setFriendName(d.friendName); } }).catch(() => {});
  }, [auth.user]);

  useEffect(() => {
    if (!auth.ready) return;
    fetch('/api/join/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setP(d); })
      .catch((e) => setError(e.message));
  }, [token, auth.ready, auth.user]);

  const join = async () => {
    setBusy(true); setError('');
    if (friendName.trim() && friendName.trim() !== hadName) await saveFriendName(friendName).catch(() => null);
    const r = await fetch('/api/links/accept', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(d.error ?? 'Could not join.');
    setJoined(true);
  };

  if (!p) {
    return (
      <Screen className="items-center justify-center gap-4 text-center">
        <Logo size={44} />
        {error ? <><p role="alert" className="text-mauve-lite">{error}</p><Link href="/welcome" className="text-gold-lite underline">See what Orbori is</Link></> : <div className="h-40 w-full max-w-sm animate-pulse rounded-3xl bg-night" />}
      </Screen>
    );
  }
  const group = p.name ?? `${p.handle}'s constellation`;
  const next = encodeURIComponent(`/join/${token}`);

  return (
    <Screen className="gap-6 text-center">
      <div className="flex justify-center"><Logo size={34} /></div>
      <section className="flex flex-col items-center gap-3">
        <p className="font-mono text-[11px] tracking-[0.14em] text-gold-lite">YOU&apos;RE INVITED</p>
        <Sigil seed={p.seed} size={104} label={`${p.handle} sigil`} />
        <h1 className="font-display text-[26px] font-bold leading-tight">{p.handle} invited you into their constellation</h1>
        <p className="text-[15px] text-muted">Join <b className="text-starlight">{group}</b> and see how your skies line up, every night.</p>
        <div className="mt-1 flex justify-center">
          {p.seeds.slice(0, 5).map((s, i) => <span key={i} className="-ml-2 rounded-full border-2 border-space bg-space first:ml-0"><Sigil seed={s} size={34} /></span>)}
        </div>
        <p className="text-xs text-dim">{p.count} {p.count === 1 ? 'star' : 'stars'} so far</p>
      </section>

      <section className="flex flex-col gap-3">
        {joined || p.already ? (
          <>
            <p className="font-display text-xl font-bold">You&apos;re in ✦</p>
            <p className="text-sm text-muted">You and {p.handle} are now in each other&apos;s skies.</p>
            <Link href="/compatibility" className={btnPrimary}>Open my constellation</Link>
          </>
        ) : p.self ? (
          <p className="text-sm text-muted">This is your own invite. Send it to a friend so they can join.</p>
        ) : !auth.enabled ? (
          <p className="text-sm text-muted">Accounts are switching on soon.</p>
        ) : auth.user ? (
          <>
            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-sm font-semibold">What should friends call you? <span className="font-normal text-dim">(optional)</span></span>
              <input value={friendName} onChange={(e) => setFriendName(e.target.value)} maxLength={24} placeholder="A first name or nickname"
                className="h-11 rounded-xl border border-line-2 bg-deep px-3 text-[15px]" />
              <span className="text-[11px] text-dim">Only people in your constellation see it. Skip it and they&apos;ll see your handle.</span>
            </label>
            <button type="button" onClick={join} disabled={busy} className={btnPrimary}>{busy ? 'Joining…' : 'Join the constellation ✦'}</button>
            {error && <p role="alert" className="text-sm text-mauve-lite">{error} {/chart/i.test(error) && <Link href="/welcome" className="font-semibold text-gold-lite underline">Set up your chart</Link>}</p>}
          </>
        ) : (
          <>
            <Link href={`/signin?next=${next}`} className={btnPrimary}>Sign in to join ✦</Link>
            <Link href="/welcome" className={btnGhost}>What&apos;s Orbori?</Link>
            <p className="text-xs text-dim">New here? Sign in, set up your chart, then open this link again.</p>
          </>
        )}
      </section>
      <p className="text-xs leading-relaxed text-dim">Friends see your name, your sigil, whether you checked in tonight and your score. Never your birth details or your journal. You can leave a constellation any time.</p>
    </Screen>
  );
}
