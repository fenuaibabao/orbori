'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { SearchIcon } from './icons';

export interface CityPick { label: string; latitude: number; longitude: number; timeZone: string }

export function CityField({ value, onPick }: { value: CityPick | null; onPick: (c: CityPick | null) => void }) {
  const id = useId();
  const [q, setQ] = useState(value?.label ?? '');
  const [results, setResults] = useState<(CityPick & { id: number })[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (value) setQ(value.label); }, [value]);

  useEffect(() => {
    if (value && q === value.label) return;
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setResults(d.cities ?? []);
      setActive(0);
      setOpen(true);
    }, 180);
  }, [q, value]);

  const choose = (c: CityPick) => { onPick(c); setQ(c.label); setOpen(false); };

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold tracking-wide text-muted">Birth city</label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-[18px] text-dim" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Start typing a city"
          value={q}
          onChange={(e) => { setQ(e.target.value); if (value) onPick(null); }}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
            if (e.key === 'Escape') setOpen(false);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="h-14 w-full rounded-2xl border border-line-2 bg-night pl-12 pr-4 text-[17px] font-medium text-starlight placeholder:text-dim"
        />
      </div>
      {open && results.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-royal bg-[#0B0934]">
          {results.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(c)}
                className={`flex min-h-12 w-full items-center px-4 text-left text-[15px] ${i === active ? 'bg-night-2' : ''}`}>
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
