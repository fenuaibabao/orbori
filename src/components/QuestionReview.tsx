'use client';
import { useEffect, useState } from 'react';

interface Item { id: string; text: string; status: string; by: string; created_at: string }

/** Owner: approve the journal questions Celestials write before they go live. */
export function QuestionReview() {
  const [items, setItems] = useState<Item[] | null>(null);
  const load = () => fetch('/api/admin/questions').then((r) => r.json()).then((d) => setItems(d.items ?? [])).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  const set = async (id: string, status: string) => {
    await fetch('/api/admin/questions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  };
  const pending = items?.filter((i) => i.status === 'pending') ?? [];
  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-royal bg-night p-[18px]">
      <h2 className="font-display text-lg font-bold">Celestial questions <span className="font-mono text-sm text-gold-lite">{pending.length}</span></h2>
      <p className="text-sm text-muted">Questions Celestials wrote for everyone&apos;s journal. Approved ones rotate on Today, credited by handle.</p>
      {items === null ? <p className="text-sm text-dim">Loading…</p> : items.length === 0 ? <p className="text-sm text-dim">None yet.</p> : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.id} className="flex flex-col gap-2 rounded-xl bg-deep p-3 text-sm">
              <p>{i.text}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-dim">{i.by} · {i.status}</span>
                <span className="flex-1" />
                {i.status !== 'approved' && <button type="button" onClick={() => set(i.id, 'approved')} className="min-h-9 rounded-full bg-gold px-3 text-xs font-bold text-space">Approve</button>}
                {i.status !== 'rejected' && <button type="button" onClick={() => set(i.id, 'rejected')} className="min-h-9 rounded-full border border-royal px-3 text-xs">Reject</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
