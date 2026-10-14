'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CityField, type CityPick } from '@/components/CityField';
import { BackIcon } from '@/components/icons';
import { btnPrimary, Screen } from '@/components/ui';
import { readDraft, saveDraft } from '@/lib/store';

const field = 'h-14 w-full rounded-2xl border border-line-2 bg-night px-4 text-[17px] font-medium text-starlight [color-scheme:dark]';
const label = 'mb-2 block text-[13px] font-semibold tracking-wide text-muted';

export default function Birth() {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [noTime, setNoTime] = useState(false);
  const [city, setCity] = useState<CityPick | null>(null);
  const [error, setError] = useState('');

  // Restore a half-finished form (e.g. after tapping Back).
  useEffect(() => {
    const d = readDraft();
    if (!d) return;
    setDate(d.input.date);
    setTime(d.input.time ?? '');
    setNoTime(d.input.time === null);
    setCity({ label: d.cityLabel, latitude: d.input.latitude, longitude: d.input.longitude, timeZone: d.input.timeZone });
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return setError('Add your birth date.');
    if (!noTime && !time) return setError('Add your birth time, or tick "I don\'t know my birth time".');
    if (!city) return setError('Pick your birth city from the list.');
    saveDraft({
      input: { date, time: noTime ? null : time, timeZone: city.timeZone, latitude: city.latitude, longitude: city.longitude },
      cityLabel: city.label,
    });
    router.push('/onboarding/calculating');
  };

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <Link href="/welcome" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full border border-line-2"><BackIcon /></Link>
        <div className="flex gap-1.5" aria-label="Step 2 of 3">
          <span className="h-1.5 w-[22px] rounded-full bg-royal" /><span className="h-1.5 w-[22px] rounded-full bg-gold-lite" /><span className="h-1.5 w-[22px] rounded-full bg-line" />
        </div>
        <span className="w-11" />
      </div>

      <div className="mt-7 flex flex-col gap-2.5">
        <h1 className="font-display text-[30px] font-bold leading-[1.1]">When did you<br />touch down?</h1>
        <p className="text-[15px] leading-relaxed text-muted">Five systems need the same three facts. We do the math, you get the gossip.</p>
      </div>

      <form onSubmit={submit} className="mt-7 flex flex-1 flex-col gap-5" noValidate>
        <div>
          <label htmlFor="bdate" className={label}>Birth date</label>
          <input id="bdate" type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="btime" className={label}>Birth time</label>
          {noTime ? (
            <div className="flex h-14 items-center rounded-2xl border border-dashed border-royal px-4 text-sm text-muted">
              We&apos;ll use noon. Rising sign &amp; houses stay a mystery.
            </div>
          ) : (
            <input id="btime" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
          )}
          <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} className="h-[22px] w-[22px] accent-gold" />
            I don&apos;t know my birth time
          </label>
        </div>
        <CityField value={city} onPick={setCity} />

        {error && <p role="alert" className="text-sm text-mauve-lite">{error}</p>}
        <div className="flex-1" />
        <button type="submit" className={btnPrimary}>Calculate my cosmos</button>
        <p className="text-center text-xs leading-relaxed text-dim">Your exact birth details are never shown to anyone. Circles only see coarse placements.</p>
      </form>
    </Screen>
  );
}
