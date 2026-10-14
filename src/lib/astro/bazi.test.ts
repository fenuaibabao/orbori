import { describe, expect, it } from 'vitest';
import { bazi, lichun } from './bazi';
import { birthInstant } from './time';

const pillars = (d: string, t: string | null, tz = 'Asia/Shanghai') => {
  const b = bazi(birthInstant(d, t, tz), d, t);
  return [b.year.hanzi, b.month.hanzi, b.day.hanzi, b.hour?.hanzi ?? null];
};

describe('Four Pillars', () => {
  it('2000-01-01 00:30 Beijing: 己卯 丙子 戊午 壬子', () => {
    expect(pillars('2000-01-01', '00:30')).toEqual(['己卯', '丙子', '戊午', '壬子']);
  });
  it('year pillar turns at Lichun, not Lunar New Year (1984)', () => {
    // Lunar New Year was 1984-02-02 but Lichun was 1984-02-04 23:19 Beijing.
    expect(pillars('1984-02-03', '12:00')[0]).toBe('癸亥');
    expect(pillars('1984-02-05', '12:00')[0]).toBe('甲子');
    expect(pillars('1984-02-05', '12:00')[1]).toBe('丙寅'); // first (Tiger) month of a Jia year
  });
  it('Lichun instants match published times', () => {
    expect(lichun(2024).toISOString().slice(0, 16)).toBe('2024-02-04T08:26'); // 16:27 Beijing
    expect(lichun(2026).toISOString().slice(0, 13)).toBe('2026-02-03T20');
  });
  it('day pillars step through the 60-day cycle', () => {
    expect(pillars('2000-01-02', null)[2]).toBe('己未');
    expect(pillars('2000-03-01', null)[2]).toBe('戊午'); // 60 days after 2000-01-01
  });
  it('late Rat hour (23:xx) takes the next day stem', () => {
    // Day 戊午 (Wu); next day is 己未 (Ji) whose Rat hour is 甲子.
    expect(pillars('2000-01-01', '23:30')[3]).toBe('甲子');
  });
  it('without a birth time there are six characters', () => {
    const b = bazi(birthInstant('1994-07-10', null, 'America/Los_Angeles'), '1994-07-10', null);
    expect(b.hour).toBeNull();
    expect(Object.values(b.elements).reduce((s, n) => s + n, 0)).toBe(6);
  });
});
