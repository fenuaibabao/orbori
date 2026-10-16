'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deg, Meter, Section, What } from '@/components/depth-ui';
import { BackIcon } from '@/components/icons';
import { PartnerLink } from '@/components/PartnerLink';
import { ANAHULU_LINE, MONTH_LINE, NIGHT_MEANING } from '@/lib/astro/hawaiian-content';
import { NIGHTS } from '@/lib/astro/hawaiian';
import { abjad, MANSIONS, mansionSign } from '@/lib/astro/islamic';
import { PlusGate } from '@/components/PlusGate';
import { Tag } from '@/components/ui';
import type { ChartDepth } from '@/lib/astro/depth';
import { maturityNumber, nameLessons, nameNumbers } from '@/lib/astro/numerology-depth';
import type { Chart } from '@/lib/astro/types';
import { ANIMAL_LINE, DIRECTION_LINE, LIFE_PATH_LINE, MAM_LINE, NAKSHATRA_LINE, NAWAL_PROFILE, NUMBER_LINE, TZOLKIN_LINE } from '@/lib/content';
import {
  ASPECT_LINE, CHALLENGE_LINE, CROSS_ROLE, DASHA_LINE, DIGNITY_LINE, FORTUNE_LINE, GRAHA_THEME, INTERACTION_LINE, LUCK_LINE, STAR_LINE, TEN_GOD_GROUP, TEN_GOD_LINE, SADE_SATI_LINE, TITHI_LINE, KARMIC_DEBT_LINE, LESSON_LINE, MOON_PHASE_LINE, NATAL_POINT_THEME, PINNACLE_LINE, TRANSIT_PLANET, DAY_MASTER_LINE, ELEMENT_WEST, HOUSE_THEME, MISSING_ELEMENT, MODE_WEST,
  NAME_NUMBER_ROLE, PERSONAL_YEAR_LINE, PILLAR_ROLE, PLANET_THEME,
} from '@/lib/depth-content';
import { useChart, useDepth } from '@/lib/hooks';
import { localToday, useAppStore } from '@/lib/store';

const TITLES: Record<string, string> = {
  western: 'Western, in depth', vedic: 'Vedic, in depth', chinese: 'Four Pillars (BaZi)', numerology: 'Numerology, in depth', mayan: "Chol Q'ij, in depth",
  hawaiian: 'Kaulana Mahina, in depth', islamic: 'Lunar mansions and Abjad',
};
const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export default function Deeper() {
  const { system } = useParams<{ system: string }>();
  const { state, record } = useAppStore();
  const { depth, error } = useDepth(state.profile);
  useEffect(() => { if (depth) record(localToday().date, { deep: true }); }, [depth, record]);
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
          {system === 'hawaiian' && <Hawaiian d={depth} chart={data.chart} />}
          {system === 'islamic' && <Islamic d={depth} chart={data.chart} />}
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
      <Section title={`Born under a ${w.moonPhase.name}`} learn="moon-phase">
        <p className="text-sm leading-relaxed text-muted">{MOON_PHASE_LINE[w.moonPhase.name]} The Moon was {w.moonPhase.illumination}% lit, {w.moonPhase.elongation}° past the Sun.</p>
      </Section>

      {w.ruler && (
        <Section title={`Chart ruler: ${w.ruler.traditional.name}`} learn="chart-ruler">
          <p className="text-sm leading-relaxed text-muted">
            Your Ascendant is ruled by <strong className="text-starlight">{w.ruler.traditional.name}</strong>, in {w.ruler.traditional.sign}{w.ruler.traditional.house ? ` in your ${ord(w.ruler.traditional.house)} house` : ''}: the planet that steers your whole chart, so {PLANET_THEME[w.ruler.traditional.name]} colors everything{w.ruler.traditional.house ? `, played out through ${HOUSE_THEME[w.ruler.traditional.house]}` : ''}.
            {w.ruler.modern && <> Modern astrologers add <strong className="text-starlight">{w.ruler.modern.name}</strong> in {w.ruler.modern.sign}{w.ruler.modern.house ? ` (${ord(w.ruler.modern.house)} house)` : ''} as co-ruler.</>}
          </p>
        </Section>
      )}

      {w.fortune && (
        <Section title={`Part of Fortune in ${w.fortune.sign}`} learn="part-of-fortune">
          <p className="text-sm leading-relaxed text-muted">{FORTUNE_LINE} Yours sits at {w.fortune.sign} {deg(w.fortune.degree)}{w.fortune.house ? `, in your ${ord(w.fortune.house)} house: ${HOUSE_THEME[w.fortune.house]}` : ''}. ({w.fortune.dayChart ? 'Day' : 'Night'} chart formula.)</p>
        </Section>
      )}

      <Section title="Your progressed chart" learn="progressions">
        <p className="text-sm leading-relaxed text-muted">
          Secondary progressions move your chart one day for each year of life. At {Math.floor(w.progressed.ageYears)}, your progressed Sun is in <strong className="text-starlight">{w.progressed.planets[0].sign}</strong> and your progressed Moon in <strong className="text-starlight">{w.progressed.planets[1].sign}</strong>, the emotional weather of this two-and-a-half-year stretch.
          {w.progressed.moonNext && <> It moves into {w.progressed.moonNext.sign} around {fmtDate(w.progressed.moonNext.when)}.</>}
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {w.progressed.planets.map((p) => (
            <li key={p.name} className="rounded-xl bg-deep p-2.5 text-center"><span className="block text-[10px] uppercase tracking-wide text-muted">{p.name}</span><span className="font-mono text-sm">{p.sign} {deg(p.degree)}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="Transits this week" learn="transits">
        {w.transits.length === 0 && <p className="text-sm text-muted">No tight transits to your chart right now. A quiet sky.</p>}
        <ul className="flex flex-col divide-y divide-line">
          {w.transits.map((t) => (
            <li key={`${t.transiting}-${t.natal}-${t.type}`} className="flex flex-col gap-0.5 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{t.transiting} {t.type} your {t.natal}</span>
                <span className="font-mono text-xs text-dim">{t.orb}° {t.applying ? 'applying' : 'separating'}</span>
              </div>
              <p className="text-sm text-muted">{t.transiting} {TRANSIT_PLANET[t.transiting][t.nature]}: {NATAL_POINT_THEME[t.natal]}.</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-dim">Your next solar return (the Sun back on its birth degree) is {new Date(w.solarReturn).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
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
              {v.current.pratyantar && <> Within it, a <span className="font-semibold">{v.current.pratyantar.lord}</span> sub-period until {fmtDate(v.current.pratyantar.end)} sets the mood of these weeks.</>}
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
      <Section title="Panchanga at your birth" learn="panchanga">
        <p className="text-sm leading-relaxed text-muted">{TITHI_LINE[v.panchanga.tithi.paksha]}</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[['Tithi', v.panchanga.tithi.label], ['Vara', `${v.panchanga.vara.day} · ${v.panchanga.vara.lord}`], ['Yoga', v.panchanga.yoga], ['Karana', v.panchanga.karana]].map(([k, val]) => (
            <li key={k} className="rounded-xl bg-deep p-2.5 text-center"><span className="block text-[10px] uppercase tracking-wide text-muted">{k}</span><span className="text-sm font-semibold">{val}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="Planetary strength" learn="dignity">
        <ul className="flex flex-col divide-y divide-line">
          {v.dignities.map((g) => (
            <li key={g.name} className="flex flex-col gap-0.5 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{g.name}</span>
                <span className="font-mono text-sm">{g.sign} {deg(g.degree)}{g.retrograde ? ' ℞' : ''}{g.combust ? ' ☉' : ''}</span>
              </div>
              <p className="text-sm text-muted"><strong className="text-starlight">{g.dignity}</strong>: {DIGNITY_LINE[g.dignity]}. Governs {GRAHA_THEME[g.name]}.{g.combust ? ' Combust (too close to the Sun): its signal is dimmed.' : ''}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Yogas in your chart" learn="yogas">
        {v.yogas.length === 0 && <p className="text-sm text-muted">None of the classic planetary combinations Orbori checks appear in your chart. Your strengths come from placements rather than patterns.</p>}
        <ul className="flex flex-col gap-2">
          {v.yogas.map((y) => <li key={y.name} className="rounded-xl bg-deep p-3 text-sm"><span className="font-semibold">{y.name}</span><span className="block text-muted">{y.summary}</span></li>)}
        </ul>
      </Section>

      <Section title="Saturn and Jupiter now" learn="sade-sati">
        <p className="text-sm leading-relaxed text-muted">
          Saturn is transiting sidereal <strong className="text-starlight">{v.saturn.saturnSign}</strong>, the {ord(v.saturn.houseFromMoon)} sign from your Moon, until about {fmtDate(v.saturn.nextSignChange ?? '')}.
          {v.saturn.sadeSati ? <> {SADE_SATI_LINE[v.saturn.sadeSati]}</> : v.saturn.dhaiya ? <> That is a Dhaiya (small panoti): two and a half years of extra grind in the {ord(v.saturn.houseFromMoon)} house.</> : <> No Sade Sati right now.</>}
          {' '}Jupiter is in <strong className="text-starlight">{v.saturn.jupiterSign}</strong>, the {ord(v.saturn.jupiterHouseFromMoon)} from your Moon{[2, 5, 7, 9, 11].includes(v.saturn.jupiterHouseFromMoon) ? ', a favorable position' : ''}.
        </p>
      </Section>
    </PlusGate>
  );
}

function Chinese({ d, chart }: { d: ChartDepth; chart: Chart }) {
  const b = d.bazi;
  const cols: [keyof typeof PILLAR_ROLE, typeof b.year | null][] = [['hour', b.hour], ['day', b.day], ['month', b.month], ['year', b.year]];
  const dm = `${b.dayMaster.polarity} ${b.dayMaster.element}`;
  const yearDiffers = b.year.animal !== chart.chinese.animal;
  const [sex, setSex] = useState<'male' | 'female'>(() => { try { return (localStorage.getItem('orbori.bazi.sex') as 'male' | 'female') || 'male'; } catch { return 'male'; } });
  const pickSex = (v: 'male' | 'female') => { setSex(v); try { localStorage.setItem('orbori.bazi.sex', v); } catch { /* ignore */ } };
  const forward = sex === 'male' ? b.luck.maleForward : b.luck.femaleForward;
  const luck = forward ? b.luck.forward : b.luck.backward;
  const age = d.numerology.age;
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


      <Section title="The Ten Gods" learn="ten-gods">
        <p className="text-sm leading-relaxed text-muted">Every character is read by its relationship to your Day Master ({dm}). The visible stems speak loudest; the hidden stems inside each branch add undertones.</p>
        <ul className="flex flex-col gap-2">
          {b.tenGods.map((t) => (
            <li key={t.pillar} className="rounded-xl bg-deep p-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold capitalize">{t.pillar} pillar</span>
                <span className="font-mono text-xs text-dim">{t.stem.hanzi} {t.stem.name}{t.stem.tenGod ? ` · ${t.stem.tenGod.hanzi}` : ' · Day Master'}</span>
              </div>
              {t.stem.tenGod && <p className="text-muted"><strong className="text-starlight">{t.stem.tenGod.name}</strong>: {TEN_GOD_LINE[t.stem.tenGod.name]}.</p>}
              <p className="mt-1 text-xs text-dim">Hidden: {t.hidden.map((h) => `${h.hanzi} ${h.name} (${h.tenGod.name})`).join(', ')}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-dim">{Object.entries(TEN_GOD_GROUP).map(([k, v]) => `${k}: ${v}`).join('. ')}.</p>
      </Section>

      <Section title="Branch interactions" learn="interactions">
        {b.interactions.length === 0 && <p className="text-sm text-muted">No clashes, combinations or harms between your branches. A settled chart.</p>}
        <ul className="flex flex-col gap-2">
          {b.interactions.map((x, i) => (
            <li key={i} className="rounded-xl bg-deep p-3 text-sm">
              <span className="font-semibold capitalize">{x.kind}{x.element ? ` → ${x.element}` : ''}</span>
              <span className="block text-xs text-dim">{x.between.join(' · ')} ({x.pillars.join(' & ')})</span>
              <span className="block text-muted">{INTERACTION_LINE[x.kind]}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Symbolic stars" learn="stars">
        <ul className="flex flex-col gap-2">
          {b.stars.map((st) => (
            <li key={st.name} className={`rounded-xl p-3 text-sm ${st.present ? 'border border-gold bg-night' : 'bg-deep/60'}`}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{st.name} <span lang="zh" className="font-normal text-dim">{st.hanzi}</span></span>
                <span className="font-mono text-xs text-dim">{st.present ? `in your ${st.where.join(' & ')} pillar` : `needs ${st.branch}`}</span>
              </div>
              {st.present ? <p className="text-muted">{STAR_LINE[st.name]}</p> : <p className="text-dim">Not in your natal chart; it visits in years and luck pillars carrying {st.branch}.</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Luck pillars" learn="luck-pillars">
        <p className="text-sm leading-relaxed text-muted">{LUCK_LINE}</p>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Direction follows sex at birth in BaZi:</span>
          {(['male', 'female'] as const).map((v) => (
            <button key={v} type="button" onClick={() => pickSex(v)} className={`min-h-8 rounded-full border px-3 capitalize ${sex === v ? 'border-gold-lite text-gold-lite' : 'border-line-2 text-dim'}`}>{v}</button>
          ))}
        </div>
        <p className="text-xs text-dim">Your first pillar began at age {luck.startAge}, counting {forward ? 'forward' : 'backward'} from your month pillar.</p>
        <ol className="flex flex-col gap-1.5">
          {luck.pillars.map((p) => {
            const now = age >= p.from && age <= p.to;
            return (
              <li key={p.from} className={`flex flex-col gap-0.5 rounded-xl px-3 py-2.5 text-sm ${now ? 'border border-gold bg-deep' : 'bg-deep/60'}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">Ages {p.from}–{p.to}{now && <span className="ml-2 font-mono text-[10px] text-gold-lite">NOW</span>}</span>
                  <span className="font-mono text-xs text-muted"><span lang="zh">{p.hanzi}</span> {p.label}</span>
                </div>
                <span className="text-muted"><strong className="text-starlight">{p.tenGod.name}</strong> decade: {TEN_GOD_LINE[p.tenGod.name]}.</span>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-muted">This year ({b.annual.year}) is <span lang="zh">{b.annual.hanzi}</span> {b.annual.label}, a <strong className="text-starlight">{b.annual.tenGod.name}</strong> year for you: {TEN_GOD_LINE[b.annual.tenGod.name]}.</p>
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
  const nl = name.trim() ? nameLessons(name) : null;
  const current = n.pinnacles.findIndex((p) => n.age >= p.from && (p.to === null || n.age <= p.to));
  const lp = chart.numerology.lifePath;
  return (
    <PlusGate>
      <Section title={`Life Path ${lp}`} learn="life-path">
        <p className="text-sm leading-relaxed text-muted">{LIFE_PATH_LINE[lp]}</p>
      </Section>
      <Section title={`Personal Year ${n.personalYear}`} learn="personal-year">
        <p className="text-sm leading-relaxed text-muted">{PERSONAL_YEAR_LINE[n.personalYear]}</p>
        <p className="text-sm text-muted">
          This month is a Personal Month {n.personalMonth}: {PERSONAL_YEAR_LINE[n.personalMonth].split('.')[0].toLowerCase()}.
          Today is a Personal Day {n.personalDay}: {PERSONAL_YEAR_LINE[n.personalDay].split('.')[0].toLowerCase()}. A new Personal Year starts January 1.
        </p>
      </Section>
      <Section title={`Birthday number ${n.birthday.day}`} learn="birthday-number">
        <p className="text-sm leading-relaxed text-muted">A gift of the {n.birthday.reduced}: {LIFE_PATH_LINE[n.birthday.reduced].split('. ').slice(1).join('. ') || LIFE_PATH_LINE[n.birthday.reduced]}</p>
      </Section>
      <Section title="Pinnacles and Challenges" learn="pinnacles">
        <p className="text-sm text-muted">Four chapters of life, each with its own theme (Pinnacle) and lesson (Challenge). You are {n.age}, in chapter {current + 1}.</p>
        <ol className="flex flex-col gap-2">
          {n.pinnacles.map((p, i) => (
            <li key={i} className={`rounded-xl p-3 ${i === current ? 'border border-gold bg-night' : 'bg-deep'}`}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{i === current ? 'Now · ' : ''}Ages {p.from}–{p.to ?? 'on'}</span>
                <span className="font-mono text-sm text-gold-lite">Pinnacle {p.pinnacle} · Challenge {p.challenge}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{PINNACLE_LINE[p.pinnacle]} {CHALLENGE_LINE[p.challenge]}</p>
            </li>
          ))}
        </ol>
      </Section>
      {n.karmicDebts.length > 0 && (
        <Section title="Karmic debt" learn="karmic-debt">
          {n.karmicDebts.map((k) => <p key={k.source} className="text-sm leading-relaxed text-muted"><strong className="text-starlight">{k.source} {k.number}.</strong> {KARMIC_DEBT_LINE[k.number]}</p>)}
        </Section>
      )}
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
            <li className="rounded-xl bg-deep p-3">
              <span className="font-semibold">Maturity number: who you grow into</span>
              <span className="ml-2 font-mono text-gold-lite">{maturityNumber(lp, nn.expression)}</span>
              <span className="block text-muted">Life Path + Expression. Its themes come forward from your mid-thirties on: {LIFE_PATH_LINE[maturityNumber(lp, nn.expression)].split('. ')[0]}.</span>
            </li>
            {nl && (
              <li className="rounded-xl bg-deep p-3">
                <span className="font-semibold">Hidden Passion and Karmic Lessons</span>
                <span className="block text-muted">
                  Most frequent in your name: <strong className="text-starlight">{nl.hiddenPassion.join(', ')}</strong>, a talent you reach for by instinct.
                  {nl.lessons.length ? <> Missing: <strong className="text-starlight">{nl.lessons.join(', ')}</strong>, so life keeps teaching {nl.lessons.map((x) => LESSON_LINE[x]).join('; ')}.</> : ' Every number is present: no karmic lessons from your name.'}
                  {nl.expressionDebt && <> Your Expression carries karmic debt {nl.expressionDebt}: {KARMIC_DEBT_LINE[nl.expressionDebt]}</>}
                </span>
              </li>
            )}
          </ul>
        )}
      </Section>
    </PlusGate>
  );
}

function Mayan({ d, chart }: { d: ChartDepth; chart: Chart }) {
  const m = d.mayan;
  const me = chart.tzolkin;
  const prof = NAWAL_PROFILE[me.daySign] ?? { gift: '', shadow: '', calling: '' };
  const longDate = (x: string) => new Date(`${x}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const shortDate = (x: string) => new Date(`${x}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const cell = (label: string, x: { label: string; english: string; yucatec: string }) => (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-deep p-2.5 text-center">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-sm font-bold">{x.label}</span>
      <span className="text-[11px] text-dim">{x.english} · {x.yucatec}</span>
    </div>
  );
  const strip = (days: { date: string; day: { label: string; daySign: string } }[], hi: string) => (
    <ol className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
      {days.map((x) => (
        <li key={x.date} className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-xl border px-1.5 py-2 text-center ${x.date === hi ? 'border-gold bg-night' : 'border-line bg-deep'}`}>
          <span className="font-mono text-[12px] font-bold leading-tight">{x.day.label}</span>
          <span className="mt-0.5 text-[10px] text-dim">{shortDate(x.date)}</span>
        </li>
      ))}
    </ol>
  );
  return (
    <PlusGate>
      <Section title={`Your nawal: ${me.label}`} learn="tzolkin">
        <p className="text-sm leading-relaxed text-muted">{TZOLKIN_LINE[me.daySign]} Your number {me.number} brings {NUMBER_LINE[me.number]}.</p>
        <p className="text-xs text-dim">{me.english} · Yucatec: {me.yucatec} · {m.direction.direction}, {m.direction.color.toLowerCase()}</p>
      </Section>
      <Section title={`${me.daySign}, in depth`} learn="tzolkin">
        <dl className="flex flex-col gap-3 text-sm leading-relaxed">
          <div><dt className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">GIFT</dt><dd className="text-muted">{prof.gift}</dd></div>
          <div><dt className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">SHADOW</dt><dd className="text-muted">{prof.shadow}</dd></div>
          <div><dt className="font-mono text-[11px] tracking-[0.08em] text-gold-lite">CALLING</dt><dd className="text-muted">{prof.calling}</dd></div>
        </dl>
      </Section>
      <Section title={`${m.direction.direction}: your direction`} learn="directions">
        <p className="text-sm leading-relaxed text-muted">{DIRECTION_LINE[m.direction.direction]} In K&apos;iche&apos;, {m.direction.kiche}.</p>
      </Section>
      <Section title="Your Mayan cross" learn="mayan-cross">
        <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2">
          <span />{cell('Destiny', m.cross.destiny)}<span />
          {cell('Left', m.cross.left)}
          <div className="flex flex-col items-center gap-0.5 rounded-xl border border-gold bg-deep p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wide text-gold-lite">You</span>
            <span className="font-mono text-sm font-bold">{me.label}</span>
            <span className="text-[11px] text-dim">{me.english} · {me.yucatec}</span>
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
        {strip(m.trecena.days, chart.input.date)}
      </Section>
      <Section title={`Your Mam: ${m.birthMam.mam.label}`} learn="mam">
        <p className="text-sm leading-relaxed text-muted">
          You were born in the solar year carried by <strong className="text-starlight">{m.birthMam.mam.label}</strong>, seated {longDate(m.birthMam.seated)}. {MAM_LINE[m.birthMam.mam.daySign]} Its number, {m.birthMam.mam.number}, brings {NUMBER_LINE[m.birthMam.mam.number]}.
        </p>
      </Section>
      <Section title="The count today" learn="wajxaqib-batz">
        <p className="text-sm leading-relaxed text-muted">
          Today is <strong className="text-starlight">{m.today.day.label}</strong>, day {m.today.trecena.dayOfTrecena} of the {m.today.trecena.daySign} trecena, in the year of <strong className="text-starlight">{m.today.mam.mam.label}</strong> (seated {longDate(m.today.mam.seated)}).
          {m.today.tzapinQij && <> These are the Tz&apos;apin Q&apos;ij, the five closing days of the year: a time for rest and reflection, not big beginnings.</>}
          {' '}The next Wajxaqib&apos; B&apos;atz&apos;, when the Chol Q&apos;ij begins again, is {longDate(m.today.nextWajxaqibBatz)}; the next Mam, {m.today.mam.nextMam.label}, is seated {longDate(m.today.mam.nextSeated)}.
        </p>
        {strip(m.today.trecena.days, m.today.date)}
        <a href={`https://thefourpillars.net/${new Date(`${m.today.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase()}-${m.today.date.slice(0, 4)}/`}
          target="_blank" rel="noopener" className="self-start text-sm font-semibold text-gold-lite">Read Mark Elmy on {m.today.day.label} and this month&apos;s days ↗</a>
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

function Hawaiian({ d, chart }: { d: ChartDepth; chart: Chart }) {
  const h = chart.hawaiian;
  const t = d.hawaiian.tonight;
  const born = NIGHT_MEANING[h.night - 1];
  const tonight = NIGHT_MEANING[t.night - 1];
  return (
    <PlusGate>
      <Section title={`Born on ${h.name}`} learn="kaulana-mahina">
        <p className="text-sm leading-relaxed text-muted">{born.born}</p>
        <p className="text-xs text-dim">Night {h.night} of 30 · {h.anahulu}, {ANAHULU_LINE[h.anahulu]} · moon age {h.age} days at sunset</p>
      </Section>
      <Section title={`The ${h.month} moon`} learn="malama">
        <p className="text-sm leading-relaxed text-muted">
          You were born in <strong className="text-starlight">{h.month}</strong>, {MONTH_LINE[h.month]}, in the {h.season} season ({h.season === 'Hoʻoilo' ? 'the wet, cool half of the year' : 'the dry, warm half of the year'}){h.makahiki ? ', during Makahiki, the season of rest and games' : ''}.
        </p>
      </Section>
      <Section title={`Tonight: ${t.name}`} learn="anahulu">
        <p className="text-sm leading-relaxed text-muted">{tonight.today}</p>
        <p className="text-xs text-dim">Night {t.night} of the {t.month} moon · {t.anahulu}{t.makahiki ? ' · Makahiki' : ''}{t.night === h.night ? ' · your birth night' : ''}</p>
        <ol className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
          {NIGHTS.map((n, i) => (
            <li key={i} className={`flex min-w-[76px] shrink-0 flex-col items-center rounded-xl border px-1.5 py-2 text-center ${i + 1 === t.night ? 'border-gold bg-night' : i + 1 === h.night ? 'border-mauve bg-deep' : 'border-line bg-deep'}`}>
              <span className="font-mono text-[11px] font-bold leading-tight">{i + 1}</span>
              <span className="mt-0.5 text-[10px] leading-tight text-dim">{n}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-dim">Gold: tonight. Rose: your birth night.</p>
      </Section>
      <p className="text-xs text-dim"><Tag>Note</Tag> Orbori anchors the nights to the astronomical new moon. Hawaiian practitioners count by observation, and month names vary by island.</p>
    </PlusGate>
  );
}

function Islamic({ d, chart }: { d: ChartDepth; chart: Chart }) {
  const m = chart.islamic.mansion;
  const born = MANSIONS[m.index];
  const t = d.islamic.today;
  const todayM = MANSIONS[t.mansion.index];
  const [name, setName] = useState('');
  const ab = name.trim() ? abjad(name) : null;
  return (
    <PlusGate>
      <Section title={`Moon in ${m.name}`} learn="manazil">
        <p className="text-sm leading-relaxed text-muted">{born.born}</p>
        <p className="text-xs text-dim"><span lang="ar" dir="rtl">{m.arabic}</span> · {m.meaning} · mansion {m.index + 1} of 28 · in {mansionSign(m.index)} (sidereal)</p>
      </Section>
      <Section title={`Born ${chart.islamic.hijri.label}`} learn="hijri">
        <p className="text-sm leading-relaxed text-muted">
          Your birthday in the Hijri calendar, a {chart.islamic.hijri.weekday}{chart.islamic.hijri.day >= 13 && chart.islamic.hijri.day <= 15 ? ', one of the white days, the bright middle of the month' : ''}{chart.islamic.hijri.month === 9 ? ', in Ramadan' : ''}.
          Today is {t.hijri.label}.
        </p>
      </Section>
      <Section title={`Today: Moon in ${t.mansion.name}`} learn="manazil">
        <p className="text-sm leading-relaxed text-muted">{todayM.today}</p>
        <p className="text-xs text-dim"><span lang="ar" dir="rtl">{t.mansion.arabic}</span> · {t.mansion.meaning}{t.mansion.index === m.index ? ' · your birth mansion' : ''}</p>
      </Section>
      <Section title="Abjad: the number of your name" learn="abjad">
        <label htmlFor="arabicname" className="text-sm text-muted">Your name in Arabic script (stays on this device, never saved)</label>
        <input id="arabicname" dir="rtl" lang="ar" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="محمد"
          className="h-12 rounded-2xl border border-line-2 bg-deep px-4 text-[17px] placeholder:text-dim" />
        {name.trim() && !ab && <p className="text-sm text-mauve-lite">Abjad needs Arabic letters. Try typing the name in Arabic.</p>}
        {ab && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-mono text-xs text-dim" dir="rtl" lang="ar">{ab.letters.map((l) => `${l.letter} ${l.value}`).join(' + ')}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[['Number', String(ab.total)], ['Reduced', String(ab.reduced)], ['Burj', `${ab.burj.name} (${ab.burj.sign})`], ['Element', ab.element]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-deep p-2.5 text-center"><span className="block text-[10px] uppercase tracking-wide text-muted">{k}</span><span className="font-semibold">{v}</span></div>
              ))}
            </div>
            <p className="text-muted">
              Your name adds to <strong className="text-starlight">{ab.total}</strong>, which reduces to {ab.reduced}: {LIFE_PATH_LINE[ab.reduced].split('. ')[0]}. Its burj is <strong className="text-starlight">{ab.burj.name}</strong> <span lang="ar" dir="rtl">{ab.burj.arabic}</span>, {ab.burj.sign}, an {ab.element.toLowerCase()} name.
              The letters are {(['Fire', 'Earth', 'Air', 'Water'] as const).filter((e) => ab.elementCounts[e]).map((e) => `${ab.elementCounts[e]} ${e.toLowerCase()}`).join(', ')}: {ELEMENT_WEST[Object.entries(ab.elementCounts).sort((x, y) => y[1] - x[1])[0][0]]} leads.
            </p>
          </div>
        )}
      </Section>
      <p className="text-xs text-dim"><Tag>Note</Tag> Mansion meanings follow the classical almanac tradition (al-Bīrūnī and later), in Orbori&apos;s words. Abjad uses the eastern (Mashriqi) letter values.</p>
    </PlusGate>
  );
}
