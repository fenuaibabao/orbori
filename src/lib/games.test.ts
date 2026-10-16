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
