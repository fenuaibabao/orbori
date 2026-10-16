/** Deterministic geometric sigil avatar from a seed. */
export interface SigilCustom { sides: number; inner: boolean; ring: boolean; line: string; accent: string }

/** Deterministic sigil from a seed; Celestials can override its shape and colors (`custom`). */
export function Sigil({ seed, size = 40, className = '', label, custom }: { seed: number; size?: number; className?: string; label?: string; custom?: SigilCustom | null }) {
  const r = (n: number) => (seed >> n) & 7;
  const sides = custom?.sides ?? 3 + (r(0) % 4); // 3–6 (custom: 3–8)
  const rot = (r(3) * 45 * Math.PI) / 180;
  const inner = custom ? custom.inner : r(6) % 2 === 0;
  const line = custom?.line ?? '#D4A24C';
  const accent = custom?.accent ?? '#957579';
  const ring = custom ? custom.ring : r(12) % 2 === 0;
  const poly = (radius: number, offset: number) =>
    Array.from({ length: sides }, (_, i) => {
      const a = rot + offset + (i * 2 * Math.PI) / sides - Math.PI / 2;
      return `${(20 + radius * Math.cos(a)).toFixed(2)},${(20 + radius * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
  const dotA = (r(9) * Math.PI) / 4;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="20" cy="20" r="19" fill="#0D0A35" stroke="#343E9F" />
      {ring && <circle cx="20" cy="20" r="15" fill="none" stroke={custom ? accent : '#A2752C'} strokeWidth="0.6" />}
      <polygon points={poly(14, 0)} fill="none" stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
      {inner && <polygon points={poly(14, Math.PI / sides)} fill="none" stroke={accent} strokeWidth="1" strokeLinejoin="round" />}
      <circle cx="20" cy="20" r="3" fill="#A2752C" />
      <circle cx={20 + 15 * Math.cos(dotA)} cy={20 + 15 * Math.sin(dotA)} r="1.6" fill="#ECE8F4" />
    </svg>
  );
}
