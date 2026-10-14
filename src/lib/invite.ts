import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { BirthInput } from './astro/types';

/**
 * Invite tokens carry the inviter's birth details encrypted (AES-256-GCM), so the
 * link can be opened without a database but nobody can read the details from it.
 */
export interface InvitePayload {
  v: 1;
  input: BirthInput;
  handle: string;
  seed: number;
  /** Nickname the inviter gave the partner, shown back to the partner. */
  nickname?: string;
  iat: number;
}

const DEV_SECRET = 'orbori-dev-only-secret';

export function inviteKey(): Buffer | null {
  const secret = process.env.INVITE_SECRET || (process.env.NODE_ENV !== 'production' ? DEV_SECRET : '');
  return secret ? createHash('sha256').update(secret).digest() : null;
}

export const invitesEnabled = () => inviteKey() !== null;

export function sealInvite(p: Omit<InvitePayload, 'v' | 'iat'>): string {
  const key = inviteKey();
  if (!key) throw new Error('Invites are not configured yet.');
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([c.update(JSON.stringify({ ...p, v: 1, iat: Date.now() }), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64url');
}

export function openInvite(token: string): InvitePayload {
  const key = inviteKey();
  if (!key) throw new Error('Invites are not configured yet.');
  try {
    const raw = Buffer.from(token, 'base64url');
    const d = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
    const p = JSON.parse(json) as InvitePayload;
    if (p.v !== 1) throw new Error();
    return p;
  } catch {
    throw new Error('This invite link is broken or expired.');
  }
}
