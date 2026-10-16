import { describe, expect, it } from 'vitest';
import { imageCost, PACKS, packMargin } from './credits';

describe('vision credit packs', () => {
  it('keep about 8–10% over the image cost after Stripe fees', () => {
    for (const p of PACKS) {
      const m = packMargin(p);
      expect(m, `${p.credits} for ${p.cents}¢ → ${(m * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.07);
      expect(m).toBeLessThanOrEqual(0.12);
    }
  });
  it('prices an image from its token usage', () => {
    expect(imageCost('gpt-image-1', { input_tokens: 100, output_tokens: 1584 })).toBeCloseTo(0.0639, 3);
  });
});
