'use client';
import { useState } from 'react';
import type { BirthInput } from '@/lib/astro/types';
import { CityField, type CityPick } from './CityField';

const field = 'h-14 w-full rounded-2xl border border-line-2 bg-night px-4 text-[17px] font-medium text-starlight [color-scheme:dark]';
const label = 'mb-2 block text-[13px] font-semibold tracking-wide text-muted';

export interface BirthValue { input: BirthInput; cityLabel: string }

/** Date, time (or "unknown") and city. Calls onValid with a complete value, or returns an error message. */
export function useBirthFields(prefix: string) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [noTime, setNoTime] = useState(false);
  const [city, setCity] = useState<CityPick | null>(null);

  const validate = (): BirthValue | string => {
    if (!date) return 'Add the birth date.';
    if (!noTime && !time) return 'Add the birth time, or tick "Time unknown".';
    if (!city) return 'Pick the birth city from the list.';
    return {
      input: { date, time: noTime ? null : time, timeZone: city.timeZone, latitude: city.latitude, longitude: city.longitude },
      cityLabel: city.label,
    };
  };

  const fields = (
    <>
      <div>
        <label htmlFor={`${prefix}-date`} className={label}>Birth date</label>
        <input id={`${prefix}-date`} type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor={`${prefix}-time`} className={label}>Birth time</label>
        {noTime ? (
          <div className="flex h-14 items-center rounded-2xl border border-dashed border-royal px-4 text-sm text-muted">We&apos;ll use noon. Rising sign stays a mystery.</div>
        ) : (
          <input id={`${prefix}-time`} type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
        )}
        <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} className="h-[22px] w-[22px] accent-gold" />
          Time unknown
        </label>
      </div>
      <CityField value={city} onPick={setCity} />
    </>
  );

  const reset = () => { setDate(''); setTime(''); setNoTime(false); setCity(null); };
  return { fields, validate, reset };
}
