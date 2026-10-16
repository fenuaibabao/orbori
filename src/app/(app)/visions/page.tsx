'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { usePlus } from '@/lib/plus';
import { setPrefs, usePrefs } from '@/lib/prefs';
import { useAppStore } from '@/lib/store';
import { useProgress } from '@/lib/use-progress';
import { saveImage } from '@/lib/save-image';
import { HAIR, SKIN, VISION_KINDS, type VisionKind } from '@/lib/visions';

interface Vision { id: string; kind: VisionKind; note: string | null; url: string | null; created_at: string }
const nameOf = (k: string) => VISION_KINDS.find((v) => v.id === k)?.name ?? k;

export default function Visions() {
  const { state } = useAppStore();
  const prefs = usePrefs();
  const { user } = useAuth();
  const plus = usePlus();
  const p = useProgress();
  const [info, setInfo] = useState<{ enabled: boolean; items: Vision[]; usedToday: number; limit: number; monthLeft?: number | null; credits?: number; allowance?: boolean; packs?: { id: string; credits: number; cents: number; open: boolean }[] } | null>(null);
  const [busy, setBusy] = useState<VisionKind | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () => fetch('/api/visions').then((r) => r.json()).then(setInfo).catch(() => setInfo({ enabled: false, items: [], usedToday: 0, limit: 3 }));
  useEffect(() => { load(); }, [user]);
  // Back from Stripe: credits land a moment later, when Stripe confirms the payment.
  const [bought, setBought] = useState(false);
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('credits')) return;
    setBought(true);
    const t = [2000, 5000, 10000].map((ms) => setTimeout(load, ms));
    return () => t.forEach(clearTimeout);
  }, []);
  const buy = async (pack: string) => {
    setErr(null);
    const r = await fetch('/api/credits/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pack }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.url) { setErr(d.error ?? 'Something went wrong.'); return; }
    window.location.assign(d.url);
  };

  // Free art: drawn by Orbori from your sigil (Celestials' own design and theme carry over).
  const art = (kind: 'wallpaper' | 'flash') => {
    const q = new URLSearchParams({ seed: String(state.profile.seed), theme: prefs.theme });
    if (p.levelIndex >= 4 && prefs.sigil) { q.set('sides', String(prefs.sigil.sides)); q.set('inner', prefs.sigil.inner ? '1' : '0'); q.set('ring', prefs.sigil.ring ? '1' : '0'); }
    return `/api/art/${kind}?${q}`;
  };

  const make = async (kind: VisionKind) => {
    setBusy(kind); setErr(null);
    const r = await fetch('/api/visions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, input: state.profile.input, look: prefs.look }) });
    const d = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) { setErr(d.error ?? 'Something went wrong.'); return; }
    load();
  };
  const [saving, setSaving] = useState<string | null>(null);
  const save = async (key: string, url: string, filename: string) => {
    setSaving(key);
    const r = await saveImage(url, filename);
    setSaving(null);
    if (r === 'failed') setErr('Could not save that image. Try again.');
  };
  const remove = async (id: string) => { await fetch(`/api/visions?id=${id}`, { method: 'DELETE' }); load(); };

  const left = info ? Math.max(0, info.limit - info.usedToday) : 0;
  const credits = info?.credits ?? 0;
  const canMake = !!user && !!info?.enabled && (left > 0 || credits > 0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[26px] font-bold">Cosmic Visions</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">Your chart, made visible. Everything here is inspired by your signs&apos; colors, elements and moods, never by any tradition&apos;s sacred dress or objects.</p>
      </header>

      <section aria-labelledby="free" className="flex flex-col gap-3">
        <h2 id="free" className="font-display text-xl font-bold">Made from your sigil <span className="ml-1 font-mono text-[11px] font-normal text-gold-lite">FREE</span></h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([['wallpaper', 'Phone wallpaper', 'Your sigil among the stars, in your theme\'s colors.'], ['flash', 'Sigil tattoo flash', 'Your sigil four ways: fine line, bold, dotwork and with orbs. Take it to your artist.']] as const).map(([k, title, body]) => (
            <article key={k} className="flex flex-col gap-3 rounded-3xl bg-night p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art(k)} alt={title} loading="lazy" className={`w-full rounded-2xl bg-deep object-cover ${k === 'wallpaper' ? 'aspect-[9/16] max-h-80 object-top' : 'aspect-square'}`} />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted">{body}</p>
              </div>
              <button type="button" onClick={() => save(k, art(k), `orbori-${k}.png`)} disabled={saving === k} className="flex min-h-11 items-center justify-center self-start rounded-full bg-gold px-5 text-sm font-bold text-space disabled:opacity-60">{saving === k ? 'Saving…' : 'Save'}</button>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="ai" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ai" className="font-display text-xl font-bold">Visions <span className="ml-1 font-mono text-[11px] font-normal text-gold-lite">PLUS</span></h2>
          {user && info?.enabled && <span className="font-mono text-[11px] text-muted">{info.allowance ? `${left} free today${info.monthLeft != null ? ` · ${info.monthLeft} this month` : ''} · ` : ''}{credits} {credits === 1 ? 'credit' : 'credits'}</span>}
        </div>
        {!info?.enabled ? <p className="rounded-2xl bg-night p-4 text-sm text-muted">Visions are being switched on. Check back soon.</p>
          : !user ? <p className="rounded-2xl bg-night p-4 text-sm">Sign in to make visions. <Link href={`/signin?next=${encodeURIComponent('/visions')}`} className="font-semibold text-gold-lite">Sign in ›</Link></p>
          : !plus.plus && credits === 0 ? <p className="rounded-2xl bg-night p-4 text-sm">Visions come with <Link href="/plus" className="font-semibold text-gold-lite">Orbori Plus</Link> (3 a day, 20 a month), or with a pack of credits below.</p>
          : null}
        {bought && <p role="status" className="rounded-2xl border border-gold bg-night p-4 text-sm">Thank you. Your credits are on their way; they appear here within a few seconds.</p>}

        <details className="rounded-2xl bg-night p-4 text-sm">
          <summary className="cursor-pointer font-semibold">How should we picture you? <span className="font-normal text-muted">(optional, for makeup, nails and hair)</span></summary>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1">Skin tone
              <select value={prefs.look.skin ?? ''} onChange={(e) => setPrefs({ look: { ...prefs.look, skin: e.target.value || undefined } })} className="h-11 rounded-xl border border-line-2 bg-deep px-3">
                <option value="">Surprise me</option>{SKIN.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">Hair
              <select value={prefs.look.hair ?? ''} onChange={(e) => setPrefs({ look: { ...prefs.look, hair: e.target.value || undefined } })} className="h-11 rounded-xl border border-line-2 bg-deep px-3">
                <option value="">Surprise me</option>{HAIR.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <p className="text-xs text-dim">Saved on this device only. Visions never show a real person.</p>
          </div>
        </details>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {VISION_KINDS.map((v) => (
            <article key={v.id} className="flex flex-col gap-2 rounded-3xl border border-royal bg-night p-4">
              <h3 className="font-display text-lg font-bold">{v.name}</h3>
              <p className="text-sm text-muted">{v.blurb}</p>
              <button type="button" onClick={() => make(v.id)} disabled={!canMake || !!busy || left === 0}
                className="mt-auto flex min-h-11 items-center justify-center self-start rounded-full bg-gold px-5 text-sm font-bold text-space disabled:opacity-50">
                {busy === v.id ? 'Painting… about a minute' : left > 0 ? 'Make it' : 'Make it · 1 credit'}
              </button>
            </article>
          ))}
        </div>
        {err && <p role="alert" className="text-sm text-mauve-lite">{err}</p>}
      </section>

      {user && info?.enabled && info.packs && (
        <section aria-labelledby="packs" className="flex flex-col gap-3 rounded-3xl border border-line bg-night p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="packs" className="font-display text-xl font-bold">More visions</h2>
            <span className="font-mono text-[11px] text-gold-lite">{credits} {credits === 1 ? 'CREDIT' : 'CREDITS'}</span>
          </div>
          <p className="text-sm text-muted">One credit makes one vision, any kind. Credits never expire and are used only after your free Plus visions run out. Priced close to what each image costs us.</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {info.packs.map((pk) => (
              <li key={pk.id}>
                <button type="button" onClick={() => buy(pk.id)} disabled={!pk.open}
                  className="flex min-h-20 w-full flex-col items-center justify-center rounded-2xl border border-line-2 bg-deep p-3 text-center hover:border-gold disabled:opacity-60">
                  <span className="font-mono text-lg font-bold text-gold-lite">{pk.credits}</span>
                  <span className="text-xs text-muted">visions</span>
                  <span className="mt-1 text-sm font-semibold">${(pk.cents / 100).toFixed(2)}</span>
                </button>
              </li>
            ))}
          </ul>
          {info.packs.some((pk) => !pk.open) && <p className="text-xs text-dim">Credit packs open after the beta.</p>}
        </section>
      )}

      {info && info.items.length > 0 && (
        <section aria-labelledby="mine" className="flex flex-col gap-3">
          <h2 id="mine" className="font-display text-xl font-bold">Your visions</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {info.items.map((v) => (
              <li key={v.id} className="flex flex-col gap-2 rounded-2xl bg-night p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {v.url && <img src={v.url} alt={nameOf(v.kind)} className="aspect-[2/3] w-full rounded-xl object-cover" />}
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs font-semibold">{nameOf(v.kind)}</span>
                  <span className="flex gap-2 text-xs">
                    {v.url && <button type="button" onClick={() => save(v.id, `/api/visions/download?id=${v.id}`, `orbori-${v.kind}.jpg`)} disabled={saving === v.id} className="min-h-8 text-gold-lite disabled:opacity-60">{saving === v.id ? 'Saving…' : 'Save'}</button>}
                    <button type="button" onClick={() => remove(v.id)} className="text-muted hover:text-starlight">Delete</button>
                  </span>
                </div>
                {v.note && <p className="px-1 text-[11px] text-dim">{v.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-dim">Images are made by AI (OpenAI) from a description of your chart&apos;s signs and colors. Your name, email and birth details are never sent. Saved privately to your account; delete any time.</p>
    </div>
  );
}
