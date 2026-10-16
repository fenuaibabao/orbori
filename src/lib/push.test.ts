import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { DateTime } from 'luxon';
import { isDue } from './push';

const at = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' });

describe('nightly reminder timing', () => {
  it('is due at the chosen local time, for two hours, once a day', () => {
    // 20:05 in Los Angeles on Oct 16 = 03:05 UTC Oct 17
    expect(isDue('20:00', 'America/Los_Angeles', null, at('2026-10-17T03:05:00Z'))).toEqual({ due: true, date: '2026-10-16' });
    expect(isDue('20:00', 'America/Los_Angeles', '2026-10-16', at('2026-10-17T03:05:00Z')).due).toBe(false);
    expect(isDue('20:00', 'America/Los_Angeles', null, at('2026-10-17T02:55:00Z')).due).toBe(false);
    expect(isDue('20:00', 'America/Los_Angeles', null, at('2026-10-17T05:01:00Z')).due).toBe(false);
  });
  it('ignores a bad time zone', () => {
    expect(isDue('20:00', 'Not/AZone', null).due).toBe(false);
  });
});
