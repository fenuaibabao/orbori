'use client';
import { useMemo } from 'react';
import { computeProgress } from './progress';
import { localToday, useAppStore } from './store';
import { useLinks } from './use-links';

/** Progress for the signed-in (or on-device) person, including linked-people XP. */
export function useProgress() {
  const { state } = useAppStore();
  const { links } = useLinks();
  const { date } = localToday();
  const linked = links?.length ?? 0;
  return useMemo(() => computeProgress({ checkIns: state.checkIns, today: date, activity: state.activity, matches: state.matches.length, linked }),
    [state.checkIns, state.activity, state.matches.length, linked, date]);
}
