'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StoreContext, useStore } from '@/lib/store';
import { ChartIcon, CosmosIcon, ProfileIcon, SunIcon, VisionsIcon } from './icons';
import { Logo } from './Logo';

const TABS = [
  { href: '/today', label: 'Today', Icon: SunIcon },
  { href: '/chart', label: 'Chart', Icon: ChartIcon },
  { href: '/cosmos', label: 'Cosmos', Icon: CosmosIcon },
  { href: '/visions', label: 'Visions', Icon: VisionsIcon },
  { href: '/profile', label: 'Profile', Icon: ProfileIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const store = useStore();
  const { ready, state } = store;

  useEffect(() => {
    if (ready && !state.profile) router.replace('/welcome');
  }, [ready, state.profile, router]);

  if (!ready || !state.profile) return <div className="min-h-dvh" />;

  return (
    <StoreContext.Provider value={store}>
    <div className="lg:flex lg:min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:gap-7 lg:border-r lg:border-[#1C1856] lg:px-5 lg:py-8">
        <Link href="/today" className="pl-3.5"><Logo size={32} /></Link>
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
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-[1080px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+24px)] lg:px-10 lg:pb-16 lg:pt-8">{children}</main>

      {/* Mobile tab bar */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-[#0B0934]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-1.5 backdrop-blur lg:hidden">
        {TABS.map(({ href, label, Icon }) => {
          const on = path.startsWith(href) || (href === '/profile' && (path.startsWith('/compatibility') || path.startsWith('/learn')));
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
