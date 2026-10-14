'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckIcon } from '@/components/icons';
import { Screen } from '@/components/ui';
import { fetchChart } from '@/lib/hooks';
import { randomSeed } from '@/lib/identity';
import { getProfile, readDraft, useStore } from '@/lib/store';

const STEPS = [
  'Western chart: planets placed',
  'Vedic: sliding everything 24° left',
  'Chinese zodiac: finding your Lunar New Year',
  'Numerology: adding it all up',
  "Mayan Tzolk'in: counting 260 days",
];

export default function Calculating() {
  const router = useRouter();
  const { setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const draft = readDraft();
    if (!draft) { router.replace('/onboarding/birth'); return; }
    let cancelled = false;
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length)), 520);
    const minWait = new Promise((r) => setTimeout(r, STEPS.length * 520 + 300));
    Promise.all([fetchChart(draft.input), minWait])
      .then(() => {
        if (cancelled) return;
        const existing = getProfile();
        setProfile({ ...draft, seed: existing?.seed ?? randomSeed(), createdAt: existing?.createdAt ?? new Date().toISOString() });
        router.replace(existing ? '/chart' : '/onboarding/reveal');
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; clearInterval(tick); };
  }, [router, setProfile]);

  const pct = Math.round((step / STEPS.length) * 100);

  return (
    <Screen className="items-center gap-10 pt-24">
      <div className="relative h-[260px] w-[260px]">
        <div className="anim-spin-slow absolute inset-0 rounded-full border border-[#2A2670]" aria-hidden="true">
          <span className="absolute left-[124px] -top-1.5 h-3 w-3 rounded-full bg-mauve" />
          <span className="absolute left-[22px] top-[200px] h-2.5 w-2.5 rounded-full bg-starlight" />
        </div>
        <div className="anim-spin absolute inset-11 rounded-full border border-royal" aria-hidden="true">
          <span className="absolute left-[160px] top-10 h-3 w-3 rounded-full bg-gold-lite" />
          <span className="absolute left-[80px] top-[160px] h-2.5 w-2.5 rounded-full bg-gold" />
        </div>
        <div className="absolute inset-[92px] flex items-center justify-center rounded-full border border-royal bg-night font-mono text-[22px] font-bold text-gold-lite" aria-live="polite">
          {pct}%
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-[26px] font-bold">Calculating your cosmos…</h1>
        <p className="text-[15px] text-muted">Getting five ancient systems to agree on a meeting time.</p>
      </div>

      <ul className="flex w-full flex-col gap-3 rounded-[20px] bg-night p-5">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex min-h-7 items-center gap-3 text-[15px] ${i < step ? '' : i === step ? '' : 'text-dim'}`}>
            {i < step ? <CheckIcon className="text-gold-lite" /> : (
              <span className="flex h-5 w-5 items-center justify-center"><span className={`h-2 w-2 rounded-full ${i === step ? 'bg-mauve' : 'border border-dim'}`} /></span>
            )}
            {s}
          </li>
        ))}
      </ul>

      {error && (
        <div role="alert" className="flex flex-col items-center gap-2 text-center text-sm text-mauve-lite">
          {error}
          <Link href="/onboarding/birth" className="text-gold-lite underline">Check your birth details</Link>
        </div>
      )}
    </Screen>
  );
}
