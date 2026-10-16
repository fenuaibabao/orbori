import { describe, expect, it } from 'vitest';
import { makeQuest, maskTerm } from './games';

describe('minigames', () => {
  it('hides the term inside its own definition', () => {
    expect(maskTerm('Dasha (planetary periods)', 'Your dasha is the planetary period you are in.')).toBe('Your _____ is the planetary period you are in.');
    expect(maskTerm('Trecena', 'A trecena lasts 13 days.')).toBe('A _____ lasts 13 days.');
  });
  it('builds questions with four distinct options including the answer', () => {
    const qs = makeQuest(6, true);
    expect(qs).toHaveLength(6);
    for (const q of qs) {
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
    }
  });
});

import { hawaiianRounds, islamicRounds, numerologyRounds, westernRounds } from './games';
describe('tradition games', () => {
  it('every round has its answer among four distinct options', () => {
    for (const r of [...westernRounds(30), ...numerologyRounds(30), ...hawaiianRounds(30), ...islamicRounds(28)]) {
      expect(r.options).toContain(r.answer);
      expect(new Set(r.options).size).toBe(r.options.length);
      expect(r.options.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('knows its sign facts', () => {
    const rs = westernRounds(60, (() => { let s = 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })());
    const leo = rs.find((r) => r.prompt === 'Leo' && r.question.includes('element'));
    if (leo) expect(leo.answer).toBe('Fire');
  });
});
