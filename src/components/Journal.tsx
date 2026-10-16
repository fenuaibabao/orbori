'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { XP } from '@/lib/progress';
import { useAppStore } from '@/lib/store';

/** Words that count as "wrote something" for the day's XP. */
const MIN_CHARS = 20;

/** A journal entry for one date that saves as you type. */
export function JournalEditor({ date, prompt, rows = 5, autoFocus = false }: { date: string; prompt?: string; rows?: number; autoFocus?: boolean }) {
  const { state, writeJournal, record } = useAppStore();
  const saved = state.journal?.[date]?.text ?? '';
  const [text, setText] = useState(saved);
  const [status, setStatus] = useState<'idle' | 'typing' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = useRef(false);

  // Pick up entries that arrive from another device, unless you're mid-sentence.
  useEffect(() => { if (!dirty.current) setText(saved); }, [saved]);

  const save = (value: string) => {
    writeJournal(date, value, prompt);
    if (value.trim().length >= MIN_CHARS) record(date, { journal: true });
    dirty.current = false;
    setStatus('saved');
  };

  useEffect(() => () => { if (dirty.current) clearTimeout(timer.current); }, []);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`journal-${date}`} className="sr-only">Journal entry for {date}</label>
      <textarea
        id={`journal-${date}`}
        value={text}
        rows={rows}
        autoFocus={autoFocus}
        placeholder="Write as much or as little as you like…"
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          dirty.current = true;
          setStatus('typing');
          clearTimeout(timer.current);
          timer.current = setTimeout(() => save(v), 700);
        }}
        onBlur={() => { if (dirty.current) { clearTimeout(timer.current); save(text); } }}
        className="min-h-28 w-full resize-y rounded-2xl border border-line-2 bg-deep p-4 text-[15px] leading-relaxed placeholder:text-dim focus:border-gold-lite"
      />
      <p aria-live="polite" className="text-xs text-dim">
        {status === 'typing' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Private to you. Never shared or sent to the AI.'}
      </p>
    </div>
  );
}

/** Today's journal card. The prompt is the reading's closing question when there is one. */
export function JournalCard({ date, prompt }: { date: string; prompt?: string | null }) {
  const { state } = useAppStore();
  const done = !!state.activity?.[date]?.journal;
  const shown = state.journal?.[date]?.prompt ?? prompt ?? 'What stood out about today?';
  return (
    <section aria-labelledby="journal" className="flex flex-col gap-3 rounded-3xl border border-line bg-night p-5 lg:col-span-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="journal" className="font-display text-lg font-bold">Tonight&apos;s journal</h2>
        <span className={`font-mono text-[11px] ${done ? 'text-gold-lite' : 'text-dim'}`}>{done ? '✦ ' : ''}+{XP.journal} XP</span>
      </div>
      <p className="text-[15px] leading-relaxed text-muted">{shown}</p>
      <JournalEditor date={date} prompt={shown} />
      <Link href="/journal" className="self-start text-sm text-gold-lite">All entries ›</Link>
    </section>
  );
}
