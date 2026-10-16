/**
 * Vision credits: extra Cosmic Visions beyond the free allowance, sold in packs.
 * Priced so that after Stripe's fee (2.9% + 30¢) Orbori keeps about 8–10% over
 * the image cost. If the real average cost per image changes (see Mission
 * control), update COST_PER_VISION and the pack prices together; the test
 * checks the margin stays in range.
 */
export const COST_PER_VISION = 0.05; // US$, conservative estimate per image (medium, portrait)
export const STRIPE_PCT = 0.029;
export const STRIPE_FIXED = 0.3;

export const PACKS = [
  { id: 'p12', credits: 12, cents: 99 },
  { id: 'p30', credits: 30, cents: 199 },
  { id: 'p75', credits: 75, cents: 449 },
  { id: 'p150', credits: 150, cents: 879 },
] as const;
export type PackId = (typeof PACKS)[number]['id'];

/** What Orbori keeps over the image cost, as a fraction (0.09 = 9%). */
export function packMargin(p: { credits: number; cents: number }, cost = COST_PER_VISION) {
  const price = p.cents / 100;
  const net = price - price * STRIPE_PCT - STRIPE_FIXED;
  const images = p.credits * cost;
  return (net - images) / images;
}

/** Real cost of one image from OpenAI's reported token usage (US$ per 1M tokens). */
const RATES: Record<string, { textIn: number; imageIn: number; out: number }> = {
  'gpt-image-2': { textIn: 2.5, imageIn: 4, out: 15 },
  'gpt-image-1.5': { textIn: 5, imageIn: 8, out: 10 },
  'gpt-image-1': { textIn: 5, imageIn: 10, out: 40 },
};
export function imageCost(model: string, usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { text_tokens?: number; image_tokens?: number } }) {
  const r = RATES[model] ?? RATES['gpt-image-1.5'];
  if (!usage) return null;
  const textIn = usage.input_tokens_details?.text_tokens ?? usage.input_tokens ?? 0;
  const imageIn = usage.input_tokens_details?.image_tokens ?? 0;
  return (textIn * r.textIn + imageIn * r.imageIn + (usage.output_tokens ?? 0) * r.out) / 1e6;
}
