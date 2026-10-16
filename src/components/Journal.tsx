'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { XP } from '@/lib/progress';
import { type ReadingSnapshot, useAppStore } from '@/lib/store';

/** Words that count as "wrote something" for the day's XP. */
const MIN_CHARS = 20;

/** A journal entry for one date that saves as you type. */
export function JournalEditor({ date, prompt, reading, rows = 5, autoFocus = false }: { date: string; prompt?: string; reading?: ReadingSnapshot; rows?: number; autoFocus?: boolean }) {
  const { state, writeJournal, record } = useAppStore();
  const saved = state.journal?.[date]?.text ?? '';
  const [text, setText] = useState(saved);
  const [status, setStatus] = useState<'idle' | 'typing' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = useRef(false);

  // Pick up entries that arrive from another device, unless you're mid-sentence.
  useEffect(() => { if (!dirty.current) setText(saved); }, [saved]);

  const save = (value: string) => {
    writeJournal(date, value, prompt, value.trim() ? reading : undefined);
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
export function JournalCard({ date, prompt, reading }: { date: string; prompt?: string | null; reading?: ReadingSnapshot }) {
  const { state, writeJournal } = useAppStore();
  const done = !!state.activity?.[date]?.journal;
  const entry = state.journal?.[date];
  // Wrote before the AI reading arrived? Tuck it in once it does.
  useEffect(() => {
    if (entry?.text.trim() && reading?.ai && !entry.reading?.ai) writeJournal(date, entry.text, undefined, reading);
  }, [entry, reading, date, writeJournal]);
  const shown = state.journal?.[date]?.prompt ?? prompt ?? 'What stood out about today?';
  return (
    <section aria-labelledby="journal" className="flex flex-col gap-3 rounded-3xl border border-line bg-night p-5 lg:col-span-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="journal" className="font-display text-lg font-bold">Tonight&apos;s journal</h2>
        <span className={`font-mono text-[11px] ${done ? 'text-gold-lite' : 'text-dim'}`}>{done ? '✦ ' : ''}+{XP.journal} XP</span>
      </div>
      <p className="text-[15px] leading-relaxed text-muted">{shown}</p>
      <JournalEditor date={date} prompt={shown} reading={reading} />
      <p className="-mt-1 text-xs text-dim">Today&apos;s reading is saved alongside what you write.</p>
      <Link href="/journal" className="self-start text-sm text-gold-lite">All entries ›</Link>
    </section>
  );
}

/** The reading saved with an entry, folded away until opened. */
export function SavedReading({ reading }: { reading: ReadingSnapshot }) {
  return (
    <details className="group rounded-xl bg-deep px-3.5 py-2.5">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-sm">
        <span><span className="font-mono text-gold-lite">{reading.score.toFixed(1)}</span> <span className="text-muted">· {reading.headline}</span></span>
        <span aria-hidden="true" className="text-dim group-open:rotate-90">›</span>
      </summary>
      <div className="flex flex-col gap-2 pb-1 pt-2 text-sm leading-relaxed">
        <p className="text-muted">{reading.agreeCount} of {reading.voices} voices agreed.{reading.agreeText ? ` ${reading.agreeText}` : ''}</p>
        {reading.holdoutText && <p className="text-mauve-lite">{reading.holdoutText}</p>}
        {reading.ai && reading.ai.split(/\n\s*\n/).map((p, i) => <p key={i}>{p.trim()}</p>)}
      </div>
    </details>
  );
}
