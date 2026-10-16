import 'server-only';
import { createHash } from 'node:crypto';

/** The beta: Plus is free for testers who join through the tester link; the Buy buttons are hidden. */
export const BETA = true;

/** Stable tester code derived from the invite secret (so it isn't guessable and needs no new setting). */
export function betaCode(): string {
  const secret = process.env.INVITE_SECRET || 'orbori-dev-only-secret';
  return createHash('sha256').update('orbori-beta:' + secret).digest('base64url').slice(0, 10);
}
