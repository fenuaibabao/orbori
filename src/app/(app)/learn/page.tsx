'use client';
import { useEffect, useMemo, useState } from 'react';
import { GLOSSARY } from '@/lib/glossary';
import { localToday, useAppStore } from '@/lib/store';

const ORDER = ['Western', 'Vedic', 'Chinese', 'Numerology', 'Mayan', 'Hawaiian', 'Islamic', 'Orbori'];

export default function Learn() {
  const { record } = useAppStore();
  const [q, setQ] = useState('');
  const systems = useMemo(() => {
    const present = Array.from(new Set(GLOSSARY.map((g) => g.system)));
    return [...ORDER.filter((s) => present.includes(s)), ...present.filter((s) => !ORDER.includes(s))];
  }, []);
  const [tab, setTab] = useState<string>(systems[0]);

  // Deep links (/learn#dasha) open the right tab.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    const hit = GLOSSARY.find((g) => g.id === id);
    if (hit) {
      setTab(hit.system);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 50);
    }
  }, []);

  // Reading a term earns today's Learn XP.
  useEffect(() => { const t = setTimeout(() => record(localToday().date, { learn: true }), 8000); return () => clearTimeout(t); }, [record]);

  const searching = q.trim().length > 0;
  const list = useMemo(() => {
    const s = q.toLowerCase().trim();
    return s ? GLOSSARY.filter((g) => (g.term + ' ' + g.body + ' ' + g.system).toLowerCase().includes(s)) : GLOSSARY.filter((g) => g.system === tab);
  }, [q, tab]);

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header>
        <h1 className="font-display text-[26px] font-bold">Learn</h1>
        <p className="mt-1 text-sm text-muted">Every term in Orbori, in plain English. No prior astrology required.</p>
      </header>
      <label className="sr-only" htmlFor="learn-q">Search terms</label>
      <input id="learn-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all terms: houses, dasha, Māhealani…"
        className="h-12 rounded-2xl border border-line-2 bg-night px-4 text-[15px] placeholder:text-dim" />

      {!searching && (
        <div role="tablist" aria-label="Traditions" className="no-scrollbar sticky top-0 z-10 -mx-5 flex gap-1.5 overflow-x-auto bg-space/95 px-5 py-2 backdrop-blur lg:mx-0 lg:px-0">
          {systems.map((s) => {
            const n = GLOSSARY.filter((g) => g.system === s).length;
            const on = tab === s;
            return (
              <button key={s} type="button" role="tab" aria-selected={on} onClick={() => { setTab(s); window.scrollTo({ top: 0 }); }}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium ${on ? 'border-gold-lite bg-royal text-starlight' : 'border-line-2 text-muted hover:text-starlight'}`}>
                {s}<span className={`font-mono text-[10px] ${on ? 'text-gold-lite' : 'text-dim'}`}>{n}</span>
              </button>
            );
          })}
        </div>
      )}

      {searching && <p className="text-sm text-muted">{list.length} {list.length === 1 ? 'term' : 'terms'} across all traditions</p>}

      <section role={searching ? undefined : 'tabpanel'} aria-label={searching ? 'Search results' : tab} className="flex flex-col gap-2.5">
        {list.map((g) => (
          <article key={g.id} id={g.id} className="scroll-mt-20 rounded-2xl bg-night p-4 target:ring-2 target:ring-gold-lite">
            {searching && <p className="mb-1 font-mono text-[10px] tracking-[0.08em] text-gold-lite">{g.system.toUpperCase()}</p>}
            <h2 className="font-semibold">{g.term}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{g.body}</p>
          </article>
        ))}
        {list.length === 0 && <p className="text-sm text-muted">Nothing matches that. Try another word.</p>}
      </section>
    </div>
  );
}
