'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { WORLD_PATH } from '@/data/world-path';
import type { Angle, CartoLine, CartoPlanet } from '@/lib/astro/astrocarto';
import { ANGLE_AREA, ANGLE_NAME, BENEFIC, lineMeaning, PLANET_COLOR, PLANET_GIFT } from '@/lib/astrocarto-content';
import { useAuth } from '@/lib/auth';
import { isOwnerEmail } from '@/lib/owner';
import { useAppStore } from '@/lib/store';
import { useProgress } from '@/lib/use-progress';

interface Place { city: string; label: string; lat: number; lon: number; planet: CartoPlanet; angle: Angle; km: number }
const PLANETS: CartoPlanet[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const X = (lon: number) => lon + 180;
const Y = (lat: number) => 90 - lat;

/** Astrocartography: a Celestial unlock. */
export default function Astrocartography() {
  const { state } = useAppStore();
  const p = useProgress();
  const { user } = useAuth();
  const allowed = p.levelIndex >= 4 || isOwnerEmail(user?.email);
  const [data, setData] = useState<{ lines: CartoLine[]; places: Place[]; timeKnown: boolean } | null>(null);
  const [on, setOn] = useState<Set<CartoPlanet>>(new Set(['Sun', 'Moon', 'Venus', 'Jupiter', 'Mars', 'Saturn']));
  const [pick, setPick] = useState<{ planet: CartoPlanet; angle: Angle } | null>(null);

  useEffect(() => {
    if (!allowed) return;
    fetch('/api/astrocarto', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input: state.profile.input }) })
      .then((r) => r.json()).then((d) => d.lines && setData(d)).catch(() => {});
  }, [allowed, state.profile.input]);

  const best = useMemo(() => {
    const seen = new Set<string>();
    return (data?.places ?? []).filter((x) => BENEFIC.includes(x.planet)).sort((a, b) => a.km - b.km).filter((x) => !seen.has(x.city) && seen.add(x.city)).slice(0, 8);
  }, [data]);
  const picked = pick && data ? data.places.filter((x) => x.planet === pick.planet && x.angle === pick.angle).sort((a, b) => a.km - b.km) : [];

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p aria-hidden="true" className="text-3xl text-gold-lite">✦</p>
        <h1 className="font-display text-2xl font-bold">Your map of the world waits at Celestial.</h1>
        <Link href="/rewards" className="text-sm font-semibold text-gold-lite">See rewards</Link>
      </div>
    );
  }

  const toggle = (pl: CartoPlanet) => setOn((s) => { const n = new Set(s); if (n.has(pl)) n.delete(pl); else n.add(pl); return n; });
  const home = state.profile.input;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[11px] tracking-[0.14em] text-gold-lite">CELESTIAL UNLOCK</p>
        <h1 className="font-display text-[26px] font-bold">Astrocartography</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">Where on Earth each planet was rising, setting, overhead or underfoot the moment you were born. Living near a line, or just visiting, is said to turn up that planet&apos;s volume. Tap a line to read it.</p>
      </header>
      {data && !data.timeKnown && <p className="rounded-2xl border border-mauve bg-night p-3 text-sm text-mauve-lite">Without a birth time, lines are drawn for noon and could sit hundreds of kilometers east or west. Add your birth time on your Profile for a true map.</p>}

      <div role="group" aria-label="Planets shown" className="flex flex-wrap gap-1.5">
        {PLANETS.map((pl) => (
          <button key={pl} type="button" aria-pressed={on.has(pl)} onClick={() => toggle(pl)}
            className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm ${on.has(pl) ? 'border-line-2 bg-night' : 'border-line text-dim'}`}>
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: on.has(pl) ? PLANET_COLOR[pl] : 'transparent', border: `1px solid ${PLANET_COLOR[pl]}` }} />{pl}
          </button>
        ))}
      </div>

      <div className="no-scrollbar -mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
        <svg viewBox="0 12 360 156" className="w-full min-w-[720px] rounded-3xl bg-deep" role="img" aria-label="World map with your planet lines">
          <path d={WORLD_PATH} fill="var(--color-night-2)" stroke="var(--color-line-2)" strokeWidth="0.2" />
          {[-60, -30, 0, 30, 60].map((lat) => <line key={lat} x1="0" x2="360" y1={Y(lat)} y2={Y(lat)} stroke="var(--color-line)" strokeWidth="0.15" />)}
          {data?.lines.filter((l) => on.has(l.planet)).map((l) => l.segments.map((seg, i) => {
            const sel = pick?.planet === l.planet && pick.angle === l.angle;
            return (
              <polyline key={`${l.planet}-${l.angle}-${i}`} points={seg.map(([lon, lat]) => `${X(lon)},${Y(lat)}`).join(' ')} fill="none"
                stroke={PLANET_COLOR[l.planet]} strokeWidth={sel ? 1.1 : 0.55} strokeOpacity={pick && !sel ? 0.35 : 0.95}
                strokeDasharray={l.angle === 'MC' || l.angle === 'IC' ? (l.angle === 'IC' ? '1.5 1.2' : undefined) : l.angle === 'DSC' ? '3 1' : undefined}
                className="cursor-pointer" onClick={() => setPick({ planet: l.planet, angle: l.angle })}>
                <title>{`${l.planet} ${ANGLE_NAME[l.angle]}`}</title>
              </polyline>
            );
          }))}
          <circle cx={X(home.longitude)} cy={Y(home.latitude)} r="1.3" fill="var(--color-gold-lite)" stroke="var(--color-space)" strokeWidth="0.4"><title>Your birthplace</title></circle>
          {pick && picked.slice(0, 6).map((c) => <circle key={c.city} cx={X(c.lon)} cy={Y(c.lat)} r="0.9" fill="var(--color-starlight)" />)}
        </svg>
      </div>
      <p className="-mt-2 text-xs text-dim">Solid: rising. Long dashes: setting. Straight solid: overhead. Short dashes: underfoot. Gold dot: where you were born.</p>

      {pick ? (
        <section aria-live="polite" className="flex flex-col gap-2 rounded-3xl border border-gold bg-night p-5">
          <h2 className="font-display text-xl font-bold" style={{ color: PLANET_COLOR[pick.planet] }}>{pick.planet} {ANGLE_NAME[pick.angle].toLowerCase()}</h2>
          <p className="text-[15px] leading-relaxed">{lineMeaning(pick.planet, pick.angle)}</p>
          <p className="text-sm text-muted">{picked.length ? `Near this line: ${picked.slice(0, 6).map((c) => `${c.label} (${c.km} km)`).join(' · ')}` : 'No big cities sit close to this line; it runs through open land or sea.'}</p>
          <button type="button" onClick={() => setPick(null)} className="self-start text-sm text-gold-lite">Close</button>
        </section>
      ) : null}

      <section aria-labelledby="power" className="flex flex-col gap-3 rounded-3xl bg-night p-5">
        <h2 id="power" className="font-display text-xl font-bold">Your power places</h2>
        <p className="text-sm text-muted">Big cities closest to your Venus, Jupiter and Sun lines: the ones people go looking for when they travel for love, luck or a fresh start.</p>
        {data === null ? <div className="h-24 animate-pulse rounded-2xl bg-deep" /> : best.length === 0 ? <p className="text-sm text-dim">None of your kindest lines pass near a big city. Their open country might be the adventure.</p> : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {best.map((c) => (
              <li key={c.city}>
                <button type="button" onClick={() => setPick({ planet: c.planet, angle: c.angle })} className="flex w-full flex-col gap-0.5 rounded-2xl bg-deep p-3 text-left hover:ring-1 hover:ring-gold">
                  <span className="font-semibold">{c.label}</span>
                  <span className="text-xs" style={{ color: PLANET_COLOR[c.planet] }}>{c.planet} {ANGLE_NAME[c.angle].toLowerCase()} · {c.km} km</span>
                  <span className="text-xs text-dim">{PLANET_GIFT[c.planet]}, in {ANGLE_AREA[c.angle].split(' and ')[0]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-dim">Astrocartography is a modern Western technique (Jim Lewis, 1970s). Lines are calculated from your exact birth moment; meanings are in Orbori&apos;s words.</p>
    </div>
  );
}
