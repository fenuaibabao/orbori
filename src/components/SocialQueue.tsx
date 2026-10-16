'use client';
import { useEffect, useState } from 'react';

interface Post { id: string; kind: string; slug: string; scheduled_at: string | null; status: string; caption: string; error: string | null; posted_at: string | null }
interface Data { posts: Post[]; paused: boolean; connection: string; account: { username: string } | null }

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }) + ' PT' : 'held');
const TITLE: Record<string, string> = { '1': 'Seven traditions. One sky.', '2': 'The Cosmic Council', '3': 'Meet the Council', '4': "Chol Q'ij", '5': 'Thirty nights', '6': 'Your sigil', '7': 'Founding 111', '8': 'Stargazer to Celestial', '9': 'From the founder' };

/** Owner: Orbori's Instagram autopilot. */
export function SocialQueue() {
  const [d, setD] = useState<Data | null>(null);
  const load = () => fetch('/api/admin/social').then((r) => r.json()).then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  const act = async (action: string, id?: string) => {
    if (action === 'release' && !confirm('Post Founding 111 to Instagram in the next few minutes?')) return;
    await fetch('/api/admin/social', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, id }) });
    load();
  };
  const upcoming = d?.posts.filter((p) => ['scheduled', 'held', 'publishing', 'failed'].includes(p.status)) ?? [];
  const done = d?.posts.filter((p) => p.status === 'posted').slice(-5).reverse() ?? [];
  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-royal bg-night p-[18px]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Instagram autopilot</h2>
        {d && <span className={`font-mono text-[11px] ${d.connection === 'connected' ? 'text-gold-lite' : 'text-mauve-lite'}`}>{d.connection === 'connected' ? `@${d.account?.username}` : 'not connected'}</span>}
      </div>
      {d && d.connection !== 'connected' && <p className="text-sm text-muted">Waiting for the Instagram key (IG_ACCESS_TOKEN and IG_USER_ID in Vercel). Nothing posts until then.{d.connection !== 'not connected' ? ` Instagram said: ${d.connection}` : ''}</p>}
      {d && (
        <button type="button" onClick={() => act(d.paused ? 'resume' : 'pause')} className={`min-h-10 self-start rounded-full px-4 text-sm font-semibold ${d.paused ? 'bg-gold text-space' : 'border border-royal'}`}>
          {d.paused ? 'Paused: tap to resume posting' : 'Pause all posting'}
        </button>
      )}
      <ul className="flex flex-col gap-1.5 text-sm">
        {upcoming.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-deep px-3 py-2">
            <span className="w-40 shrink-0 font-mono text-[11px] text-muted">{when(p.scheduled_at)}</span>
            <span className="flex-1">{p.kind === 'sky' ? `Sky today · ${p.slug}` : TITLE[p.slug] ?? p.slug}</span>
            <span className={`font-mono text-[10px] ${p.status === 'failed' ? 'text-mauve-lite' : 'text-dim'}`}>{p.status.toUpperCase()}</span>
            {p.status === 'held' && <button type="button" onClick={() => act('release', p.id)} className="min-h-8 rounded-full bg-gold px-3 text-xs font-bold text-space">Post now</button>}
            {p.status === 'failed' && <button type="button" onClick={() => act('retry', p.id)} className="min-h-8 rounded-full border border-royal px-3 text-xs">Retry</button>}
            {['scheduled', 'held'].includes(p.status) && <button type="button" onClick={() => act('cancel', p.id)} className="min-h-8 px-2 text-xs text-muted hover:text-starlight">Cancel</button>}
            {p.error && <p className="w-full text-xs text-mauve-lite">{p.error}</p>}
          </li>
        ))}
      </ul>
      {done.length > 0 && <p className="text-xs text-dim">Recently posted: {done.map((p) => (p.kind === 'sky' ? `Sky ${p.slug}` : TITLE[p.slug])).join(' · ')}</p>}
    </section>
  );
}
