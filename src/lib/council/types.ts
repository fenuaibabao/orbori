export type SystemId = 'western' | 'vedic' | 'chinese' | 'numerology' | 'mayan' | 'hawaiian' | 'islamic';

/** What a system advises today. */
export type Advice = 'speak' | 'act' | 'connect' | 'build' | 'slow' | 'release';

/** Coarse mood used to measure agreement. */
export type Mood = 'go' | 'build' | 'ease';

export const MOOD: Record<Advice, Mood> = {
  speak: 'go', act: 'go', connect: 'go', build: 'build', slow: 'ease', release: 'ease',
};

export interface SystemSignal {
  system: SystemId;
  label: string;
  advice: Advice;
  /** -1 (hard) … +1 (easy). */
  polarity: number;
  /** 0 … 1, how strongly the system is speaking today. */
  intensity: number;
  /** Plain-English headline: what to do today. */
  headline: string;
  /** Plain-English why, one or two sentences. */
  body: string;
  /** The tradition's own term for today, shown in small print (e.g. "Chandrashtama"). */
  term: string;
  /** Short technical basis, e.g. "Tara: Sadhana (6)". */
  basis: string;
}

export interface CouncilReading {
  date: string;
  score: number;
  headline: string;
  majority: Advice;
  agreeCount: number;
  agreeText: string;
  holdoutText: string | null;
  systems: (SystemSignal & { agrees: boolean; why?: string })[];
}
