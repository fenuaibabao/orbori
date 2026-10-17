'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useAppStore } from '@/lib/store';

/** Me → Delete my account. Permanent, so it asks you to type DELETE first. */
export function DeleteAccount() {
  const auth = useAuth();
  const { reset } = useAppStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!auth.user) return null;

  const go = async () => {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/account', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirm: text.trim().toUpperCase() }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not delete your account.');
      reset();
      try { localStorage.clear(); sessionStorage.clear(); } catch { /* fine */ }
      await auth.signOut().catch(() => {});
      router.replace('/welcome?deleted=1');
    } catch (e) { setError((e as Error).message); setBusy(false); }
  };

  return (
    <div className="border-t border-line">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-12 w-full items-center px-4 text-left text-sm font-medium text-[#E7B7BA]">Delete my account</button>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="text-[15px] font-semibold">Delete your account for good?</p>
          <ul className="list-disc pl-5 text-xs leading-relaxed text-muted">
            <li>Your chart, check-ins, streak, journal, matches, Visions and rewards are deleted.</li>
            <li>Any paid plan is canceled right away, with no further charges.</li>
            <li>This can&apos;t be undone.</li>
          </ul>
          <label className="text-xs text-dim">Type <b className="text-starlight">DELETE</b> to confirm
            <input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoCapitalize="characters"
              className="mt-1.5 block min-h-11 w-full rounded-xl border border-line-2 bg-deep px-3 text-[15px] text-starlight" />
          </label>
          {error && <p role="alert" className="text-xs text-mauve-lite">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setOpen(false); setText(''); setError(''); }} className="min-h-11 flex-1 rounded-full border border-line-2 text-sm font-semibold text-muted">Keep my account</button>
            <button type="button" onClick={go} disabled={busy || text.trim().toUpperCase() !== 'DELETE'}
              className="min-h-11 flex-1 rounded-full bg-[#b5545b] text-sm font-bold text-starlight disabled:opacity-40">{busy ? 'Deleting…' : 'Delete forever'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
