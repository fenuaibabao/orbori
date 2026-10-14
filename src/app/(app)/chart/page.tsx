'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BadgeShelf } from '@/components/BadgeShelf';
import { ChevronIcon, ShareIcon } from '@/components/icons';
import { Sigil } from '@/components/Sigil';
import { Tag } from '@/components/ui';
import type { Chart, Placement } from '@/lib/astro/types';
import { ANIMAL_LINE, ELEMENT_LINE, LIFE_PATH_LINE, NAKSHATRA_LINE, TZOLKIN_LINE, vedicExplain, westernExplain } from '@/lib/content';
import { useChart } from '@/lib/hooks';
import { handleFromSeed, randomSeed } from '@/lib/identity';
import { badges, computeProgress, XP } from '@/lib/progress';
import { formatOneIn, formatPct, rarityFootnote } from '@/lib/rarity-format';
import { localToday, useAppStore } from '@/lib/store';

interface Row { id: string; label: string; value: string; explain: string }
interface Group { name: string; note: string; rows: Row[] }

const DEEPER: Record<string, { slug: string; teaser: string }> = {
  Western: { slug: 'western', teaser: 'houses, aspects, balance' },
  Vedic: { slug: 'vedic', teaser: 'your life chapters (Dasha), D9' },
  'Chinese zodiac': { slug: 'chinese', teaser: 'Four Pillars, secret animal, elements' },
  Numerology: { slug: 'numerology', teaser: 'Personal Year, name numbers' },
  "Mayan Tzolk'in": { slug: 'mayan', teaser: 'your Mayan cross, trecena' },
};

const deg = (p: Placement) => `${Math.floor(p.degree)}°${String(Math.floor((p.degree % 1) * 60)).padStart(2, '0')}′`;

function groups(c: Chart): Group[] {
  const w = c.western.planets;
  const v = c.vedic.planets;
  const PLANETS: [keyof typeof w, string][] = [['mercury', 'Mercury'], ['venus', 'Venus'], ['mars', 'Mars'], ['jupiter', 'Jupiter'], ['saturn', 'Saturn']];
  const moonValue = c.timeKnown || c.moonSignOptions.length === 1 ? w.moon.sign : c.moonSignOptions.join(' or ');
  return [
    {
      name: 'Western', note: 'Tropical zodiac', rows: [
        { id: 'w-sun', label: 'Sun', value: w.sun.sign, explain: `${westernExplain.sun(w.sun.sign)} (${deg(w.sun)})` },
        { id: 'w-moon', label: 'Moon', value: moonValue, explain: c.moonSignOptions.length > 1 && !c.timeKnown
          ? `The Moon changed sign on your birthday, so without a birth time it's ${c.moonSignOptions.join(' or ')}. Add your time to settle it.`
          : westernExplain.moon(w.moon.sign) },
        c.western.ascendant
          ? { id: 'w-asc', label: 'Rising', value: c.western.ascendant.sign, explain: westernExplain.rising(c.western.ascendant.sign) }
          : { id: 'w-asc', label: 'Rising', value: 'Unknown', explain: 'Your rising sign needs an exact birth time. Add it any time in your profile.' },
        ...PLANETS.map(([k, n]) => ({ id: `w-${k}`, label: n, value: `${w[k].sign}${w[k].retrograde ? ' ℞' : ''}`, explain: westernExplain.planet(n, w[k].sign) + (w[k].retrograde ? ' Retrograde at birth: this energy works inward first.' : '') })),
      ],
    },
    {
      name: 'Vedic', note: 'Sidereal: counts from the real stars', rows: [
        { id: 'v-sun', label: 'Sun', value: v.sun.sign, explain: vedicExplain.sun(v.sun.sign, w.sun.sign) },
        { id: 'v-moon', label: 'Moon', value: `${v.moon.sign} · ${c.vedic.moonNakshatra.name}`, explain: `${vedicExplain.moon(v.moon.sign, w.moon.sign)} Your Moon nakshatra is ${c.vedic.moonNakshatra.name}, ${NAKSHATRA_LINE[c.vedic.moonNakshatra.name]} (pada ${c.vedic.moonNakshatra.pada}, ruled by ${c.vedic.moonNakshatra.lord}).` },
        c.vedic.ascendant
          ? { id: 'v-asc', label: 'Ascendant', value: c.vedic.ascendant.sign, explain: vedicExplain.lagna(c.vedic.ascendant.sign) }
          : { id: 'v-asc', label: 'Ascendant', value: 'Unknown', explain: 'Your lagna needs an exact birth time.' },
      ],
    },
    {
      name: 'Chinese zodiac', note: `Year from ${c.chinese.lunarYearStart}`, rows: [
        { id: 'c', label: 'Animal', value: `${c.chinese.element} ${c.chinese.animal}`, explain: `${ANIMAL_LINE[c.chinese.animal]} ${ELEMENT_LINE[c.chinese.element]}` },
      ],
    },
    {
      name: 'Numerology', note: 'From your birth date', rows: [
        { id: 'n', label: 'Life Path', value: String(c.numerology.lifePath), explain: LIFE_PATH_LINE[c.numerology.lifePath] },
      ],
    },
    {
      name: "Mayan Tzolk'in", note: '260-day sacred calendar', rows: [
        { id: 'm', label: 'Day sign', value: c.tzolkin.label, explain: `${c.tzolkin.number} ${c.tzolkin.daySign} (K'iche': ${c.tzolkin.kicheName}). ${TZOLKIN_LINE[c.tzolkin.daySign]}` },
      ],
    },
  ];
}

export default function MyChart() {
  const { state, setProfile } = useAppStore();
  const profile = state.profile;
  const { data, error } = useChart(profile);
  const [open, setOpen] = useState<string | null>('w-sun');
  const { date } = localToday();
  const progress = useMemo(() => computeProgress(state.checkIns, date, state.matches.length * XP.match), [state.checkIns, date, state.matches.length]);

  if (error) return <p role="alert" className="text-mauve-lite">{error}</p>;
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-night" aria-label="Loading your chart" />;
  const { chart, rarity } = data;
  const list = badges(progress, { mythic: rarity.tier === 'Mythic', matches: state.matches.length });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-[26px] font-bold">My Chart</h1>
        <Link href="/compatibility" className="flex min-h-11 items-center text-sm text-gold-lite">Compatibility →</Link>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-6 lg:w-[380px] lg:shrink-0">
          <section aria-label="Your identity" className="flex flex-col items-center gap-3 rounded-3xl border border-royal bg-night px-4 py-6">
            <Sigil seed={profile.seed} size={112} label="Your sigil" />
            <div className="text-center">
              <p className="font-display text-2xl font-bold">{handleFromSeed(profile.seed)}</p>
              <p className="mt-1 text-[13px] text-muted">Your anonymous handle in the Cosmos</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 font-mono text-[13px]">
              <span className="rounded-xl bg-deep px-2.5 py-1.5">☉ {chart.western.planets.sun.sign}</span>
              <span className="rounded-xl bg-deep px-2.5 py-1.5">☽ {chart.moonSignOptions.join('/')}</span>
              {chart.western.ascendant && <span className="rounded-xl bg-deep px-2.5 py-1.5">↑ {chart.western.ascendant.sign}</span>}
            </div>
            <Link href="/onboarding/share" className="flex w-full flex-col gap-2 rounded-2xl border border-gold bg-deep px-3.5 py-3">
              <span className="flex items-center justify-between">
                <span className="flex h-7 items-center rounded-full bg-gold px-3 font-display text-xs font-extrabold tracking-[0.06em] text-space">{rarity.tier.toUpperCase()}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gold-lite"><ShareIcon size={16} />Share</span>
              </span>
              <span className="text-[13px] leading-snug">
                {rarity.pct <= 0.5
                  ? <>Only <span className="font-mono text-gold-lite">{formatPct(rarity.pct)}</span> of people have a chart this rare. </>
                  : <>A classic combo. </>}
                About 1 in {formatOneIn(rarity.oneIn)} share your exact Sun, Moon, animal &amp; Life Path.
                <span className="mt-1 block text-[11px] text-dim">{rarityFootnote(rarity.population)}</span>
              </span>
            </Link>
            <button type="button" onClick={() => setProfile({ ...profile, seed: randomSeed() })}
              className="min-h-11 rounded-full border border-royal px-4 text-sm font-medium hover:border-gold-lite">
              Reroll handle &amp; sigil
            </button>
          </section>

          <section aria-labelledby="badges" className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <h2 id="badges" className="font-display text-[19px] font-bold">Badges</h2>
              <Link href="/profile" className="flex min-h-8 items-center font-mono text-xs text-gold-lite">
                {list.filter((b) => b.earned).length} / {list.length} · SEE ALL
              </Link>
            </div>
            <BadgeShelf badges={list} />
          </section>
        </div>

        <div className="flex flex-1 flex-col gap-5">
          {groups(chart).map((g) => (
            <section key={g.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <Tag>{g.name}</Tag>
                <span className="text-right text-xs text-dim">{g.note}</span>
              </div>
              <div className="overflow-hidden rounded-[18px] bg-night">
                {g.rows.map((r) => {
                  const isOpen = open === r.id;
                  return (
                    <div key={r.id} className="border-b border-line last:border-b-0">
                      <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.id)}
                        className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
                        <span className="flex-1 text-[15px] text-muted">{r.label}</span>
                        <span className="font-mono text-sm font-bold">{r.value}</span>
                        <ChevronIcon className={`text-gold-lite transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && <p className="px-4 pb-4 text-sm leading-relaxed">{r.explain}</p>}
                    </div>
                  );
                })}
                <Link href={`/chart/${DEEPER[g.name].slug}`} className="flex min-h-12 items-center justify-between gap-3 border-t border-line bg-deep px-4 text-sm font-semibold text-gold-lite hover:bg-night-2">
                  <span>Go deeper: {DEEPER[g.name].teaser}</span><span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
