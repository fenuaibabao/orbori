import type { Metadata } from 'next';
import { RESOURCES, type Resource } from '@/lib/resources';

export const metadata: Metadata = { title: 'Resources · Orbori' };

const Chev = () => (
  <span aria-hidden="true" className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gold text-space transition-transform group-open:rotate-180">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

function List({ label, items }: { label: string; items?: Resource[] }) {
  if (!items?.length) return null;
  return (
    <>
      <p className="mb-1.5 mt-2.5 font-mono text-[10px] font-bold tracking-[0.12em] text-dim">{label}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((r) => (
          <li key={r.href}>
            <a href={r.href} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-deep px-3 py-2.5 text-[13px] hover:outline hover:outline-1 hover:outline-gold">
              <b className="block text-starlight">{r.title} <span aria-hidden="true" className="text-gold-lite">↗</span></b>
              <span className="text-muted">{r.by}</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Resources: who Orbori learned from and where to go deeper, tradition by tradition. */
export default function Resources() {
  return (
    <div className="flex flex-col gap-4 lg:max-w-2xl">
      <header>
        <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-gold-lite">RESOURCES</p>
        <h1 className="mt-1 font-display text-[26px] font-bold">Go to the source</h1>
        <p className="mt-1 text-sm text-muted">Orbori is a doorway. If a tradition speaks to you, these are the people and books to learn from next.</p>
      </header>
      {RESOURCES.map((t, i) => (
        <details key={t.id} open={i === 0} className="group overflow-hidden rounded-[18px] border border-line bg-night">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <b className="flex-1 text-[15px]">{t.name}</b><Chev />
          </summary>
          <div className="px-4 pb-3.5">
            <List label="WHO WE LEARNED FROM" items={t.learnedFrom} />
            <List label="FROM INSIDE THE TRADITION" items={t.inside} />
            <List label="GO DEEPER" items={t.deeper} />
          </div>
        </details>
      ))}
      <p className="px-1 text-xs text-dim">Western astrology and numerology grew up in Europe and the Americas, so their teachers come from there.</p>
      <p className="rounded-2xl border border-dashed border-gold p-3.5 text-[13px] text-muted">
        Some of these are living, sacred traditions. The best next step is always to learn from their own people. Know someone we should add? Tell us with Feedback.
      </p>
    </div>
  );
}
