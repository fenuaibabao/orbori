/** Minigame helpers (pure, testable). */
import { GLOSSARY } from './glossary';

export const shuffle = <T,>(xs: T[], rand = Math.random): T[] => {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Hide the term (and its plain name before any bracket) inside its own definition. */
export function maskTerm(term: string, body: string): string {
  const names = term.split(/\s*[(/]\s*|\s*\)\s*/).map((s) => s.trim()).filter((s) => s.length > 2);
  let out = body;
  for (const n of names) out = out.replace(new RegExp(escape(n), 'gi'), '_____');
  return out;
}

export interface QuestQuestion { id: string; system: string; clue: string; answer: string; options: string[] }

/** Term Quest: guess the term from its definition. Hard mode draws every option from the same tradition. */
export function makeQuest(count: number, hard: boolean, rand = Math.random): QuestQuestion[] {
  const pool = GLOSSARY.filter((g) => g.body.length > 40);
  return shuffle(pool, rand).slice(0, count).map((g) => {
    const same = pool.filter((x) => x.system === g.system && x.id !== g.id);
    const other = pool.filter((x) => x.id !== g.id);
    const from = hard && same.length >= 3 ? same : other;
    const wrong = shuffle(from, rand).slice(0, 3).map((x) => x.term);
    return { id: g.id, system: g.system, clue: maskTerm(g.term, g.body), answer: g.term, options: shuffle([g.term, ...wrong], rand) };
  });
}
