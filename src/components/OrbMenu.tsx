'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CosmosIcon } from './icons';

const I = (d: React.ReactNode) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const ITEMS = [
  { href: '/journal', label: 'Journal', note: 'Write tonight', icon: I(<><path d="M6 3h11a2 2 0 012 2v16H6a2 2 0 01-2-2V5a2 2 0 012-2z" /><path d="M8 8h7M8 12h7M8 16h4" /></>) },
  { href: '/play', label: 'Play', note: 'One game per tradition', icon: I(<><rect x="3" y="7" width="18" height="11" rx="5" /><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M18 13.5h.01" /></>) },
  { href: '/learn#next', label: 'Learn', note: 'A term you haven\'t seen', icon: I(<><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M4 21V5M8 7h7" /></>) },
  { href: '/compatibility', label: 'Match', note: 'Compare two charts', icon: I(<><circle cx="9" cy="12" r="6" /><circle cx="15" cy="12" r="6" /></>) },
  { href: '/cosmos', label: 'Cosmos', note: 'Your circle', icon: <CosmosIcon size={26} /> },
  { href: '/rewards', label: 'Rewards', note: 'Levels and looks', icon: I(<><path d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5L12 14.5 7.5 16.8l.9-5L4.8 8.3l5-.7z" /><path d="M8 17.5L7 21l5-2 5 2-1-3.5" /></>) },
];

/** The middle button of the phone tab bar: the Orbori mark. Tapping it slides up everything else. */
export function OrbButton() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);
  const here = ITEMS.some((i) => path.startsWith(i.href.split('#')[0]));

  return (
    <>
      <div className="flex items-start justify-center">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close menu' : 'More: Journal, Play, Learn and more'}
          className={`-mt-6 flex h-[60px] w-[60px] items-center justify-center rounded-full border-[1.5px] border-gold-lite shadow-[0_0_20px_rgba(212,162,76,0.35)] transition-transform active:scale-95 ${open ? 'rotate-45 bg-royal' : here ? 'bg-royal' : 'bg-[radial-gradient(circle_at_50%_35%,#2a2380,#0d0a35)]'}`}>
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="#ECE8F4" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 120 120" aria-hidden="true">
              <rect x="49" y="58" width="22" height="48" rx="11" fill="#F4EFE6" />
              <circle cx="45" cy="40" r="12" fill="#A2752C" />
              <circle cx="75" cy="40" r="12" fill="#A2752C" fillOpacity="0.85" />
              <circle cx="60" cy="31" r="12" fill="#D4A24C" fillOpacity="0.92" />
            </svg>
          )}
        </button>
      </div>
      {open && createPortal(
        <div className="fixed inset-0 z-[15] lg:hidden" role="dialog" aria-modal="true" aria-label="More of Orbori">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-space/70 backdrop-blur-sm" />
          <div className="orb-sheet absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-line-2 bg-deep px-5 pb-[calc(env(safe-area-inset-bottom)+104px)] pt-3">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-2" />
            <div className="grid grid-cols-3 gap-3">
              {ITEMS.map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-[20px] border border-line-2 bg-night px-2 py-4 text-center active:bg-royal">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal text-starlight">{it.icon}</span>
                  <span className="text-sm font-bold text-starlight">{it.label}</span>
                  <span className="text-[10.5px] leading-tight text-dim">{it.note}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
