/** The moon as it looks on Hawaiian night n (1–30). */
export function Moon({ night, size = 120 }: { night: number; size?: number }) {
  const p = (night - 0.5) / 30;
  const k = Math.cos(2 * Math.PI * p);
  const waxing = p < 0.5;
  const r = 40, cx = 50, cy = 50, rx = Math.abs(k) * r;
  const crescent = k > 0;
  const outer = waxing ? 1 : 0;
  const inner = crescent ? (waxing ? 0 : 1) : (waxing ? 1 : 0);
  const lit = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${inner} ${cx} ${cy - r} Z`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`The moon on night ${night}`}>
      <circle cx={cx} cy={cy} r={r} fill="#1b1846" stroke="#2e2a6e" />
      <path d={lit} fill="#ECE8F4" />
    </svg>
  );
}
