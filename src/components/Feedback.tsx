'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';

/** "Feedback" button and sheet. Records which page it came from. */
export function Feedback({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | string>('idle');
  const path = usePathname();
  const { user } = useAuth();
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const r = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: msg, page: path, email }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setStatus('sent'); setMsg(''); setTimeout(() => { setOpen(false); setStatus('idle'); }, 1800); }
    else setStatus(d.error ?? 'Could not send.');
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>Feedback</button>
      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="fb-title" className="fixed inset-0 z-50 flex items-end justify-center bg-space/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <form onSubmit={send} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-[22px] border border-royal bg-night p-5">
            <div className="flex items-center justify-between">
              <h2 id="fb-title" className="font-display text-lg font-bold">Tell us anything</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-dim hover:text-starlight">✕</button>
            </div>
            <p className="text-sm text-muted">Something broken, confusing, wrong about a tradition, or just a feeling. It goes straight to the people building Orbori.</p>
            <textarea ref={ref} value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} maxLength={4000} placeholder="What's on your mind?"
              className="rounded-2xl border border-line-2 bg-deep p-3 text-[15px] placeholder:text-dim" />
            {!user && (
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email, if you'd like a reply (optional)"
                className="h-11 rounded-2xl border border-line-2 bg-deep px-3 text-sm placeholder:text-dim" />
            )}
            <button type="submit" disabled={!msg.trim() || status === 'sending'} className="flex h-12 items-center justify-center rounded-full bg-gold font-bold text-space disabled:opacity-50">
              {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Thank you ✦' : 'Send feedback'}
            </button>
            {status !== 'idle' && status !== 'sending' && status !== 'sent' && <p role="alert" className="text-sm text-mauve-lite">{status}</p>}
          </form>
        </div>
      )}
    </>
  );
}
