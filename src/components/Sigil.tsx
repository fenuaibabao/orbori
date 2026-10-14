/** Deterministic geometric sigil avatar from a seed. */
export function Sigil({ seed, size = 40, className = '', label }: { seed: number; size?: number; className?: string; label?: string }) {
  const r = (n: number) => (seed >> n) & 7;
  const sides = 3 + (r(0) % 4); // 3–6
  const rot = (r(3) * 45 * Math.PI) / 180;
  const inner = r(6) % 2 === 0;
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
      {r(12) % 2 === 0 && <circle cx="20" cy="20" r="15" fill="none" stroke="#A2752C" strokeWidth="0.6" />}
      <polygon points={poly(14, 0)} fill="none" stroke="#D4A24C" strokeWidth="1.5" strokeLinejoin="round" />
      {inner && <polygon points={poly(14, Math.PI / sides)} fill="none" stroke="#957579" strokeWidth="1" strokeLinejoin="round" />}
      <circle cx="20" cy="20" r="3" fill="#A2752C" />
      <circle cx={20 + 15 * Math.cos(dotA)} cy={20 + 15 * Math.sin(dotA)} r="1.6" fill="#ECE8F4" />
    </svg>
  );
}
