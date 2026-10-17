'use client';
import { useEffect, useState } from 'react';

/** Save what friends call you. Returns the saved name, or an error message. */
export async function saveFriendName(name: string): Promise<{ ok: boolean; name: string | null; error?: string }> {
  const r = await fetch('/api/names', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ friendName: name }) });
  const d = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, name: d.friendName ?? null } : { ok: false, name: null, error: d.error ?? 'Could not save.' };
}

/** "What should friends call you?" Only linked friends see it, never the public Cosmos. */
export function FriendName({ compact = false }: { compact?: boolean }) {
  const [saved, setSaved] = useState<string | null>(null);
  const [val, setVal] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    fetch('/api/names').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) { setSaved(d.friendName); setVal(d.friendName ?? ''); } setLoaded(true); }).catch(() => setLoaded(true));
  }, []);
  const save = async () => {
    const r = await saveFriendName(val);
    if (!r.ok) return setMsg(r.error ?? '');
    setSaved(r.name); setVal(r.name ?? ''); setMsg(r.name ? 'Saved ✦' : 'Cleared. Friends will see your handle.');
    setTimeout(() => setMsg(''), 2500);
  };
  if (!loaded) return null;
  const dirty = (val.trim() || null) !== saved;
  return (
    <div className={compact ? '' : 'mt-2 rounded-[18px] bg-night p-3'}>
      <label htmlFor="friend-name" className="block text-[13px] font-semibold">What should friends call you?</label>
      <div className="mt-1.5 flex gap-2">
        <input id="friend-name" value={val} onChange={(e) => setVal(e.target.value)} maxLength={24} placeholder="A first name or nickname"
          className="h-10 min-w-0 flex-1 rounded-xl border border-line-2 bg-deep px-3 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
        <button type="button" onClick={save} disabled={!dirty} className="h-10 flex-none rounded-full bg-gold px-4 text-xs font-extrabold text-space disabled:opacity-40">Save</button>
      </div>
      <p className="mt-1.5 text-[11px] text-dim">{msg || 'Only people in your constellation see this. The public Cosmos keeps you anonymous.'}</p>
    </div>
  );
}
