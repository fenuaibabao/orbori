'use client';
import { useEffect, useMemo, useState } from 'react';
import { XP, seenTerms } from '@/lib/progress';
import { GLOSSARY } from '@/lib/glossary';
import { localToday, useAppStore } from '@/lib/store';

const ORDER = ['Western', 'Vedic', 'Chinese', 'Numerology', 'Mayan', 'Hawaiian', 'Islamic', 'Orbori'];

export default function Learn() {
  const { state, seeTerm } = useAppStore();
  const [q, setQ] = useState('');
  const systems = useMemo(() => {
    const present = Array.from(new Set(GLOSSARY.map((g) => g.system)));
    return [...ORDER.filter((s) => present.includes(s)), ...present.filter((s) => !ORDER.includes(s))];
  }, []);
  const [tab, setTab] = useState<string>(systems[0]);
  const [open, setOpen] = useState<string | null>(null);
  const seen = useMemo(() => seenTerms(state.activity), [state.activity]);
  const learnedToday = !!state.activity?.[localToday().date]?.learn;

  /** Opening a term is what counts: it's marked as explored. */
  const show = (id: string, scroll = false) => {
    const hit = GLOSSARY.find((g) => g.id === id);
    if (!hit) return;
    setQ('');
    setTab(hit.system);
    setOpen(id);
    seeTerm(localToday().date, id);
    if (scroll) setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
  };

  /** The next term not yet opened: this tab first, then the rest in order. */
  const nextUnseen = (from: string) => {
    const order = [from, ...systems.filter((s) => s !== from)];
    for (const s of order) {
      const g = GLOSSARY.find((x) => x.system === s && !seen.has(x.id));
      if (g) return g.id;
    }
    return null;
  };

  // /learn#dasha opens that term; /learn#next opens the next new one.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id === 'next') { const n = nextUnseen(tab); if (n) show(n, true); }
    else if (id) show(id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searching = q.trim().length > 0;
  const list = useMemo(() => {
    const s = q.toLowerCase().trim();
    return s ? GLOSSARY.filter((g) => (g.term + ' ' + g.body + ' ' + g.system).toLowerCase().includes(s)) : GLOSSARY.filter((g) => g.system === tab);
  }, [q, tab]);
  const total = GLOSSARY.length;
  const explored = GLOSSARY.filter((g) => seen.has(g.id)).length;
  const upNext = nextUnseen(tab);

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header>
        <h1 className="font-display text-[26px] font-bold">Learn</h1>
        <p className="mt-1 text-sm text-muted">Every term in Orbori, in plain English. No prior astrology required.</p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl bg-night p-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span><span className="font-mono font-bold text-gold-lite">{explored}</span> <span className="text-muted">of {total} terms explored</span></span>
          <span className={`font-mono text-[11px] ${learnedToday ? 'text-gold-lite' : 'text-dim'}`}>{learnedToday ? '✦ ' : ''}+{XP.learn} XP for a new term today</span>
        </div>
        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${(explored / total) * 100}%` }} /></div>
        {upNext ? (
          <button type="button" onClick={() => show(upNext, true)}
            className="flex min-h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-bold text-space hover:bg-gold-lite">
            Next new term ›
          </button>
        ) : <p className="text-center text-sm text-gold-lite">You&apos;ve explored every term. Beautiful.</p>}
      </div>

      <label className="sr-only" htmlFor="learn-q">Search terms</label>
      <input id="learn-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all terms: houses, dasha, Māhealani…"
        className="h-12 rounded-2xl border border-line-2 bg-night px-4 text-[15px] placeholder:text-dim" />

      {!searching && (
        <div role="tablist" aria-label="Traditions" className="no-scrollbar sticky top-0 z-10 -mx-5 flex gap-1.5 overflow-x-auto bg-space/95 px-5 py-2 backdrop-blur lg:mx-0 lg:px-0">
          {systems.map((s) => {
            const terms = GLOSSARY.filter((g) => g.system === s);
            const done = terms.filter((g) => seen.has(g.id)).length;
            const on = tab === s;
            return (
              <button key={s} type="button" role="tab" aria-selected={on} onClick={() => { setTab(s); setOpen(null); window.scrollTo({ top: 0 }); }}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium ${on ? 'border-gold-lite bg-royal text-starlight' : 'border-line-2 text-muted hover:text-starlight'}`}>
                {s}<span className={`font-mono text-[10px] ${on ? 'text-gold-lite' : 'text-dim'}`}>{done}/{terms.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {searching && <p className="text-sm text-muted">{list.length} {list.length === 1 ? 'term' : 'terms'} across all traditions</p>}

      <section role={searching ? undefined : 'tabpanel'} aria-label={searching ? 'Search results' : tab} className="flex flex-col gap-2">
        {list.map((g) => {
          const isOpen = open === g.id;
          const was = seen.has(g.id);
          return (
            <article key={g.id} id={g.id} className={`scroll-mt-20 rounded-2xl bg-night ${isOpen ? 'ring-1 ring-gold' : ''}`}>
              <h2>
                <button type="button" aria-expanded={isOpen} aria-controls={`${g.id}-body`}
                  onClick={() => (isOpen ? setOpen(null) : show(g.id))}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
                  <span aria-hidden="true" className={`w-4 text-center ${was ? 'text-gold-lite' : 'text-dim'}`}>{was ? '✦' : '○'}</span>
                  <span className="flex-1 font-semibold">
                    {searching && <span className="mr-2 font-mono text-[10px] font-normal tracking-[0.08em] text-gold-lite">{g.system.toUpperCase()}</span>}
                    {g.term}
                  </span>
                  {!was && <span className="font-mono text-[10px] tracking-[0.08em] text-gold-lite">NEW</span>}
                  <span aria-hidden="true" className={`text-dim transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </button>
              </h2>
              {isOpen && (
                <div id={`${g.id}-body`} className="flex flex-col gap-3 px-4 pb-4 pl-11">
                  <p className="text-sm leading-relaxed text-muted">{g.body}</p>
                  {upNext && upNext !== g.id && (
                    <button type="button" onClick={() => show(upNext, true)} className="self-start text-sm font-semibold text-gold-lite">Next new term ›</button>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted">Nothing matches that. Try another word.</p>}
      </section>
    </div>
  );
}
