import { describe, expect, it } from 'vitest';
import { moonNight, nightFamily } from './hawaiian';

const HNL = 'Pacific/Honolulu';

describe('Kaulana Mahina', () => {
  it('Hilo follows the new moon of 2 October 2024 (08:49 HST)', () => {
    expect(moonNight('2024-10-02', HNL)).toMatchObject({ night: 1, name: 'Hilo', anahulu: 'Hoʻonui' });
    expect(moonNight('2024-10-03', HNL).name).toBe('Hoaka');
    expect(moonNight('2024-10-04', HNL).name).toBe('Kūkahi');
  });
  it('the full moon of 17 October 2024 (01:26 HST) falls on Hoku / Māhealani', () => {
    expect(moonNight('2024-10-16', HNL).name).toBe('Hoku');
    expect(moonNight('2024-10-17', HNL)).toMatchObject({ name: 'Māhealani', anahulu: 'Poepoe' });
  });
  it('the moon ends on Mauli and Muku and starts again at the next new moon (1 Nov 2024, 02:47 HST)', () => {
    expect(moonNight('2024-10-30', HNL).name).toBe('Mauli');
    expect(moonNight('2024-10-31', HNL)).toMatchObject({ name: 'Muku', anahulu: 'Hoʻēmi' });
    expect(moonNight('2024-11-01', HNL).name).toBe('Hilo');
  });
  it('Makahiki: Welehu begins with the first new moon after 17 November', () => {
    // New moon 1 Dec 2024 → Welehu; counting from Welehu 2023 (12 Dec 2023), October 2024 is Māhoe Hope and November ʻIkuwā.
    expect(moonNight('2024-12-05', HNL)).toMatchObject({ month: 'Welehu', season: 'Hoʻoilo', makahiki: true });
    expect(moonNight('2024-10-20', HNL)).toMatchObject({ month: 'Māhoe Hope', season: 'Kau', makahiki: false });
    expect(moonNight('2024-11-10', HNL).month).toBe('ʻIkuwā');
    expect(moonNight('2025-06-15', HNL).makahiki).toBe(false);
  });
  it('night families', () => {
    expect(nightFamily(4)).toBe('Kū');
    expect(nightFamily(22)).toBe('ʻOle');
    expect(nightFamily(16)).toBe('Māhealani');
    expect(nightFamily(25)).toBe('Kāloa');
  });
});
