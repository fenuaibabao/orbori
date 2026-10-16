/**
 * The daily question: one voice of the Council asks something about today, built
 * from that voice's own guidance. The voice rotates so all seven get a turn.
 */
import type { Advice, SystemId } from './council/types';

export interface DailyQuestion { system: SystemId; prompt: string; options: { id: string; label: string }[] }

const BY_ADVICE: Record<Advice, string> = {
  speak: 'Did you say the thing you needed to say today?',
  act: 'Did you make a move today, even a small one?',
  connect: 'Did you reach out to someone today?',
  build: 'Did you put in steady work on something that matters?',
  slow: 'Did you manage to slow down today?',
  release: 'Did you let something go today?',
};

const OPTIONS = [
  { id: 'yes', label: 'Yes' },
  { id: 'partly', label: 'Sort of' },
  { id: 'no', label: 'Not today' },
];

/** Stable per date: the same question all day, a different voice tomorrow. */
export function dailyQuestion(date: string, systems: { system: SystemId; label: string; advice: Advice; headline: string }[]): DailyQuestion | null {
  if (!systems.length) return null;
  const day = Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 86400000);
  const s = systems[day % systems.length];
  return { system: s.system, prompt: `${s.label}: “${s.headline}.” ${BY_ADVICE[s.advice]}`, options: OPTIONS };
}
