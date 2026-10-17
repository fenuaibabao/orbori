import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleFromSeed } from './identity';

/** Letters, numbers and a little punctuation; 24 characters at most. Empty means "none". */
export const cleanName = (s: unknown) =>
  String(s ?? '').replace(/[^\p{L}\p{N}\p{M} .'’&-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24);

export interface FriendLabel { label: string; handle: string; friendName: string | null; nickname: string | null }

/**
 * What the viewer sees each person as: the viewer's own private nickname first,
 * then the name that person asked friends to use, then their handle.
 */
export async function labelsFor(admin: SupabaseClient, viewer: string, people: { id: string; seed: number }[]): Promise<Map<string, FriendLabel>> {
  const ids = people.map((p) => p.id);
  const [{ data: named }, { data: nicks }] = await Promise.all([
    ids.length ? admin.from('profiles').select('user_id, friend_name').in('user_id', ids) : Promise.resolve({ data: [] as { user_id: string; friend_name: string | null }[] }),
    ids.length ? admin.from('star_nicknames').select('friend, nickname').eq('owner', viewer).in('friend', ids) : Promise.resolve({ data: [] as { friend: string; nickname: string }[] }),
  ]);
  const fn = new Map((named ?? []).map((r) => [r.user_id as string, (r.friend_name as string | null) ?? null]));
  const nn = new Map((nicks ?? []).map((r) => [r.friend as string, r.nickname as string]));
  return new Map(people.map((p) => {
    const handle = handleFromSeed(p.seed), friendName = fn.get(p.id) ?? null, nickname = p.id === viewer ? null : nn.get(p.id) ?? null;
    return [p.id, { label: nickname ?? friendName ?? handle, handle, friendName, nickname }];
  }));
}
