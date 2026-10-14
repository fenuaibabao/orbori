'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { usePlus } from '@/lib/plus';

/**
 * Wraps Plus-only content. Free members see the first child in full and the rest
 * softly veiled behind an unlock card, so they can tell what they'd get.
 */
export function PlusGate({ children, teaser }: { children: React.ReactNode[]; teaser?: string }) {
  const { plus, ready } = usePlus();
  const { user } = useAuth();
  const path = usePathname();
  if (!ready) return <>{children[0]}</>;
  if (plus) return <>{children}</>;
  const [first, ...rest] = children;
  return (
    <>
      {first}
      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none max-h-[420px] select-none overflow-hidden opacity-60 blur-[3px]">{rest}</div>
        <div className="absolute inset-0 flex items-end bg-gradient-to-b from-transparent via-space/70 to-space">
          <div className="flex w-full flex-col gap-3 rounded-[22px] border border-gold bg-night p-5 text-center">
            <p className="font-mono text-[11px] tracking-[0.12em] text-gold-lite">ORBORI PLUS</p>
            <p className="font-display text-lg font-bold">{teaser ?? 'The full reading is waiting.'}</p>
            <p className="text-sm text-muted">Every deeper system, your Dasha timeline, houses and aspects, Four Pillars, the Mayan cross and more.</p>
            <Link href={user ? '/plus' : `/signin?next=${encodeURIComponent('/plus')}`} className="flex h-12 items-center justify-center rounded-full bg-gold px-6 font-bold text-space hover:bg-gold-lite">
              See plans
            </Link>
            {!user && <Link href={`/signin?next=${encodeURIComponent(path)}`} className="text-sm text-gold-lite">Already Plus? Sign in</Link>}
          </div>
        </div>
      </div>
    </>
  );
}
