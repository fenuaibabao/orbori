import Link from 'next/link';

export function What({ id, label = 'What is this?' }: { id: string; label?: string }) {
  return (
    <Link href={`/learn#${id}`} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-gold-lite hover:underline">
      <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full border border-gold-lite text-[10px]">?</span>
      {label}
    </Link>
  );
}

export function Section({ title, learn, children }: { title: string; learn?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-night p-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-[19px] font-bold">{title}</h2>
        {learn && <What id={learn} />}
      </div>
      {children}
    </section>
  );
}

export function Meter({ rows, max }: { rows: [string, number, string?][]; max: number }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([label, n, hint]) => (
        <div key={label} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0">{label}</span>
          <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded bg-line"><span className="block h-full bg-gold" style={{ width: `${(n / max) * 100}%` }} /></span>
          <span className="w-6 text-right font-mono text-gold-lite">{n}</span>
          {hint && <span className="sr-only">{hint}</span>}
        </div>
      ))}
    </div>
  );
}

export const deg = (d: number) => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, '0')}′`;
