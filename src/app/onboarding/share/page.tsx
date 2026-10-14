'use client';
import { useState } from 'react';
import { ShareIcon } from '@/components/icons';
import { btnPrimary, LinkButton, Screen } from '@/components/ui';
import { useChart } from '@/lib/hooks';
import { handleFromSeed } from '@/lib/identity';
import { formatOneIn, formatPct } from '@/lib/rarity-format';
import { big3, cardUrl, shareCard } from '@/lib/share';
import { useStore } from '@/lib/store';

export default function ShareRarity() {
  const { state } = useStore();
  const { data } = useChart(state.profile);
  const [status, setStatus] = useState('');
  if (!data || !state.profile) return <div className="min-h-dvh" />;

  const { rarity, chart } = data;
  const url = cardUrl('rarity', {
    handle: handleFromSeed(state.profile.seed),
    seed: state.profile.seed,
    big3: big3(chart),
    tier: rarity.tier,
    pct: rarity.pct <= 0.5 ? formatPct(rarity.pct) : '',
    oneIn: formatOneIn(rarity.oneIn),
    combo: `${rarity.combo.sun} Sun · ${rarity.combo.moon} Moon · ${chart.chinese.element} ${rarity.combo.animal} · Life Path ${rarity.combo.lifePath}`,
  });

  const onShare = async () => {
    setStatus('Preparing your card…');
    const r = await shareCard(url, `My chart is ${rarity.tier} on Orbori.`, 'orbori-rarity.png');
    setStatus(r === 'downloaded' ? 'Saved to your downloads.' : r === 'shared' ? 'Shared. Flex responsibly.' : '');
  };

  return (
    <Screen className="items-center gap-5 pt-12 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Flex responsibly.</h1>
        <p className="mt-1.5 text-sm text-muted">Anonymous by design: handle, sigil and Big Three only.</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Story card: ${rarity.tier} chart, about 1 in ${formatOneIn(rarity.oneIn)} people share this exact combo`} width={236} height={420}
        className="h-[420px] w-[236px] rounded-[22px] border border-royal bg-night" />
      <div className="flex w-full flex-col gap-2.5">
        <button type="button" onClick={onShare} className={btnPrimary}><ShareIcon className="mr-2" />Share your card</button>
        <p aria-live="polite" className="min-h-5 text-sm text-gold-lite">{status}</p>
      </div>
      <div className="flex-1" />
      <LinkButton href="/today" variant="ghost">Continue to today</LinkButton>
    </Screen>
  );
}
