import { describe, expect, it } from 'vitest';
import { astrocartography, cartoBasis, lineLongitude } from './astrocarto';
import { birthInstant } from './time';

describe('astrocartography', () => {
  const instant = birthInstant('1994-07-10', '12:52', 'America/Los_Angeles');
  it('puts the Sun overhead near the birthplace at local noon', () => {
    const { gst, planets } = cartoBasis(instant);
    const sun = planets.find((p) => p.planet === 'Sun')!;
    const mc = lineLongitude(sun.ra, sun.dec, gst, 'MC', 37.87)!;
    expect(Math.abs(mc - -122.27)).toBeLessThan(15); // 12:52 daylight time is about 11:50 local solar time
  });
  it('draws 40 lines, rising and setting lines mirroring around the MC', () => {
    const lines = astrocartography(instant);
    expect(lines).toHaveLength(40);
    const { gst, planets } = cartoBasis(instant);
    const v = planets.find((p) => p.planet === 'Venus')!;
    const mc = lineLongitude(v.ra, v.dec, gst, 'MC', 0)!;
    const asc = lineLongitude(v.ra, v.dec, gst, 'ASC', 0)!;
    const dsc = lineLongitude(v.ra, v.dec, gst, 'DSC', 0)!;
    const diff = (a: number, b: number) => ((a - b + 540) % 360) - 180;
    expect(Math.abs(diff(mc, asc) + diff(mc, dsc))).toBeLessThan(0.01);
  });
});
