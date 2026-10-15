import * as A from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { abjad, hijriDate, mansionOf, mansionSign, moonMansionAt } from './islamic';

describe('Lunar mansions', () => {
  it('28 mansions of 12°51′26″ from sidereal Aries', () => {
    expect(mansionOf(0).name).toBe('al-Sharaṭān');
    expect(mansionOf(12.9).name).toBe('al-Buṭayn');
    expect(mansionOf(359).name).toBe('Baṭn al-Ḥūt');
    expect(mansionOf(13 * 360 / 28 + 1).name).toBe('al-Simāk'); // Spica's mansion
    expect(mansionSign(13)).toBe('Virgo');
  });
  it('the full Moon of 15–16 November 2024 crossed the Pleiades, then Aldebaran', () => {
    expect(moonMansionAt(A.MakeTime(new Date('2024-11-16T05:00:00Z'))).name).toBe('al-Thurayyā'); // Pleiades occultation
    expect(moonMansionAt(A.MakeTime(new Date('2024-11-16T21:00:00Z'))).name).toBe('al-Dabarān');
  });
});

describe('Hijri calendar', () => {
  it('1 Ramadan 1445 was 11 March 2024 (Umm al-Qura)', () => {
    expect(hijriDate('2024-03-11', 'UTC')).toMatchObject({ day: 1, month: 9, monthName: 'Ramadan', year: 1445 });
    expect(hijriDate('2024-03-11', 'UTC').weekday).toBe('Monday');
  });
  it('1 Muharram 1446 was 7 July 2024', () => {
    expect(hijriDate('2024-07-07', 'UTC').label).toBe('1 Muharram 1446 AH');
  });
});

describe('Abjad', () => {
  it('محمد = 40+8+40+4 = 92', () => {
    const a = abjad('محمد')!;
    expect(a.total).toBe(92);
    expect(a.reduced).toBe(2);
    expect(a.burj.name).toBe('al-ʿAqrab'); // (92−1) mod 12 = 7 → the 8th burj, Scorpio
    expect(a.element).toBe('Water');
  });
  it('علي = 70+30+10 = 110, handles hamza forms and ignores diacritics', () => {
    expect(abjad('عَلِيّ')!.total).toBe(110);
    expect(abjad('أحمد')!.total).toBe(1 + 8 + 40 + 4);
    expect(abjad('فاطمة')!.total).toBe(80 + 1 + 9 + 40 + 5);
    expect(abjad('John')).toBeNull();
  });
});
