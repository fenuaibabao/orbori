'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MySigil } from '@/components/Rewards';
import { Bar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { usePlus } from '@/lib/plus';
import { setPrefs, usePrefs } from '@/lib/prefs';
import { LEVELS } from '@/lib/progress';
import { CARD_STYLES, isUnlocked, REWARDS, THEMES } from '@/lib/rewards';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';
import { useProgress } from '@/lib/use-progress';

const THANK_YOU = `You made it to Celestial. That means you showed up night after night, read, wrote, played and learned your way through seven traditions. Orbori exists for people exactly like you: curious, open-hearted and willing to look up. Thank you for walking the whole path with us. — Fenua, founder of Orbori`;

export default function Rewards() {
  const { state } = useAppStore();
  const p = useProgress();
  const prefs = usePrefs();
  const { user } = useAuth();
  const plus = usePlus();
  const [claimed, setClaimed] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Mark this level's rewards as seen (clears the banner).
  useEffect(() => { if (p.levelIndex > prefs.seenLevel) setPrefs({ seenLevel: p.levelIndex }); }, [p.levelIndex, prefs.seenLevel]);

  useEffect(() => {
    const sb = supabase();
    if (!sb || !user) { setClaimed(false); return; }
    sb.from('reward_claims').select('reward').eq('user_id', user.id).eq('reward', 'plus-month').maybeSingle()
      .then(({ data }) => setClaimed(!!data));
  }, [user]);

  const claim = async () => {
    setMsg('Claiming…');
    const r = await fetch('/api/rewards/claim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reward: 'plus-month' }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d.error ?? 'Something went wrong.'); return; }
    setClaimed(true);
    setMsg(`Plus is yours until ${new Date(d.until).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Enjoy.`);
    plus.refresh();
  };

  const control = (id: string) => {
    if (id === 'themes') return (
      <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={prefs.theme === t.id} onClick={() => setPrefs({ theme: t.id })}
            className={`flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm ${prefs.theme === t.id ? 'border-gold-lite bg-royal' : 'border-line-2 hover:border-gold'}`}>
            <span aria-hidden="true" className="flex">{t.swatch.map((c) => <span key={c} className="-ml-1 h-4 w-4 rounded-full border border-black/30 first:ml-0" style={{ background: c }} />)}</span>
            {t.name}
          </button>
        ))}
      </div>
    );
    if (id === 'card-designs') return (
      <div role="radiogroup" aria-label="Share card design" className="flex flex-wrap gap-2">
        {CARD_STYLES.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={prefs.card === c.id} onClick={() => setPrefs({ card: c.id })}
            className={`min-h-11 rounded-full border px-4 text-sm ${prefs.card === c.id ? 'border-gold-lite bg-royal' : 'border-line-2 hover:border-gold'}`}>{c.name}</button>
        ))}
        <a href={`/api/card/score?score=8.4&headline=${encodeURIComponent('Where the stars agree')}&date=PREVIEW&agree=6&handle=Preview&seed=${state.profile.seed}${prefs.card !== 'classic' ? `&style=${prefs.card}` : ''}`}
          target="_blank" rel="noopener" className="flex min-h-11 items-center px-2 text-sm font-semibold text-gold-lite">Preview ↗</a>
      </div>
    );
    if (id === 'week-recap') return <Link href="/recap" className="self-start text-sm font-semibold text-gold-lite">Open your week ›</Link>;
    if (id === 'hard-mode') return <Link href="/play" className="self-start text-sm font-semibold text-gold-lite">Play Term Quest ›</Link>;
    if (id === 'plus-month') {
      if (!user) return <Link href={`/signin?next=${encodeURIComponent('/rewards')}`} className="self-start text-sm font-semibold text-gold-lite">Sign in to claim ›</Link>;
      if (claimed) return <p className="text-sm text-gold-lite">{msg ?? 'Claimed. Thank you for being an Oracle.'}</p>;
      return (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={claim} disabled={claimed === null || msg === 'Claiming…'}
            className="flex min-h-11 items-center justify-center self-start rounded-full bg-gold px-5 text-sm font-bold text-space disabled:opacity-60">Claim 30 days of Plus</button>
          {plus.plus && !msg && <p className="text-xs text-dim">You already have Plus, so save this for later. It starts the day you claim it.</p>}
          {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
        </div>
      );
    }
    if (id === 'thank-you') return <blockquote className="rounded-xl bg-deep p-3 text-sm italic leading-relaxed text-muted">{THANK_YOU}</blockquote>;
    return null;
  };

  return (
    <div className="flex flex-col gap-6 lg:max-w-3xl">
      <header className="flex items-center gap-4">
        <MySigil seed={state.profile.seed} size={64} />
        <div className="flex-1">
          <h1 className="font-display text-[26px] font-bold leading-tight">Rewards</h1>
          <p className="text-sm text-muted">You&apos;re a <strong className="text-gold-lite">{p.level}</strong> · {p.xp.toLocaleString('en-US')} XP{p.nextLevel ? ` · ${(p.nextLevel.xp - p.xp).toLocaleString('en-US')} to ${p.nextLevel.name}` : ''}</p>
          <div className="mt-2"><Bar value={p.levelProgress} /></div>
        </div>
      </header>
      <p className="-mt-2 text-sm text-dim">Every level unlocks something, for everyone. Earn XP by checking in, journaling, learning, playing and connecting.</p>

      {LEVELS.slice(1).map((lv, i) => {
        const level = i + 1;
        const open = p.levelIndex >= level;
        return (
          <section key={lv.name} aria-labelledby={`lv-${level}`} className={`flex flex-col gap-3 rounded-3xl border p-5 ${open ? 'border-gold bg-night' : 'border-line bg-night/60'}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`lv-${level}`} className="font-display text-xl font-bold">{lv.name}</h2>
              <span className={`font-mono text-[11px] tracking-[0.06em] ${open ? 'text-gold-lite' : 'text-dim'}`}>
                {open ? 'UNLOCKED' : `${lv.xp.toLocaleString('en-US')} XP · ${(lv.xp - p.xp).toLocaleString('en-US')} TO GO`}
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              {REWARDS.filter((r) => r.level === level).map((r) => (
                <li key={r.id} className="flex flex-col gap-2 rounded-2xl bg-deep p-4">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className={`mt-0.5 ${open ? 'text-gold-lite' : 'text-dim'}`}>{open ? '✦' : '○'}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">{r.title}</h3>
                      <p className="text-sm text-muted">{r.body}</p>
                    </div>
                  </div>
                  {isUnlocked(p.levelIndex, r.id) && control(r.id) && <div className="flex flex-col pl-7">{control(r.id)}</div>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
