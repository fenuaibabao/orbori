import Link from 'next/link';

export const btnPrimary =
  'flex h-14 w-full items-center justify-center rounded-full bg-gold px-6 text-base font-bold text-space transition hover:bg-gold-lite disabled:opacity-50';
export const btnGhost =
  'flex min-h-12 w-full items-center justify-center rounded-full border border-royal px-6 text-[15px] font-medium text-starlight hover:border-gold-lite';

export function Screen({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-9 pt-[calc(env(safe-area-inset-top)+48px)] ${className}`}>
      {children}
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-[26px] items-center rounded-full bg-royal px-2.5 text-xs font-semibold tracking-wide">{children}</span>;
}

export function Eyebrow({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'mauve' }) {
  return (
    <p className={`font-mono text-[11px] font-bold tracking-[0.08em] ${tone === 'gold' ? 'text-gold-lite' : 'text-mauve-lite'}`}>{children}</p>
  );
}

export function LinkButton({ href, children, variant = 'primary' }: { href: string; children: React.ReactNode; variant?: 'primary' | 'ghost' }) {
  return <Link href={href} className={variant === 'primary' ? btnPrimary : btnGhost}>{children}</Link>;
}

export function Bar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`h-1.5 overflow-hidden rounded-full bg-line ${className}`}>
      <div className="h-full bg-gold" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}
