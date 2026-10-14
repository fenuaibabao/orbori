'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RarityBurst, TierLadder } from '@/components/RarityBurst';
import { LinkButton, Screen } from '@/components/ui';
import { useChart } from '@/lib/hooks';
import { handleFromSeed } from '@/lib/identity';
import { formatOneIn, formatShare } from '@/lib/rarity-format';
import { useStore } from '@/lib/store';

export default function Reveal() {
  const router = useRouter();
  const { ready, state } = useStore();
  const { data } = useChart(state.profile);

  useEffect(() => { if (ready && !state.profile) router.replace('/welcome'); }, [ready, state.profile, router]);
  if (!data || !state.profile) return <div className="min-h-dvh" />;

  const { rarity } = data;
  return (
    <Screen className="items-center gap-5 overflow-hidden pt-16 text-center">
      <p className="anim-fade font-mono text-xs tracking-[0.12em] text-gold-lite">YOUR CHART RARITY</p>
      <RarityBurst tier={rarity.tier} />
      <div className="anim-fade flex flex-col gap-2" style={{ animationDelay: '.5s' }}>
        <h1 className="font-display text-[26px] font-bold leading-tight">
          Only <span className="font-mono text-gold-lite">{formatShare(rarity.share)}</span> of people<br />share your combo.
        </h1>
        <p className="text-sm text-muted">
          About 1 in {formatOneIn(rarity.oneIn)}. You&apos;re basically a limited edition, {handleFromSeed(state.profile.seed)}.
        </p>
      </div>
      <div className="anim-fade flex flex-wrap justify-center gap-1.5 font-mono text-xs" style={{ animationDelay: '.7s' }}>
        <span className="rounded-xl bg-night px-2.5 py-1.5">☉ {rarity.combo.sun}</span>
        <span className="rounded-xl bg-night px-2.5 py-1.5">☽ {rarity.combo.moon}</span>
        <span className="rounded-xl bg-night px-2.5 py-1.5">{data.chart.chinese.element} {rarity.combo.animal}</span>
        <span className="rounded-xl bg-night px-2.5 py-1.5">Life Path {rarity.combo.lifePath}</span>
      </div>
      <div className="anim-fade w-full" style={{ animationDelay: '.9s' }}><TierLadder tier={rarity.tier} /></div>
      <div className="flex-1" />
      <div className="anim-fade flex w-full flex-col gap-2.5" style={{ animationDelay: '1.1s' }}>
        <LinkButton href="/onboarding/share">Share your rarity</LinkButton>
        <LinkButton href="/today" variant="ghost">Take me to today</LinkButton>
      </div>
    </Screen>
  );
}
