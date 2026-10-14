import { describe, expect, it } from 'vitest';
import { computeChart } from '.';
import { chineseZodiac, lunarNewYear } from './chinese';
import { lifePath } from './numerology';
import { tzolkin } from './mayan';
import { birthInstant } from './time';

// Published Lunar New Year dates (China), including the 2033 leap-11th-month edge case.
const LNY: Record<number, string> = {
  1900: '1900-01-31', 1912: '1912-02-18', 1924: '1924-02-05', 1936: '1936-01-24', 1948: '1948-02-10',
  1950: '1950-02-17', 1960: '1960-01-28', 1966: '1966-01-21', 1970: '1970-02-06', 1976: '1976-01-31',
  1980: '1980-02-16', 1984: '1984-02-02', 1985: '1985-02-20', 1987: '1987-01-29', 1990: '1990-01-27',
  1992: '1992-02-04', 1994: '1994-02-10', 1995: '1995-01-31', 1996: '1996-02-19', 1998: '1998-01-28',
  2000: '2000-02-05', 2001: '2001-01-24', 2004: '2004-01-22', 2006: '2006-01-29', 2008: '2008-02-07',
  2010: '2010-02-14', 2012: '2012-01-23', 2014: '2014-01-31', 2015: '2015-02-19', 2017: '2017-01-28',
  2019: '2019-02-05', 2020: '2020-01-25', 2021: '2021-02-12', 2022: '2022-02-01', 2023: '2023-01-22',
  2024: '2024-02-10', 2025: '2025-01-29', 2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26',
  2030: '2030-02-03', 2033: '2033-01-31', 2034: '2034-02-19',
};

describe('Chinese zodiac', () => {
  it.each(Object.entries(LNY))('Lunar New Year %s', (year, expected) => {
    expect(lunarNewYear(+year).toISOString().slice(0, 10)).toBe(expected);
  });

  it('uses the Lunar New Year boundary, not January 1', () => {
    expect(chineseZodiac('1996-02-18')).toMatchObject({ animal: 'Pig', element: 'Wood' });
    expect(chineseZodiac('1996-02-19')).toMatchObject({ animal: 'Rat', element: 'Fire', polarity: 'Yang' });
    expect(chineseZodiac('2026-10-14')).toMatchObject({ animal: 'Horse', element: 'Fire' });
    expect(chineseZodiac('1992-04-02')).toMatchObject({ animal: 'Monkey', element: 'Water' });
  });
});

describe('Tzolkin', () => {
  it('anchors 13.0.0.0.0 (2012-12-21) on 4 Ajaw', () => {
    expect(tzolkin('2012-12-21')).toMatchObject({ number: 4, daySign: 'Ajaw', english: 'Sun' });
  });
  it('repeats every 260 days and steps one number and one sign per day', () => {
    expect(tzolkin('2013-09-07')).toMatchObject({ number: 4, daySign: 'Ajaw' }); // +260 days
    expect(tzolkin('2012-12-22')).toMatchObject({ number: 5, daySign: 'Imix' });
    expect(tzolkin('2012-12-20')).toMatchObject({ number: 3, daySign: 'Kawak' });
  });
});

describe('Numerology', () => {
  it('reduces month, day and year separately', () => {
    expect(lifePath('1996-07-18')).toEqual({ lifePath: 5, isMasterNumber: false });
  });
  it('keeps master numbers', () => {
    expect(lifePath('1987-11-29')).toEqual({ lifePath: 11, isMasterNumber: true });
  });
});

describe('Birth time', () => {
  it('applies daylight saving time historically', () => {
    expect(birthInstant('1996-07-18', '04:12', 'America/Los_Angeles').toISOString()).toBe('1996-07-18T11:12:00.000Z');
    expect(birthInstant('1996-01-18', '04:12', 'America/Los_Angeles').toISOString()).toBe('1996-01-18T12:12:00.000Z');
  });
  it('uses local noon and hides angles when time is unknown', () => {
    const c = computeChart({ date: '1996-07-18', time: null, timeZone: 'America/Los_Angeles', latitude: 37.8, longitude: -122.27 });
    expect(c.utc).toBe('1996-07-18T19:00:00.000Z');
    expect(c.western.ascendant).toBeNull();
    expect(c.vedic.ascendant).toBeNull();
    expect(c.moonSignOptions.length).toBeGreaterThanOrEqual(1);
  });
});
