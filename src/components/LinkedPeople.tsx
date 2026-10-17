'use client';
import Link from 'next/link';
import { Sigil } from './Sigil';
import { useLinks } from '@/lib/use-links';

/** Linked partners with a live "together today" reading and a one-tap nudge. */
export function LinkedPeople() {
  const { links, signedIn, nudge, unlink } = useLinks();
  if (!signedIn) {
    return (
      <section className="flex flex-col gap-2 rounded-[22px] border border-line bg-night p-[18px]">
        <h2 className="font-display text-[19px] font-bold">Linked people</h2>
        <p className="text-sm text-muted">Sign in, and when someone accepts your invite you&apos;ll be linked: you&apos;ll see how your days line up and can nudge each other when the stars agree.</p>
        <Link href="/signin?next=%2Fcompatibility" className="self-start text-sm font-semibold text-gold-lite">Sign in →</Link>
      </section>
    );
  }
  if (links === null) return <div className="h-24 animate-pulse rounded-[22px] bg-night" aria-label="Loading linked people" />;
  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-royal bg-night p-[18px]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[19px] font-bold">Linked people</h2>
        <span className="font-mono text-xs text-muted"><span className="font-bold text-gold-lite">{links.length}</span> LINKED</span>
      </div>
      {links.length === 0 && <p className="text-sm text-muted">Nobody yet. Invite someone to your constellation above, or send a match &ldquo;See your side&rdquo; below.</p>}
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.id} className="flex flex-col gap-2 rounded-[16px] bg-deep p-3">
            <div className="flex items-center gap-3">
              <Sigil seed={l.seed} size={40} label={`${l.handle} sigil`} />
              <div className="flex-1">
                <p className="font-semibold">{l.handle}{l.level && <span className="ml-2 rounded-full border border-gold px-2 py-0.5 align-middle font-mono text-[10px] tracking-[0.06em] text-gold-lite">{l.level.toUpperCase()}</span>}</p>
                <p className="font-mono text-[11px] text-dim">{l.big3} · match {l.compat.toFixed(1)}</p>
              </div>
            </div>
            <p className="text-sm text-muted">
              <strong className="text-starlight">Together today:</strong> {l.today.agree} of {l.today.total} voices say the same thing for you both{l.today.sameMajority ? ', and the Council\'s overall verdict matches' : ''}.
              {' '}Their day scores {l.today.theirScore.toFixed(1)}{l.today.checkedIn ? ' and they\'ve checked in' : ''}.
            </p>
            {l.nudgedMe && <p className="rounded-xl border border-gold bg-night px-3 py-2 text-sm text-gold-lite">✦ {l.handle} says the stars are aligned today.</p>}
            <div className="flex items-center gap-3">
              <button type="button" disabled={l.nudgedByMe} onClick={() => nudge(l.userId)}
                className="min-h-10 rounded-full bg-gold px-4 text-sm font-bold text-space disabled:opacity-50">
                {l.nudgedByMe ? 'Nudged today' : 'The stars are aligned ✦'}
              </button>
              <button type="button" onClick={() => { if (confirm(`Unlink from ${l.handle}?`)) unlink(l.id); }} className="min-h-10 text-xs text-dim">Unlink</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Today page banner: who nudged you today. */
export function NudgeBanner() {
  const { links, signedIn } = useLinks();
  if (!signedIn || !links) return null;
  const from = links.filter((l) => l.nudgedMe);
  if (!from.length) return null;
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-gold bg-night px-4 py-3">
      <div className="flex -space-x-2">{from.slice(0, 3).map((l) => <Sigil key={l.id} seed={l.seed} size={28} label={l.handle} />)}</div>
      <p className="text-sm"><span className="text-gold-lite">✦</span> {from.map((l) => l.handle).join(' and ')} {from.length === 1 ? 'says' : 'say'} the stars are aligned today. <Link href="/compatibility" className="text-gold-lite">See why →</Link></p>
    </div>
  );
}
