'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { BadgeItem } from '@/components/BadgeShelf';
import { ShareIcon } from '@/components/icons';
import { big3, cardUrl, shareCard } from '@/lib/share';
import { Sigil } from '@/components/Sigil';
import { Bar } from '@/components/ui';
import { useChart } from '@/lib/hooks';
import { handleFromSeed } from '@/lib/identity';
import { badges, computeProgress, LEVELS, XP } from '@/lib/progress';
import { formatOneIn, formatPct } from '@/lib/rarity-format';
import { localToday, saveDraft, useAppStore } from '@/lib/store';

export default function Profile() {
  const router = useRouter();
  const { state, reset } = useAppStore();
  const profile = state.profile;
  const { data } = useChart(profile);
  const { date } = localToday();
  const p = useMemo(() => computeProgress(state.checkIns, date, state.matches.length * XP.match), [state.checkIns, date, state.matches.length]);
  const list = badges(p, { mythic: data?.rarity.tier === 'Mythic', matches: state.matches.length });

  const editBirth = () => {
    saveDraft({ input: profile.input, cityLabel: profile.cityLabel });
    router.push('/onboarding/birth');
  };

  const [shareStatus, setShareStatus] = useState('');
  const BADGE_LINES: Record<string, string> = {
    'first-light': 'Checked in with the stars for the first time. The council has noted my presence.',
    'seven-night': 'Showed up every night for a week. Even when the sky was being weird.',
    'called-it': 'Called it five times when the stars were split. Trust my gut.',
    constellation: 'Five matches mapped. My Constellation is officially a crowd.',
    'thirty-night': 'Thirty nights straight. Basically part of the sky now.',
    mythic: 'Mythic chart. One of the rarest combos out there.',
  };
  const shareOrbit = async () => {
    if (!data) return;
    const earned = list.filter((b) => b.earned);
    const top = earned[earned.length - 1];
    setShareStatus('Preparing your card…');
    const url = cardUrl('level', {
      handle: handleFromSeed(profile.seed), seed: profile.seed, big3: big3(data.chart), level: p.level,
      badge: top?.name ?? p.level, line: top ? BADGE_LINES[top.id] : `${p.xp} XP and counting.`,
    });
    const r = await shareCard(url, `Now a ${p.level} on Orbori.`, 'orbori-orbit.png');
    setShareStatus(r === 'downloaded' ? 'Saved to your downloads.' : r === 'shared' ? 'Shared.' : '');
  };

  return (
    <div className="flex flex-col gap-5 lg:max-w-2xl">
      <header className="flex items-center gap-3.5">
        <Sigil seed={profile.seed} size={56} label="Your sigil" />
        <div className="flex-1">
          <h1 className="font-display text-[22px] font-bold">{handleFromSeed(profile.seed)}</h1>
          {data && (
            <p className="mt-0.5 font-mono text-xs text-muted">
              ☉ {data.chart.western.planets.sun.sign} · ☽ {data.chart.moonSignOptions.join('/')}
              {data.chart.western.ascendant ? ` · ↑ ${data.chart.western.ascendant.sign}` : ''}
            </p>
          )}
        </div>
      </header>

      <section aria-labelledby="orbit" className="flex flex-col gap-4 rounded-[22px] border border-royal bg-night p-[18px]">
        <div className="flex items-center justify-between">
          <h2 id="orbit" className="font-display text-xl font-bold">Your Orbit</h2>
          <button type="button" onClick={shareOrbit} className="flex min-h-9 items-center gap-1.5 text-[13px] font-semibold text-gold-lite">
            <ShareIcon size={16} />Share
          </button>
        </div>
        {shareStatus && <p aria-live="polite" className="-mt-2 text-xs text-gold-lite">{shareStatus}</p>}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[26px] font-extrabold text-gold-lite">{p.level}</span>
            <span className="font-mono text-xs text-muted">{p.xp.toLocaleString('en-US')}{p.nextLevel ? ` / ${p.nextLevel.xp.toLocaleString('en-US')} XP` : ' XP'}</span>
          </div>
          <Bar value={p.levelProgress} className="h-2" />
          <div aria-label={`Levels; you are ${p.level}`} className="flex gap-1">
            {LEVELS.map((l, i) => (
              <span key={l.name} className={`flex h-[26px] flex-1 items-center justify-center rounded-lg border font-mono text-[8.5px] font-bold tracking-[0.04em] ${i === p.levelIndex ? 'border-gold-lite bg-gold text-space' : i < p.levelIndex ? 'border-[#5A4A30] bg-[#2A2246] text-gold-lite' : 'border-line-2 text-dim'}`}>
                {l.name.toUpperCase()}
              </span>
            ))}
          </div>
          <p className="text-xs text-dim">
            {p.nextLevel ? `${(p.nextLevel.xp - p.xp).toLocaleString('en-US')} XP to ${p.nextLevel.name}. ` : ''}
            Check in nightly (+{XP.checkIn}), streaks (+{XP.streak7} at 7, +{XP.streak30} at 30), matches (+{XP.match}), Circle challenges (+{XP.challenge}).
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-1 flex-col gap-0.5 rounded-[14px] bg-deep px-2 py-2.5 text-center">
            <span className="font-mono text-[17px] font-bold text-gold-lite">{p.streak}</span><span className="text-[11px] text-muted">night streak</span>
          </div>
          <Link href="/onboarding/share" className="flex flex-1 flex-col gap-0.5 rounded-[14px] border border-gold bg-deep px-2 py-2.5 text-center">
            <span className="flex min-h-[26px] items-center justify-center font-mono text-[13px] font-bold tracking-[0.04em] text-gold-lite">{data ? data.rarity.tier.toUpperCase() : '…'}</span>
            <span className="text-[11px] text-muted">{data ? (data.rarity.pct <= 0.5 ? `rarest ${formatPct(data.rarity.pct)}` : `1 in ${formatOneIn(data.rarity.oneIn)}`) : 'rarity'}</span>
          </Link>
          <div className="flex flex-1 flex-col gap-0.5 rounded-[14px] bg-deep px-2 py-2.5 text-center">
            <span className="font-mono text-[17px] font-bold text-dim">0</span><span className="text-[11px] text-muted">Streak Shields · Plus</span>
          </div>
        </div>
        <div>
          <p className="mb-2.5 font-mono text-[11px] tracking-[0.08em] text-gold-lite">BADGES · {list.filter((b) => b.earned).length} OF {list.length}</p>
          <div className="grid grid-cols-3 justify-items-center gap-x-2 gap-y-4 sm:grid-cols-6">
            {list.map((b) => <BadgeItem key={b.id} b={b} size={60} showHow />)}
          </div>
        </div>
      </section>

      <section>
        <p className="mb-2 ml-1 font-mono text-[11px] font-bold tracking-[0.08em] text-gold-lite">BIRTH PROFILE</p>
        <div className="overflow-hidden rounded-[18px] bg-night">
          <button type="button" onClick={editBirth} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left">
            <span className="flex-1 text-[15px]">Edit birth details
              <span className="mt-0.5 block text-xs text-dim">
                {profile.input.date} · {profile.input.time ?? 'time unknown'} · {profile.cityLabel}
              </span>
            </span>
            <span className="text-dim">›</span>
          </button>
          <Link href="/compatibility" className="flex min-h-14 w-full items-center gap-3 border-t border-line px-4 py-2">
            <span className="flex-1 text-[15px]">Compatibility &amp; Constellation
              <span className="mt-0.5 block text-xs text-dim">
                {state.matches.length ? `${state.matches.length} ${state.matches.length === 1 ? 'match' : 'matches'}` : 'Add your first match'} · +25 XP each
              </span>
            </span>
            <span className="text-dim">›</span>
          </Link>
          <Link href="/learn" className="flex min-h-14 w-full items-center gap-3 border-t border-line px-4 py-2">
            <span className="flex-1 text-[15px]">Learn
              <span className="mt-0.5 block text-xs text-dim">Every astrology term, in plain English</span>
            </span>
            <span className="text-dim">›</span>
          </Link>
        </div>
      </section>

      <section>
        <p className="mb-2 ml-1 font-mono text-[11px] font-bold tracking-[0.08em] text-gold-lite">THIS DEVICE</p>
        <div className="rounded-[18px] bg-night p-4 text-sm leading-relaxed text-muted">
          Accounts are coming soon. For now your profile, streak and matches live only on this device.
          <button type="button" onClick={() => { if (confirm('Erase your profile and streak from this device?')) { reset(); router.replace('/welcome'); } }}
            className="mt-3 block min-h-11 font-medium text-[#E7B7BA]">
            Start over
          </button>
        </div>
      </section>
    </div>
  );
}
