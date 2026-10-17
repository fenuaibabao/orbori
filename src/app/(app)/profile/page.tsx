'use client';
import { useProgress } from '@/lib/use-progress';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BadgeItem } from '@/components/BadgeShelf';
import { ShareIcon } from '@/components/icons';
import { big3, cardUrl, shareCard } from '@/lib/share';
import { MySigil } from '@/components/Rewards';
import { NightlyReminder } from '@/components/NightlyReminder';
import { DeleteAccount } from '@/components/DeleteAccount';
import { FriendName } from '@/components/FriendName';
import { replayTour } from '@/components/WelcomeTour';
import { Bar } from '@/components/ui';
import { useChart } from '@/lib/hooks';
import { handleFromSeed } from '@/lib/identity';
import { badges, LEVELS, XP } from '@/lib/progress';
import { formatOneIn, formatPct } from '@/lib/rarity-format';
import { localToday, saveDraft, useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { goToBilling, usePlus } from '@/lib/plus';
import { supabase } from '@/lib/supabase/client';
import { clearAccount } from '@/lib/sync';

const Ic = ({ d }: { d: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
/** The Explore tiles on Me: small, tappable, one per feature. */
const EXPLORE: { id: string; label: string; note: string; href?: string; bg: string; icon: React.ReactNode }[] = [
  { id: 'match', label: 'Constellation', note: 'Compatibility and your constellation · +25 XP each match', href: '/compatibility', bg: '#3b2f8f', icon: <Ic d={<><circle cx="9" cy="12" r="6" /><circle cx="15" cy="12" r="6" /></>} /> },
  { id: 'conv', label: 'Convergence', note: 'The days all seven voices agree, a year ahead', href: '/convergence', bg: '#7a4a1d', icon: <Ic d={<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>} /> },
  { id: 'rewards', label: 'Rewards', note: 'What every level unlocks', href: '/rewards', bg: '#6b5418', icon: <Ic d={<><path d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5L12 14.5 7.5 16.8l.9-5L4.8 8.3l5-.7z" /></>} /> },
  { id: 'play', label: 'Play', note: 'Term Quest and Nawal Pairs', href: '/play', bg: '#1f5f5b', icon: <Ic d={<><rect x="3" y="7" width="18" height="11" rx="5" /><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M18 13.5h.01" /></>} /> },
  { id: 'journal', label: 'Journal', note: 'Your private running diary', href: '/journal', bg: '#5a2a63', icon: <Ic d={<><path d="M6 3h11a2 2 0 012 2v16H6a2 2 0 01-2-2V5a2 2 0 012-2z" /><path d="M8 8h7M8 12h7M8 16h4" /></>} /> },
  { id: 'learn', label: 'Learn', note: 'Every astrology term, in plain English', href: '/learn', bg: '#24508a', icon: <Ic d={<><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M4 21V5M8 7h7" /></>} /> },
  { id: 'tour', label: 'Tour', note: 'A 30-second walk through Orbori', bg: '#2f6b3a', icon: <Ic d={<><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>} /> },
  { id: 'resources', label: 'Resources', note: 'Who Orbori learned from, and where to go deeper', href: '/resources', bg: '#7a2f4f', icon: <Ic d={<><path d="M5 4h4v16H5zM10 4h4v16h-4z" /><path d="M15.5 5.2l3.7-1 3 15.5-3.7 1z" /></>} /> },
];

export default function Profile() {
  const router = useRouter();
  const { state, reset, record } = useAppStore();
  const profile = state.profile;
  const auth = useAuth();
  const plus = usePlus();
  const [billingMsg, setBillingMsg] = useState<string | null>(null);
  const manageBilling = async () => {
    setBillingMsg('Opening billing…');
    const e = await goToBilling('/api/billing/portal');
    if (e) setBillingMsg(e);
  };
  const startOver = async () => {
    if (!confirm(auth.user ? 'Erase your chart, streak and matches from this device and your account?' : 'Erase your profile and streak from this device?')) return;
    const sb = supabase();
    if (auth.user && sb) { try { await clearAccount(sb, auth.user.id); } catch { /* local reset still happens */ } }
    reset();
    router.replace('/welcome');
  };
  const { data } = useChart(profile);
  const { date } = localToday();
  const p = useProgress();
  const list = badges(p, { mythic: data?.rarity.tier === 'Mythic', matches: state.matches.length, founding: plus.founding });

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
    if (r !== 'cancelled') record(date, { share: true });
  };

  return (
    <div className="flex flex-col gap-5 lg:max-w-2xl">
      <header className="flex items-center gap-3.5">
        <MySigil seed={profile.seed} size={56} />
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
            Check in nightly (+{XP.checkIn}), answer the daily question (+{XP.question}), go deeper, learn, share and nudge (+5 each), write in your journal (+{XP.journal}), play a minigame (+{XP.game} each), get in sync with a linked person (+{XP.sync}), streaks (+{XP.streak7} at 7, +{XP.streak30} at 30), linked people (+{XP.linked} each) and weekly challenges (+{XP.challenge} each). Miss a night and your streak slips back one; miss two in a row and it resets.
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
            <span className="font-mono text-[17px] font-bold text-gold-lite">{p.thisWeek.filter((c) => c.done).length}/{p.thisWeek.length}</span><span className="text-[11px] text-muted">challenges this week</span>
          </div>
        </div>
        <div>
          <p className="mb-2.5 font-mono text-[11px] tracking-[0.08em] text-gold-lite">THIS WEEK&apos;S CHALLENGES · +{XP.challenge} XP EACH</p>
          <ul className="flex flex-col gap-1.5">
            {p.thisWeek.map((c) => (
              <li key={c.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${c.done ? 'border border-gold bg-deep' : 'bg-deep'}`}>
                <span aria-hidden="true" className={c.done ? 'text-gold-lite' : 'text-dim'}>{c.done ? '✦' : '○'}</span>
                <span className="flex-1 text-sm"><span className="font-semibold">{c.name}</span> <span className="text-muted">{c.how}</span></span>
                <span className="font-mono text-xs text-muted">{c.progress}/{c.goal}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] text-dim">New challenges every Monday.</p>
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
        <button type="button" onClick={editBirth} className="flex w-full items-center gap-3 rounded-[18px] border-[1.5px] border-gold bg-[linear-gradient(135deg,#2a2380,var(--color-night))] p-3 text-left">
          <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gold text-lg text-space">☉</span>
          <span className="min-w-0 flex-1">
            <b className="block text-[15px]">{profile.input.date} · {profile.input.time ?? 'time unknown'}</b>
            <span className="block truncate text-xs text-muted">{profile.cityLabel}</span>
          </span>
          <span className="flex-none rounded-full bg-gold px-3 py-1.5 text-xs font-extrabold text-space">Edit</span>
        </button>
        {auth.user && <FriendName />}

        <p className="mb-2 ml-1 mt-5 font-mono text-[11px] font-bold tracking-[0.08em] text-gold-lite">EXPLORE</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {EXPLORE.map((t) => {
            const inner = (
              <>
                <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-[10px] text-starlight" style={{ background: t.bg }}>{t.icon}</span>
                <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
                {t.id === 'match' && <span className="absolute right-1 top-1 rounded-full bg-gold-lite px-1 font-mono text-[8px] font-extrabold text-space">+25</span>}
              </>
            );
            const cls = 'relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-night px-1 py-2 text-center transition hover:border-gold active:scale-[0.97]';
            return t.href
              ? <Link key={t.id} href={t.href} className={cls} title={t.note}>{inner}</Link>
              : <button key={t.id} type="button" title={t.note} onClick={() => { replayTour(); router.push('/today'); }} className={cls}>{inner}</button>;
          })}
        </div>
      </section>

      <NightlyReminder />

      <section>
        <p className="mb-2 ml-1 font-mono text-[11px] font-bold tracking-[0.08em] text-gold-lite">ACCOUNT</p>
        <div className="overflow-hidden rounded-[18px] bg-night">
          {auth.user ? (
            <div className="flex min-h-14 items-center gap-3 px-4 py-3">
              <span className="flex-1 text-[15px]">Signed in
                <span className="mt-0.5 block text-xs text-dim">{auth.user.email}. Your chart, streak and matches are saved to your account.</span>
              </span>
              <button type="button" onClick={() => auth.signOut()} className="min-h-11 text-sm font-medium text-muted">Sign out</button>
            </div>
          ) : (
            <Link href="/signin?next=%2Fprofile" className="flex min-h-14 w-full items-center gap-3 px-4 py-2">
              <span className="flex-1 text-[15px]">{auth.enabled ? 'Sign in or create an account' : 'Accounts coming soon'}
                <span className="mt-0.5 block text-xs text-dim">
                  {auth.enabled ? 'Keep your chart, streak and matches on every device.' : 'For now everything lives on this device.'}
                </span>
              </span>
              {auth.enabled && <span className="text-dim">›</span>}
            </Link>
          )}
          <div className="flex min-h-14 items-center gap-3 border-t border-line px-4 py-3">
            <span className="flex-1 text-[15px]">
              {plus.plus ? <>Orbori Plus <span className="rounded-full bg-gold px-2 py-0.5 font-mono text-[10px] font-bold text-space">{plus.status === 'owner' ? 'OWNER' : plus.plan === 'gift' ? 'GIFTED' : 'ACTIVE'}</span></> : 'Orbori Plus'}
              <span className="mt-0.5 block text-xs text-dim">
                {plus.plus
                  ? plus.cancelAtPeriodEnd && plus.periodEnd ? `Ends ${new Date(plus.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
                    : plus.periodEnd ? `Renews ${new Date(plus.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.` : 'Active.'
                  : 'Every system in depth.'}
              </span>
            </span>
            {plus.status === 'owner' || plus.plan === 'gift' ? <Link href="/admin" className="min-h-11 text-sm font-medium text-gold-lite">{plus.status === 'owner' ? 'Mission control' : 'A gift'}</Link>
              : plus.plus || plus.status === 'canceled' || plus.status === 'past_due'
              ? <button type="button" onClick={manageBilling} className="min-h-11 text-sm font-medium text-gold-lite">Manage</button>
              : <Link href="/plus" className="min-h-11 text-sm font-medium text-gold-lite">See plans</Link>}
          </div>
          {billingMsg && <p aria-live="polite" className="px-4 pb-3 text-xs text-muted">{billingMsg}</p>}
          <button type="button" onClick={startOver} className="flex min-h-12 w-full items-center border-t border-line px-4 text-left text-sm font-medium text-[#E7B7BA]">
            Start over
          </button>
          <DeleteAccount />
        </div>
        <p className="mt-3 text-center text-[11px] text-dim">
          <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/commitments">Our commitments</Link>
        </p>
      </section>
    </div>
  );
}
