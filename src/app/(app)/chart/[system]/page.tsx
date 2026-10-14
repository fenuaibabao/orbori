'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { deg, Meter, Section, What } from '@/components/depth-ui';
import { BackIcon } from '@/components/icons';
import { PartnerLink } from '@/components/PartnerLink';
import { PlusGate } from '@/components/PlusGate';
import { Tag } from '@/components/ui';
import type { ChartDepth } from '@/lib/astro/depth';
import { nameNumbers } from '@/lib/astro/numerology-depth';
import type { Chart } from '@/lib/astro/types';
import { ANIMAL_LINE, LIFE_PATH_LINE, NAKSHATRA_LINE, NUMBER_LINE, TZOLKIN_LINE } from '@/lib/content';
import {
  ASPECT_LINE, CROSS_ROLE, DASHA_LINE, DAY_MASTER_LINE, ELEMENT_WEST, HOUSE_THEME, MISSING_ELEMENT, MODE_WEST,
  NAME_NUMBER_ROLE, PERSONAL_YEAR_LINE, PILLAR_ROLE, PLANET_THEME,
} from '@/lib/depth-content';
import { useChart, useDepth } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';

const TITLES: Record<string, string> = {
  western: 'Western, in depth', vedic: 'Vedic, in depth', chinese: 'Four Pillars (BaZi)', numerology: 'Numerology, in depth', mayan: "Chol Q'ij, in depth",
};
const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export default function Deeper() {
  const { system } = useParams<{ system: string }>();
  const { state } = useAppStore();
  const { depth, error } = useDepth(state.profile);
  const { data } = useChart(state.profile);

  return (
    <div className="flex flex-col gap-5 lg:max-w-3xl">
      <header className="flex items-center gap-3">
        <Link href="/chart" aria-label="Back to My Chart" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-2"><BackIcon /></Link>
        <h1 className="font-display text-2xl font-bold">{TITLES[system] ?? 'Go deeper'}</h1>
      </header>
      {error && <p role="alert" className="text-mauve-lite">{error}</p>}
      {!depth || !data ? <div className="h-96 animate-pulse rounded-3xl bg-night" aria-label="Loading" /> : (
        <>
          {system === 'western' && <Western d={depth} chart={data.chart} />}
          {system === 'vedic' && <Vedic d={depth} chart={data.chart} />}
          {system === 'chinese' && <Chinese d={depth} chart={data.chart} />}
          {system === 'numerology' && <Numerology d={depth} chart={data.chart} />}
          {system === 'mayan' && <Mayan d={depth} chart={data.chart} />}
        </>
      )}
      <Link href="/learn" className="self-start text-sm text-gold-lite">Browse every term in Learn →</Link>
    </div>
  );
}

function Western({ d }: { d: ChartDepth; chart: Chart }) {
  const w = d.western;
  const el = Object.entries(w.balance.elements).sort((a, b) => b[1] - a[1]);
  const mo = Object.entries(w.balance.modes).sort((a, b) => b[1] - a[1]);
  return (
    <PlusGate>
      <Section title="Your balance" learn="elements-west">
        <p className="text-sm leading-relaxed text-muted">
          Heavy on <strong className="text-starlight">{el[0][0]}</strong> ({ELEMENT_WEST[el[0][0]]}) and <strong className="text-starlight">{mo[0][0]}</strong> ({MODE_WEST[mo[0][0]]}).
          {el[3][1] === 0 && <> No {el[3][0]}, so {ELEMENT_WEST[el[3][0]]} is something you build on purpose.</>}
        </p>
        <Meter rows={el as [string, number][]} max={8} />
        <Meter rows={mo as [string, number][]} max={8} />
      </Section>

      <Section title="Planets in houses" learn="houses">
        {!w.houseSystem && <p className="text-sm text-muted">Houses need your exact birth time. Add it in Profile to unlock this.</p>}
        {w.houseSystem && <p className="text-xs text-dim">{w.houseSystem} houses</p>}
        <ul className="flex flex-col divide-y divide-line">
          {w.planets.map((p) => (
            <li key={p.name} className="flex flex-col gap-0.5 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{p.name}</span>
                <span className="font-mono text-sm">{p.sign} {deg(p.degree)}{p.retrograde && p.name !== 'North Node' ? ' ℞' : ''}{p.house ? ` · ${ord(p.house)}` : ''}</span>
              </div>
              <p className="text-sm text-muted">
                {PLANET_THEME[p.name]}{p.house ? `, played out in ${HOUSE_THEME[p.house]}.` : '.'}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-x-4"><What id="retrograde" label="Retrograde?" /><What id="north-node" label="North Node?" /><What id="lilith" label="Lilith?" /></div>
      </Section>

      {w.cusps && (
        <Section title="The 12 houses" learn="houses">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {w.cusps.map((c, i) => (
              <li key={i} className="rounded-xl bg-deep p-3 text-sm">
                <span className="font-mono text-gold-lite">{ord(i + 1)}</span> <span className="font-semibold">{c.sign}</span>
                <span className="block text-xs text-muted">{HOUSE_THEME[i + 1]}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Key aspects" learn="aspects">
        <ul className="flex flex-col gap-2">
          {w.aspects.map((a) => (
            <li key={`${a.a}-${a.b}-${a.type}`} className="rounded-xl bg-deep p-3 text-sm">
              <span className="font-semibold">{a.a} {a.type} {a.b}</span>
              <span className={`ml-2 font-mono text-xs ${a.nature === 'hard' ? 'text-mauve-lite' : 'text-gold-lite'}`}>{a.orb}° orb</span>
              <span className="block text-muted">{ASPECT_LINE[a.type]}.</span>
            </li>
          ))}
        </ul>
      </Section>
    </PlusGate>
  );
}

function Vedic({ d, chart }: { d: ChartDepth; chart: Chart }) {
  const v = d.vedic;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <PlusGate>
      {v.current.maha && (
        <section className="flex flex-col gap-2 rounded-[22px] border border-gold bg-night p-[18px]">
          <div className="flex items-baseline justify-between"><p className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">YOUR CURRENT CHAPTER</p><What id="dasha" /></div>
          <h2 className="font-display text-2xl font-bold">{v.current.maha.lord} Mahadasha</h2>
          <p className="text-sm text-muted">{fmtDate(v.current.maha.start)} – {fmtDate(v.current.maha.end)}: {DASHA_LINE[v.current.maha.lord]}.</p>
          {v.current.antar && (
            <p className="rounded-xl bg-deep p-3 text-sm">
              <span className="font-semibold">Sub-chapter: {v.current.antar.lord}</span> until {fmtDate(v.current.antar.end)}, layering in {DASHA_LINE[v.current.antar.lord].replace(/^a /, '').replace(/^an /, '').replace(/ chapter of /, ' notes of ')}.
            </p>
          )}
        </section>
      )}

      <Section title="Your Dasha timeline" learn="dasha">
        <ol className="flex flex-col gap-1.5">
          {v.dashas.map((m) => {
            const now = m.start <= today && today < m.end;
            return (
              <li key={m.start} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${now ? 'border border-gold bg-deep' : 'bg-deep/60'}`}>
                <span className="font-semibold">{m.lord}{now && <span className="ml-2 font-mono text-[10px] text-gold-lite">NOW</span>}</span>
                <span className="font-mono text-xs text-muted">{fmtDate(m.start)} – {fmtDate(m.end)}</span>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section title="Your nakshatras" learn="nakshatra">
        <ul className="flex flex-col gap-2 text-sm">
          <li className="rounded-xl bg-deep p-3"><span className="font-semibold">Moon in {chart.vedic.moonNakshatra.name}</span> (pada {chart.vedic.moonNakshatra.pada}): {NAKSHATRA_LINE[chart.vedic.moonNakshatra.name]}</li>
          <li className="rounded-xl bg-deep p-3"><span className="font-semibold">Sun in {v.sunNakshatra.name}</span> (pada {v.sunNakshatra.pada}): {NAKSHATRA_LINE[v.sunNakshatra.name]}</li>
          {v.lagnaNakshatra
            ? <li className="rounded-xl bg-deep p-3"><span className="font-semibold">Lagna in {v.lagnaNakshatra.name}</span> (pada {v.lagnaNakshatra.pada}): {NAKSHATRA_LINE[v.lagnaNakshatra.name]}</li>
            : <li className="text-muted">Your Lagna nakshatra needs an exact birth time.</li>}
        </ul>
      </Section>

      <Section title="Navamsa (D9)" learn="navamsa">
        <p className="text-sm text-muted">Read for partnership and your deeper potential.</p>
        <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {Object.entries(v.navamsa).map(([k, s]) => s && (
            <li key={k} className="rounded-xl bg-deep p-3"><span className="block text-xs capitalize text-muted">{k === 'lagna' ? 'D9 Lagna' : k}</span><span className="font-mono font-bold">{s}</span></li>
          ))}
        </ul>
      </Section>
    </PlusGate>
  );
}

function Chinese({ d, chart }: { d: ChartDepth; chart: Chart }) {
  const b = d.bazi;
  const cols: [keyof typeof PILLAR_ROLE, typeof b.year | null][] = [['hour', b.hour], ['day', b.day], ['month', b.month], ['year', b.year]];
  const dm = `${b.dayMaster.polarity} ${b.dayMaster.element}`;
  const yearDiffers = b.year.animal !== chart.chinese.animal;
  return (
    <PlusGate>
      <Section title="Your eight characters" learn="four-pillars">
        <div className="grid grid-cols-4 gap-2 text-center">
          {cols.map(([k, p]) => (
            <div key={k} className={`flex flex-col items-center gap-1 rounded-xl p-2.5 ${k === 'day' ? 'border border-gold bg-deep' : 'bg-deep'}`}>
              <span className="text-[11px] capitalize text-muted">{k}</span>
              <span lang="zh" className="font-display text-[28px] leading-none">{p ? p.hanzi[0] : '?'}</span>
              <span lang="zh" className="font-display text-[28px] leading-none">{p ? p.hanzi[1] : '?'}</span>
              <span className="text-[11px] leading-tight">{p ? `${p.element} ${p.animal}` : 'Add time'}</span>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-1 text-sm text-muted">
          {cols.map(([k, p]) => <li key={k}><strong className="text-starlight">{p ? p.label : 'Hour unknown'}</strong> · {PILLAR_ROLE[k]}</li>)}
        </ul>
        {yearDiffers && (
          <p className="rounded-xl border border-mauve bg-deep p-3 text-sm">
            Your BaZi year is <strong>{b.year.animal}</strong> while your zodiac animal is <strong>{chart.chinese.animal}</strong>: you were born between Lunar New Year and Lichun. <What id="lichun" label="Why?" />
          </p>
        )}
      </Section>

      <Section title={`Day Master: ${dm}`} learn="day-master">
        <p className="text-[15px] leading-relaxed">You are {DAY_MASTER_LINE[dm]}</p>
      </Section>

      {b.hour && (
        <Section title={`Secret animal: ${b.hour.animal}`} learn="secret-animal">
          <p className="text-sm leading-relaxed text-muted">
            Outwardly a {chart.chinese.animal}, inwardly a {b.hour.animal}. {ANIMAL_LINE[b.hour.animal]}
          </p>
        </Section>
      )}

      <Section title="Element balance" learn="elements-chinese">
        <Meter rows={Object.entries(b.elements).sort((x, y) => y[1] - x[1]) as [string, number][]} max={b.hour ? 8 : 6} />
        <p className="text-sm text-muted">Strongest: <strong className="text-starlight">{b.strongest}</strong>.</p>
        {b.missing.map((m) => <p key={m} className="text-sm text-muted">{MISSING_ELEMENT[m]}</p>)}
        <p className="text-xs text-dim">Counts the {b.hour ? 8 : 6} visible characters. Hidden stems and seasonal strength are not included.</p>
      </Section>

      <PartnerLink
        href="https://purpleheaven.app"
        eyebrow="GO EVEN DEEPER"
        title="Purple Heaven"
        body="Full BaZi and Zi Wei charts, the Tongshu almanac and readings with real practitioners. Anonymous, like Orbori."
      />
    </PlusGate>
  );
}

function Numerology({ d, chart }: { d: ChartDepth; chart: Chart }) {
  const n = d.numerology;
  const [name, setName] = useState('');
  const nn = name.trim() ? nameNumbers(name) : null;
  return (
    <PlusGate>
      <Section title={`Life Path ${chart.numerology.lifePath}`} learn="life-path">
        <p className="text-sm leading-relaxed text-muted">{LIFE_PATH_LINE[chart.numerology.lifePath]}</p>
      </Section>
      <Section title={`Personal Year ${n.personalYear}`} learn="personal-year">
        <p className="text-sm leading-relaxed text-muted">{PERSONAL_YEAR_LINE[n.personalYear]}</p>
        <p className="text-sm text-muted">This month is a Personal Month {n.personalMonth}: {PERSONAL_YEAR_LINE[n.personalMonth].split('.')[0].toLowerCase()}. A new Personal Year starts January 1.</p>
      </Section>
      <Section title={`Birthday number ${n.birthday.day}`} learn="birthday-number">
        <p className="text-sm leading-relaxed text-muted">A gift of the {n.birthday.reduced}: {LIFE_PATH_LINE[n.birthday.reduced].split('. ').slice(1).join('. ') || LIFE_PATH_LINE[n.birthday.reduced]}</p>
      </Section>
      <Section title="Name numbers" learn="name-numbers">
        <label htmlFor="fullname" className="text-sm text-muted">Full birth name (stays on this device, never saved)</label>
        <input id="fullname" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="First Middle Last"
          className="h-12 rounded-2xl border border-line-2 bg-deep px-4 text-[15px] placeholder:text-dim" />
        {nn && (
          <ul className="flex flex-col gap-2 text-sm">
            {(['expression', 'soulUrge', 'personality'] as const).map((k) => (
              <li key={k} className="rounded-xl bg-deep p-3">
                <span className="font-semibold">{NAME_NUMBER_ROLE[k]}</span>
                <span className="ml-2 font-mono text-gold-lite">{nn[k]}</span>
                <span className="block text-muted">{LIFE_PATH_LINE[nn[k]]}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PlusGate>
  );
}

function Mayan({ d, chart }: { d: ChartDepth; chart: Chart }) {
  const m = d.mayan;
  const cell = (label: string, x: { label: string; english: string; yucatec: string }) => (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-deep p-2.5 text-center">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-sm font-bold">{x.label}</span>
      <span className="text-[11px] text-dim">{x.english} · {x.yucatec}</span>
    </div>
  );
  return (
    <PlusGate>
      <Section title={`Your nawal: ${chart.tzolkin.label}`} learn="tzolkin">
        <p className="text-sm leading-relaxed text-muted">{TZOLKIN_LINE[chart.tzolkin.daySign]} Your number {chart.tzolkin.number} brings {NUMBER_LINE[chart.tzolkin.number]}.</p>
        <p className="text-xs text-dim">{chart.tzolkin.english} · Yucatec: {chart.tzolkin.yucatec}</p>
      </Section>
      <Section title="Your Mayan cross" learn="mayan-cross">
        <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2">
          <span />{cell('Destiny', m.cross.destiny)}<span />
          {cell('Left', m.cross.left)}
          <div className="flex flex-col items-center gap-0.5 rounded-xl border border-gold bg-deep p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wide text-gold-lite">You</span>
            <span className="font-mono text-sm font-bold">{chart.tzolkin.label}</span>
            <span className="text-[11px] text-dim">{chart.tzolkin.english} · {chart.tzolkin.yucatec}</span>
          </div>
          {cell('Right', m.cross.right)}
          <span />{cell('Conception', m.cross.conception)}<span />
        </div>
        <ul className="flex flex-col gap-1 text-sm text-muted">
          {(Object.keys(CROSS_ROLE) as (keyof typeof CROSS_ROLE)[]).map((k) => <li key={k}>{CROSS_ROLE[k]}: <strong className="text-starlight">{m.cross[k].label}</strong></li>)}
        </ul>
      </Section>
      <Section title={`Born in the ${m.trecena.daySign} trecena`} learn="trecena">
        <p className="text-sm leading-relaxed text-muted">
          Day {m.trecena.dayOfTrecena} of 13 in the {m.trecena.daySign} ({m.trecena.english}) trecena. {TZOLKIN_LINE[m.trecena.daySign]}
        </p>
      </Section>
      <PartnerLink
        href="https://thefourpillars.net"
        eyebrow="FROM A K'ICHE' DAY-KEEPER"
        title="The energy of each day, by Mark Elmy"
        body="An initiated Aj Q'ij who writes about every day of the Chol Q'ij (the K'iche' sacred calendar), plus workshops and readings."
      />
      <p className="text-xs text-dim"><Tag>Note</Tag> Day-keeping traditions vary between Maya communities.</p>
    </PlusGate>
  );
}
