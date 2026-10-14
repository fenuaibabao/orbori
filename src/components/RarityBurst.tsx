import type { RarityTier } from '@/lib/rarity';
import { Orbs } from './Logo';

/** Font size that keeps a tier word inside the medallion (Syne ExtraBold runs ~1.15em per letter). */
const tierSize = (tier: string, inner: number) => Math.min(inner * 0.2, (inner * 0.82) / (tier.length * 1.15));

export function RarityBurst({ tier, size = 280 }: { tier: RarityTier; size?: number }) {
  const s = size / 280;
  return (
    <div className="anim-rise relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="anim-spin-slow absolute inset-0" width={size} height={size} viewBox="0 0 280 280" aria-hidden="true">
        <g strokeWidth="1" strokeLinecap="round" opacity="0.75">
          <path stroke="#A2752C" d="M140 6v40M140 234v40M6 140h40M234 140h40M45 45l28 28M207 207l28 28M45 235l28-28M207 73l28-28" />
          <path stroke="#957579" d="M89 15l10 37M181 228l10 37M15 191l37-10M228 99l37-10M15 89l37 10M228 181l37 10M89 265l10-37M181 52l10-37" />
        </g>
      </svg>
      <div className="absolute rounded-full border border-gold" style={{ width: 196 * s, height: 196 * s }} />
      <div className="absolute rounded-full border-2 border-gold-lite bg-night" style={{ width: 170 * s, height: 170 * s }} />
      <div className="relative flex flex-col items-center gap-2">
        <Orbs style={{ width: 52 * s, height: 32 * s }} />
        <span className="font-display font-extrabold leading-none tracking-[0.02em] text-gold-lite" style={{ fontSize: tierSize(tier, 170 * s) }}>
          {tier.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export function TierLadder({ tier }: { tier: RarityTier }) {
  const tiers: RarityTier[] = ['Common', 'Uncommon', 'Rare', 'Mythic'];
  return (
    <div aria-label={`Rarity tiers; yours is ${tier}`} className="flex w-full gap-1.5">
      {tiers.map((t) => (
        <span key={t} className={`flex h-[34px] flex-1 items-center justify-center rounded-[10px] border font-mono text-[10px] font-bold tracking-[0.06em] ${t === tier ? 'border-gold-lite bg-gold text-space' : 'border-line-2 text-dim'}`}>
          {t.toUpperCase()}
        </span>
      ))}
    </div>
  );
}
