import { DateTime } from 'luxon';
import { parseDate } from './util';

/**
 * Convert a civil birth date/time at a place to a UTC instant, using the
 * historical rules of the IANA time zone (DST, wartime offsets, etc.).
 * Unknown time → local noon.
 */
export function birthInstant(date: string, time: string | null, timeZone: string): Date {
  const { year, month, day } = parseDate(date);
  let hour = 12;
  let minute = 0;
  if (time) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!m) throw new Error(`Invalid time "${time}" (expected HH:mm)`);
    hour = +m[1];
    minute = +m[2];
    if (hour > 23 || minute > 59) throw new Error(`Invalid time "${time}"`);
  }
  const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone: timeZone });
  if (!dt.isValid) throw new Error(`Invalid date/time or zone: ${dt.invalidExplanation ?? ''}`);
  return dt.toJSDate();
}

/** Start and end (23:59) of the civil birth day as UTC instants. */
export function birthDayBounds(date: string, timeZone: string): [Date, Date] {
  return [birthInstant(date, '00:00', timeZone), birthInstant(date, '23:59', timeZone)];
}
