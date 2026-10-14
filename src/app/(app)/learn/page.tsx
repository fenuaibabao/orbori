'use client';
import { useMemo, useState } from 'react';
import { Tag } from '@/components/ui';
import { GLOSSARY } from '@/lib/glossary';

export default function Learn() {
  const [q, setQ] = useState('');
  const systems = Array.from(new Set(GLOSSARY.map((g) => g.system)));
  const list = useMemo(() => {
    const s = q.toLowerCase().trim();
    return s ? GLOSSARY.filter((g) => (g.term + ' ' + g.body).toLowerCase().includes(s)) : GLOSSARY;
  }, [q]);

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header>
        <h1 className="font-display text-[26px] font-bold">Learn</h1>
        <p className="mt-1 text-sm text-muted">Every term in Orbori, in plain English. No prior astrology required.</p>
      </header>
      <label className="sr-only" htmlFor="learn-q">Search terms</label>
      <input id="learn-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: houses, dasha, Day Master…"
        className="h-12 rounded-2xl border border-line-2 bg-night px-4 text-[15px] placeholder:text-dim" />
      {systems.map((sys) => {
        const items = list.filter((g) => g.system === sys);
        if (!items.length) return null;
        return (
          <section key={sys} className="flex flex-col gap-2.5">
            <Tag>{sys}</Tag>
            {items.map((g) => (
              <article key={g.id} id={g.id} className="scroll-mt-6 rounded-2xl bg-night p-4 target:ring-2 target:ring-gold-lite">
                <h2 className="font-semibold">{g.term}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{g.body}</p>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
