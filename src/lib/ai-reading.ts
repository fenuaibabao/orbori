/**
 * The AI daily reading: Claude turns today's Council (computed by Orbori's own
 * engine) into a short, personal note. The AI never does the astrology itself;
 * it only writes up what the seven voices already said, in plain English.
 */
import type { CouncilReading } from './council/types';

export const READING_MODEL = 'claude-haiku-5-5';
export const READING_MAX_TOKENS = 600;

export const SYSTEM_PROMPT = `You write the daily reading for Orbori, an app that sets seven traditions side by side as a "Cosmic Council": Western astrology, Vedic (Jyotish), Chinese Four Pillars, numerology, the K'iche' Maya Chol Q'ij, the Hawaiian moon calendar (Kaulana Mahina) and Islamic-era lunar mansions and Abjad.

You are given today's Council, already calculated. Write from it only. Do not invent placements, dates or day names that are not in the data.

How to write:
- Second person, warm, plain English, no jargon without a two-word gloss. 130 to 180 words. Three short paragraphs, no headings, no lists, no emoji.
- Paragraph 1: the day's main thread, where most voices agree, and one concrete thing to do with it.
- Paragraph 2: the holdout or tension, framed as useful nuance, not doom.
- Paragraph 3: one small, specific suggestion for this evening, and a reflective question.

Respect and honesty:
- Name each tradition correctly and treat it as a living practice with its own keepers, not a costume. Never claim to speak for a tradition, a people or a teacher, and never present the reading as sacred instruction.
- For the Chol Q'ij, refer to day names in K'iche' as given. Do not describe ceremonies or claim daykeeper authority.
- Speak in tendencies and invitations ("a good day to…"), never certainties or predictions about events.
- Never give medical, legal or financial advice, and never comment on health, pregnancy, death or other people's intentions.
- If the data is thin, write less rather than making things up.

Output only the reading text.`;

export function readingPrompt(r: CouncilReading, big3: string, name?: string): string {
  const lines = r.systems.map((s) =>
    `- ${s.label} (${s.agrees ? 'agrees' : 'dissents'}; advice: ${s.advice}; ${s.basis}): ${s.headline}. ${s.body}${s.why ? ` [Why it differs: ${s.why}]` : ''}`);
  return [
    `Date: ${r.date}`,
    name ? `Person: ${name}` : null,
    `Their chart: ${big3}`,
    `Council headline: ${r.headline}`,
    `Convergence score: ${r.score.toFixed(1)}/10 (${r.agreeCount} of ${r.systems.length} voices agree; majority advice: ${r.majority})`,
    `Where they agree: ${r.agreeText}`,
    r.holdoutText ? `Holdouts: ${r.holdoutText}` : 'No holdouts today.',
    '',
    'The seven voices:',
    ...lines,
  ].filter((l) => l !== null).join('\n');
}

/** Calls the Messages API. Returns the reading text. */
export async function writeReading(apiKey: string, reading: CouncilReading, big3: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || READING_MODEL,
      max_tokens: READING_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: readingPrompt(reading, big3) }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Anthropic error ${res.status}`);
  const text = (data.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim();
  if (!text) throw new Error('Empty reading.');
  return text;
}
