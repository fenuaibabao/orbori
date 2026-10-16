'use client';
import { useEffect, useMemo, useState } from 'react';
import { useBirthFields } from '@/components/BirthFields';
import { Constellation } from '@/components/Constellation';
import { LinkedPeople } from '@/components/LinkedPeople';
import { MatchResult } from '@/components/MatchResult';
import { btnPrimary } from '@/components/ui';
import type { Compatibility } from '@/lib/compat';
import { handleFromSeed, randomSeed } from '@/lib/identity';
import { XP } from '@/lib/progress';
import { big3, cardUrl, shareCard } from '@/lib/share';
import { useAppStore, type Match } from '@/lib/store';
import { useChart } from '@/lib/hooks';

type Result = { compat: Compatibility };

async function fetchCompat(a: Match['input'], b: Match['input']): Promise<Result> {
  const key = 'orbori.compat.' + JSON.stringify([a, b]);
  try { const hit = sessionStorage.getItem(key); if (hit) return JSON.parse(hit); } catch { /* ignore */ }
  const r = await fetch('/api/compat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a, b }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error ?? 'Could not compare charts.');
  try { sessionStorage.setItem(key, JSON.stringify(d)); } catch { /* ignore */ }
  return d;
}

export default function CompatibilityPage() {
  const { state, addMatch, removeMatch } = useAppStore();
  const profile = state.profile;
  const { data: mine } = useChart(profile);
  const matches = state.matches;
  const [selected, setSelected] = useState<string | null>(matches[matches.length - 1]?.id ?? null);
  const [results, setResults] = useState<Record<string, Compatibility>>({});
  const [adding, setAdding] = useState(matches.length === 0);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const form = useBirthFields('partner');

  useEffect(() => {
    matches.forEach((m) => {
      if (results[m.id]) return;
      fetchCompat(profile.input, m.input).then((r) => setResults((x) => ({ ...x, [m.id]: r.compat })), () => {});
    });
  }, [matches, profile.input, results]);

  const stars = useMemo(() => matches.map((m) => ({ id: m.id, label: m.nickname, seed: m.seed, score: results[m.id]?.score })), [matches, results]);
  const current = matches.find((m) => m.id === selected) ?? null;
  const currentResult = current ? results[current.id] : null;
  const toCrew = Math.max(0, 3 - matches.length);
  const toHome = Math.max(0, 5 - matches.length);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = form.validate();
    if (typeof v === 'string') return setError(v);
    if (!nickname.trim()) return setError('Give them a nickname (only you see it).');
    setBusy(true);
    try {
      await fetchCompat(profile.input, v.input);
      const m = addMatch({ nickname: nickname.trim().slice(0, 24), input: v.input, cityLabel: v.cityLabel, seed: randomSeed() });
      setSelected(m.id);
      setAdding(false);
      setNickname('');
      form.reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async () => {
    if (!current || !currentResult || !mine) return;
    setStatus('Creating your invite…');
    const r = await fetch('/api/invite', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: profile.input, handle: handleFromSeed(profile.seed), seed: profile.seed, nickname: current.nickname }),
    });
    const d = await r.json();
    if (!r.ok) { setStatus(d.error ?? 'Could not create the invite.'); return; }
    const link = `${window.location.origin}${d.path}`;
    const url = cardUrl('match', {
      handle: handleFromSeed(profile.seed), seed: profile.seed, big3: big3(mine.chart),
      partner: current.nickname, pseed: current.seed, score: currentResult.score.toFixed(1), headline: currentResult.headline,
      bars: currentResult.systems.map((s) => s.score.toFixed(1)).join(','),
    });
    const res = await shareCard(url, `${current.nickname}, our Orbori match is ${currentResult.score.toFixed(1)}/10. See your side:`, 'orbori-match.png', link);
    setStatus(res === 'shared' ? 'Sent. Their half unlocks when they open it.' : res === 'downloaded' ? 'Card saved and invite link copied. Send both to them.' : '');
  };

  return (
    <div className="flex flex-col gap-6 lg:max-w-3xl">
      <h1 className="font-display text-[26px] font-bold">Compatibility</h1>

      <LinkedPeople />

      <section aria-labelledby="const" className="flex flex-col gap-3.5 rounded-[22px] bg-night p-[18px]">
        <div className="flex items-baseline justify-between">
          <h2 id="const" className="font-display text-[19px] font-bold">Your Constellation</h2>
          <span className="font-mono text-xs text-muted"><span className="font-bold text-gold-lite">{matches.length}</span> {matches.length === 1 ? 'MATCH' : 'MATCHES'}</span>
        </div>
        <Constellation me={profile.seed} stars={stars} selected={selected} onPick={(id) => { setSelected(id); setAdding(false); }} onAdd={() => setAdding(true)} />
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {toCrew > 0
              ? <><span className="font-mono font-bold text-gold-lite">{toCrew} more {toCrew === 1 ? 'match' : 'matches'}</span> to unlock your Crew Reading</>
              : toHome > 0
                ? <>Crew Reading unlocked. <span className="font-mono font-bold text-gold-lite">{toHome} more</span> for your Crew Home Vision</>
                : <>Crew Reading and Crew Home Vision unlocked.</>}
          </p>
          <div aria-hidden="true" className="grid grid-cols-5 gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`h-2 rounded ${i < matches.length ? 'bg-gold' : 'bg-line'} ${i === 2 ? 'border-r-2 border-gold-lite' : ''}`} />
            ))}
          </div>
          <div className="flex justify-between font-mono text-[10px] text-dim"><span>3 · CREW READING</span><span>5 · CREW HOME VISION</span></div>
        </div>
      </section>

      {adding && (
        <form onSubmit={submit} noValidate aria-label="Partner birth details" className="flex flex-col gap-4 rounded-[20px] bg-night p-4">
          <p className="font-display text-[17px] font-bold">Who are we checking?</p>
          <div>
            <label htmlFor="nick" className="mb-2 block text-[13px] font-semibold tracking-wide text-muted">Nickname (only you see this)</label>
            <input id="nick" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} placeholder="Lunar Fox"
              className="h-14 w-full rounded-2xl border border-line-2 bg-night px-4 text-[17px] font-medium placeholder:text-dim" />
          </div>
          {form.fields}
          {error && <p role="alert" className="text-sm text-mauve-lite">{error}</p>}
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Reading the stars…' : 'Run the numbers'}</button>
          <p className="text-center text-xs text-muted">Each new match adds a star to your Constellation · <span className="font-mono text-gold-lite">+{XP.match} XP</span></p>
        </form>
      )}

      {current && currentResult && !adding && (
        <>
          <MatchResult
            compat={currentResult}
            me={{ label: handleFromSeed(profile.seed), seed: profile.seed }}
            them={{ label: current.nickname, seed: current.seed }}
            theirHalfLocked
          >
            <div className="flex w-full flex-col gap-2">
              <button type="button" onClick={sendInvite} className="min-h-12 rounded-full bg-gold px-4 text-[15px] font-bold text-space hover:bg-gold-lite">
                Send {current.nickname} &ldquo;See your side&rdquo;
              </button>
              <p aria-live="polite" className="min-h-4 text-xs text-gold-lite">{status}</p>
              <p className="text-xs text-dim">They open your link, enter their own birth details and unlock their half. Your birth details stay private.</p>
            </div>
          </MatchResult>
          <button type="button" onClick={() => { if (confirm(`Remove ${current.nickname} from your Constellation?`)) { removeMatch(current.id); setSelected(null); } }}
            className="min-h-11 self-start text-sm text-[#E7B7BA]">Remove {current.nickname}</button>
        </>
      )}
    </div>
  );
}
