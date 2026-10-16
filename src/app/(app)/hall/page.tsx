'use client';
import { useEffect, useState } from 'react';
import { Sigil } from '@/components/Sigil';

/** Hall of the Sky: Celestials who chose to be listed, in the order they arrived. */
export default function Hall() {
  const [people, setPeople] = useState<{ number: number; handle: string; seed: number; reached: string }[] | null>(null);
  useEffect(() => { fetch('/api/hall').then((r) => r.json()).then((d) => setPeople(d.people ?? [])).catch(() => setPeople([])); }, []);
  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header>
        <p className="font-mono text-[11px] tracking-[0.14em] text-gold-lite">HALL OF THE SKY</p>
        <h1 className="font-display text-[26px] font-bold">The Celestials</h1>
        <p className="mt-1 text-sm text-muted">Everyone here walked all the way to the top of Orbori, in the order they arrived. Listed by choice, by handle only.</p>
      </header>
      {people === null ? <div className="h-40 animate-pulse rounded-3xl bg-night" /> : people.length === 0 ? (
        <p className="text-sm text-muted">The Hall is waiting for its first name.</p>
      ) : (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {people.map((x) => (
            <li key={x.number} className="flex items-center gap-3 rounded-2xl bg-night p-3">
              <Sigil seed={x.seed} size={44} />
              <div className="flex-1"><p className="font-semibold">{x.handle}</p><p className="text-xs text-dim">since {new Date(`${x.reached}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</p></div>
              <span className="font-mono text-sm font-bold text-gold-lite">#{x.number}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
