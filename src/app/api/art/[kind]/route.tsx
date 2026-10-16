import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

/**
 * Free Cosmic Visions drawn by Orbori itself (no AI): a phone wallpaper and a
 * sigil tattoo flash sheet. GET /api/art/wallpaper|flash?seed=…&theme=…&sides=…
 */
const THEMES: Record<string, { bg: string; line: string; accent: string; dim: string }> = {
  night: { bg: '#060528', line: '#D4A24C', accent: '#957579', dim: '#343E9F' },
  dawn: { bg: '#1a0b24', line: '#F0A46A', accent: '#E0B3C0', dim: '#7a3a63' },
  moonlit: { bg: '#050b16', line: '#C9D6E6', accent: '#A9C6D4', dim: '#2f5277' },
  aurora: { bg: '#03140f', line: '#9EF0C8', accent: '#C3B8F5', dim: '#1f6f5c' },
};

const fontFile = (pkg: string, file: string) => readFile(path.join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));

function shape(seed: number, q: URLSearchParams) {
  const r = (n: number) => (seed >> n) & 7;
  const sides = Math.min(8, Math.max(3, Number(q.get('sides')) || 3 + (r(0) % 4)));
  const inner = q.has('inner') ? q.get('inner') === '1' : r(6) % 2 === 0;
  const ring = q.has('ring') ? q.get('ring') === '1' : r(12) % 2 === 0;
  const rot = (r(3) * 45 * Math.PI) / 180;
  const pts = (radius: number, offset: number) => Array.from({ length: sides }, (_, i) => {
    const a = rot + offset + (i * 2 * Math.PI) / sides - Math.PI / 2;
    return [100 + radius * Math.cos(a), 100 + radius * Math.sin(a)] as const;
  });
  return { sides, inner, ring, pts, dotA: (r(9) * Math.PI) / 4 };
}
const poly = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

function SigilArt({ seed, q, size, line, accent, weight = 4, style = 'line' }: { seed: number; q: URLSearchParams; size: number; line: string; accent: string; weight?: number; style?: 'line' | 'bold' | 'dots' | 'orbs' }) {
  const s = shape(seed, q);
  const outer = s.pts(70, 0);
  const innerPts = s.pts(70, Math.PI / s.sides);
  const dots = style === 'dots' ? outer.flatMap((a, i) => { const b = outer[(i + 1) % outer.length]; return Array.from({ length: 9 }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / 9, a[1] + ((b[1] - a[1]) * k) / 9] as const); }) : [];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="95" fill="none" stroke={line} strokeWidth={style === 'bold' ? weight * 1.4 : weight * 0.6} />
      {s.ring && <circle cx="100" cy="100" r="76" fill="none" stroke={accent} strokeWidth={weight * 0.4} />}
      {style === 'dots'
        ? dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={weight * 0.55} fill={line} />)
        : <polygon points={poly(outer)} fill="none" stroke={line} strokeWidth={style === 'bold' ? weight * 2 : weight} strokeLinejoin="round" />}
      {s.inner && <polygon points={poly(innerPts)} fill="none" stroke={accent} strokeWidth={weight * 0.6} strokeLinejoin="round" />}
      <circle cx="100" cy="100" r={style === 'bold' ? 16 : 12} fill={line} />
      {style === 'orbs'
        ? [[-22, 8], [0, -6], [22, 8]].map(([dx, dy], i) => <circle key={i} cx={100 + dx} cy={22 + dy} r="12" fill={line} fillOpacity={i === 1 ? 1 : 0.7} />)
        : <circle cx={100 + 76 * Math.cos(s.dotA)} cy={100 + 76 * Math.sin(s.dotA)} r={weight * 1.4} fill={line} />}
    </svg>
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const seed = Number(q.get('seed')) || 1;
  const t = THEMES[q.get('theme') ?? 'night'] ?? THEMES.night;
  const fonts = [
    { name: 'Space Mono', data: await fontFile('space-mono', 'space-mono-latin-700-normal.woff'), weight: 700 as const },
    { name: 'Syne', data: await fontFile('syne', 'syne-latin-800-normal.woff'), weight: 800 as const },
  ];

  if (kind === 'wallpaper') {
    const W = 1179, H = 2556;
    // Small seeded random (mulberry32) so each person's sky is their own.
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const vals = Array.from({ length: 300 }, next);
    const rnd = (k: number) => vals[k % vals.length];
    const stars = Array.from({ length: 90 }, (_, k) => ({ x: rnd(k * 3 + 1) * W, y: rnd(k * 3 + 2) * H, r: 1 + rnd(k * 3 + 3) * 3 }));
    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', background: t.bg, position: 'relative' }}>
          {stars.map((s, i) => <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: s.r, background: i % 5 === 0 ? t.line : '#ECE8F4', opacity: 0.35 + (s.r / 4) * 0.5 }} />)}
          <div style={{ display: 'flex', marginTop: 1050 }}>
            <SigilArt seed={seed} q={q} size={620} line={t.line} accent={t.accent} weight={3} style={q.get('style') === 'orbs' ? 'orbs' : 'line'} />
          </div>
          <span style={{ position: 'absolute', bottom: 150, fontFamily: 'Space Mono', fontWeight: 700, fontSize: 28, letterSpacing: 10, color: t.dim }}>ORBORI</span>
        </div>
      ),
      { width: W, height: H, fonts },
    );
  }

  if (kind === 'flash') {
    const W = 1600, ink = '#141218', paper = '#F4EFE6';
    const styles = [['line', 'FINE LINE'], ['bold', 'BOLD'], ['dots', 'DOTWORK'], ['orbs', 'WITH ORBS']] as const;
    return new ImageResponse(
      (
        <div style={{ width: W, height: W, display: 'flex', flexDirection: 'column', alignItems: 'center', background: paper, padding: 70 }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 56, color: ink, letterSpacing: -1 }}>Sigil flash</span>
          <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 22, color: '#6b6475', letterSpacing: 6, marginTop: 10 }}>{`ORBORI · NO. ${seed % 100000}`}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: 1360, marginTop: 50, justifyContent: 'space-between' }}>
            {styles.map(([st, label]) => (
              <div key={st} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 640, height: 640 }}>
                <SigilArt seed={seed} q={q} size={520} line={ink} accent={ink} weight={st === 'line' ? 2.5 : 3.5} style={st} />
                <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 22, color: '#6b6475', letterSpacing: 5, marginTop: 18 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      { width: W, height: W, fonts },
    );
  }
  return new Response('Unknown art', { status: 404 });
}
