/**
 * Your constellation (a Celestial look): one star for every night you checked in,
 * placed by date, with streaks joined by faint lines. Nobody else's sky looks the same.
 */
export function SkyOfNights({ dates, className = '' }: { dates: string[]; className?: string }) {
  const sorted = [...dates].sort();
  const pos = (d: string) => {
    const n = Math.floor(Date.parse(`${d}T00:00:00Z`) / 86400000);
    const h = (k: number) => {
      let t = (n * 374761393 + k * 668265263) >>> 0;
      t = Math.imul(t ^ (t >>> 13), 1274126177);
      return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
    };
    return { x: 4 + h(1) * 92, y: 6 + h(2) * 88, r: 0.35 + h(3) * 0.55 };
  };
  const pts = sorted.map((d) => ({ d, ...pos(d) }));
  const lines: [typeof pts[number], typeof pts[number]][] = [];
  for (let i = 1; i < pts.length; i++) {
    const gap = (Date.parse(pts[i].d) - Date.parse(pts[i - 1].d)) / 86400000;
    if (gap === 1 && lines.length < 400) lines.push([pts[i - 1], pts[i]]);
  }
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <g transform="scale(1 0.6)">
        {lines.map(([a, b], i) => <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-gold)" strokeOpacity="0.25" strokeWidth="0.15" />)}
        {pts.map((p) => <circle key={p.d} cx={p.x} cy={p.y} r={p.r} fill="var(--color-starlight)" fillOpacity={0.5 + p.r * 0.5} />)}
      </g>
    </svg>
  );
}
