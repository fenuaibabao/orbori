'use client';
import { useMemo, useState } from 'react';
import { JournalEditor, SavedReading } from '@/components/Journal';
import { localToday, useAppStore } from '@/lib/store';

const pretty = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export default function Journal() {
  const { state } = useAppStore();
  const { date: today } = localToday();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const entries = useMemo(() => {
    const s = q.toLowerCase().trim();
    return Object.entries(state.journal ?? {})
      .filter(([d, e]) => d !== today && e.text.trim() && (!s || (e.text + ' ' + (e.prompt ?? '')).toLowerCase().includes(s)))
      .sort(([a], [b]) => b.localeCompare(a));
  }, [state.journal, q, today]);
  const total = Object.values(state.journal ?? {}).filter((e) => e.text.trim()).length;

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header>
        <h1 className="font-display text-[26px] font-bold">Journal</h1>
        <p className="mt-1 text-sm text-muted">A running diary next to your readings. Private to you{total ? ` · ${total} ${total === 1 ? 'entry' : 'entries'}` : ''}.</p>
      </header>

      <section aria-labelledby="today-entry" className="flex flex-col gap-3 rounded-3xl border border-gold bg-night p-5">
        <h2 id="today-entry" className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">TODAY · {pretty(today).toUpperCase()}</h2>
        {state.journal?.[today]?.prompt && <p className="text-[15px] leading-relaxed text-muted">{state.journal[today].prompt}</p>}
        {state.journal?.[today]?.reading && <SavedReading reading={state.journal[today].reading!} />}
        <JournalEditor date={today} rows={6} />
      </section>

      {total > 3 && (
        <>
          <label className="sr-only" htmlFor="journal-q">Search your journal</label>
          <input id="journal-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your entries…"
            className="h-12 rounded-2xl border border-line-2 bg-night px-4 text-[15px] placeholder:text-dim" />
        </>
      )}

      <div className="flex flex-col gap-3">
        {entries.map(([d, e]) => (
          <article key={d} className="flex flex-col gap-2 rounded-2xl bg-night p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">{pretty(d).toUpperCase()}</h2>
              <button type="button" onClick={() => setEditing(editing === d ? null : d)} className="min-h-9 rounded-full px-3 text-xs font-semibold text-muted hover:text-starlight">
                {editing === d ? 'Done' : 'Edit'}
              </button>
            </div>
            {e.reading && <SavedReading reading={e.reading} />}
            {e.prompt && <p className="text-sm italic text-dim">{e.prompt}</p>}
            {editing === d ? <JournalEditor date={d} autoFocus /> : <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{e.text}</p>}
          </article>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-muted">{q ? 'Nothing matches that.' : 'Past entries will collect here, one per day.'}</p>
        )}
      </div>
    </div>
  );
}
