'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StoreContext, useStore } from '@/lib/store';
import { useSync } from '@/lib/sync-provider';
import { useAuth } from '@/lib/auth';
import { isOwnerEmail } from '@/lib/owner';
import { ChartIcon, CosmosIcon, ProfileIcon, SunIcon, VisionsIcon } from './icons';
import { Logo } from './Logo';
import { Feedback } from './Feedback';
import { RewardEffects } from './Rewards';
import { OrbButton } from './OrbMenu';

const TABS = [
  { href: '/today', label: 'Today', Icon: SunIcon },
  { href: '/chart', label: 'Chart', Icon: ChartIcon },
  { href: '/cosmos', label: 'Cosmos', Icon: CosmosIcon },
  { href: '/visions', label: 'Visions', Icon: VisionsIcon },
  { href: '/profile', label: 'Profile', Icon: ProfileIcon },
];

/** On phones: Today, Chart, the orb, Visions, Me. */
const PHONE_TABS = [TABS[0], TABS[1], 'orb', TABS[3], { ...TABS[4], label: 'Me' }] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const store = useStore();
  const { ready: synced } = useSync();
  const { user } = useAuth();
  const owner = isOwnerEmail(user?.email);
  const ready = store.ready && synced;
  const { state } = store;

  useEffect(() => {
    if (ready && !state.profile) router.replace('/welcome');
  }, [ready, state.profile, router]);

  if (!ready || !state.profile) return <div className="min-h-dvh" />;

  return (
    <StoreContext.Provider value={store}>
    <RewardEffects />
    <div className="lg:flex lg:min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:gap-7 lg:border-r lg:border-[#1C1856] lg:px-5 lg:py-8">
        <Link href="/today" className="flex items-center gap-2 pl-3.5"><Logo size={32} /><span className="rounded-full border border-gold px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-gold-lite">BETA</span></Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {TABS.map(({ href, label, Icon }) => {
            const on = path.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={on ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-medium ${on ? 'bg-royal text-starlight' : 'text-muted hover:text-starlight'}`}>
                <Icon size={20} />{label === 'Chart' ? 'My Chart' : label === 'Cosmos' ? 'The Cosmos' : label === 'Visions' ? 'Cosmic Visions' : label}
              </Link>
            );
          })}
          <Link href="/compatibility" aria-current={path.startsWith('/compatibility') ? 'page' : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-medium ${path.startsWith('/compatibility') ? 'bg-royal text-starlight' : 'text-muted hover:text-starlight'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="9" cy="12" r="6" /><circle cx="15" cy="12" r="6" /></svg>
            Compatibility
          </Link>
          <Link href="/learn" aria-current={path.startsWith('/learn') ? 'page' : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-medium ${path.startsWith('/learn') ? 'bg-royal text-starlight' : 'text-muted hover:text-starlight'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M4 21V5M8 7h7" /></svg>
            Learn
          </Link>
          <Link href="/journal" aria-current={path.startsWith('/journal') ? 'page' : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-medium ${path.startsWith('/journal') ? 'bg-royal text-starlight' : 'text-muted hover:text-starlight'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h11a2 2 0 012 2v16H6a2 2 0 01-2-2V5a2 2 0 012-2z" /><path d="M8 8h7M8 12h7M8 16h4" /></svg>
            Journal
          </Link>
          <Link href="/play" aria-current={path.startsWith('/play') ? 'page' : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-medium ${path.startsWith('/play') ? 'bg-royal text-starlight' : 'text-muted hover:text-starlight'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="11" rx="5" /><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M18 13.5h.01" /></svg>
            Play
          </Link>
          <Link href="/rewards" aria-current={path.startsWith('/rewards') || path.startsWith('/recap') ? 'page' : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-medium ${path.startsWith('/rewards') || path.startsWith('/recap') ? 'bg-royal text-starlight' : 'text-muted hover:text-starlight'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5L12 14.5 7.5 16.8l.9-5L4.8 8.3l5-.7z" /><path d="M8 17.5L7 21l5-2 5 2-1-3.5" /></svg>
            Rewards
          </Link>
          <Link href="/plus" aria-current={path.startsWith('/plus') ? 'page' : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-medium ${path.startsWith('/plus') ? 'bg-royal text-starlight' : 'text-gold-lite hover:text-starlight'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.4 5.6L20 9.3l-4.3 3.9 1.3 5.8L12 16l-5 3 1.3-5.8L4 9.3l5.6-.7z" /></svg>
            Orbori Plus
          </Link>
          {owner && (
            <Link href="/admin" aria-current={path.startsWith('/admin') ? 'page' : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-medium ${path.startsWith('/admin') ? 'bg-royal text-starlight' : 'text-muted hover:text-starlight'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>
              Mission control
            </Link>
          )}
        </nav>
        <Feedback className="mt-auto flex min-h-11 items-center gap-2 rounded-[14px] border border-line px-3.5 text-sm font-medium text-muted hover:text-starlight" />
      </aside>

      <main className="mx-auto w-full max-w-[1080px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+24px)] lg:px-10 lg:pb-16 lg:pt-8">{children}</main>

      <Feedback className="fixed bottom-[calc(env(safe-area-inset-bottom)+84px)] right-3 z-10 rounded-full border border-royal bg-night/95 px-3 py-1.5 text-xs font-semibold text-muted shadow-lg backdrop-blur lg:hidden" />
      {/* Mobile tab bar: four tabs and the orb in the middle, which opens everything else */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-deep/95 px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-1.5 backdrop-blur lg:hidden">
        {PHONE_TABS.map((t) => {
          if (t === 'orb') return <OrbButton key="orb" />;
          const { href, label, Icon } = t;
          const on = path.startsWith(href) || (href === '/profile' && path.startsWith('/plus'));
          return (
            <Link key={href} href={href} aria-current={on ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${on ? 'text-starlight' : 'text-dim'}`}>
              <span className={`flex h-[30px] w-[52px] items-center justify-center rounded-full ${on ? 'bg-royal' : ''}`}><Icon /></span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
    </StoreContext.Provider>
  );
}
