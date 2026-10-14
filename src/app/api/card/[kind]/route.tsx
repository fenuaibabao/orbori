import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

const W = 1080;
const H = 1920;
const C = { space: '#060528', night: '#161240', deep: '#0D0A35', royal: '#343E9F', line: '#23205A', star: '#ECE8F4', muted: '#B7B2D8', dim: '#9C97C2', gold: '#A2752C', goldLite: '#D4A24C', mauve: '#957579' };

const fontFile = (pkg: string, file: string) => readFile(path.join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 700 | 800 }[]> | null = null;
const loadFonts = () =>
  (fonts ??= Promise.all([
    fontFile('syne', 'syne-latin-700-normal.woff').then((data) => ({ name: 'Syne', data, weight: 700 as const })),
    fontFile('syne', 'syne-latin-800-normal.woff').then((data) => ({ name: 'Syne', data, weight: 800 as const })),
    fontFile('syne', 'syne-latin-ext-800-normal.woff').then((data) => ({ name: 'Syne', data, weight: 800 as const })),
    fontFile('inter', 'inter-latin-400-normal.woff').then((data) => ({ name: 'Inter', data, weight: 400 as const })),
    fontFile('inter', 'inter-latin-600-normal.woff').then((data) => ({ name: 'Inter', data, weight: 600 as const })),
    fontFile('space-mono', 'space-mono-latin-400-normal.woff').then((data) => ({ name: 'Space Mono', data, weight: 400 as const })),
    fontFile('space-mono', 'space-mono-latin-700-normal.woff').then((data) => ({ name: 'Space Mono', data, weight: 700 as const })),
  ]));

const clean = (v: string | null, max = 40) => (v ?? '').replace(/[^\p{L}\p{N} .,'%/·-]/gu, '').slice(0, max);

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', fontFamily: 'Syne', fontWeight: 800, fontSize: 96, letterSpacing: -3, color: C.star, lineHeight: 1 }}>
      <span>orbor</span>
      <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="44" height="28" viewBox="0 0 26 16" style={{ position: 'absolute', top: -6, left: -10 }}>
          <circle cx="7" cy="9" r="5.5" fill="#A2752C" /><circle cx="13" cy="6" r="5.5" fill="#D4A24C" fillOpacity="0.9" /><circle cx="19" cy="9" r="5.5" fill="#A2752C" fillOpacity="0.85" />
        </svg>
        <span>ı</span>
      </div>
    </div>
  );
}

function Sigil({ seed, size }: { seed: number; size: number }) {
  const r = (n: number) => (seed >> n) & 7;
  const sides = 3 + (r(0) % 4);
  const rot = (r(3) * 45 * Math.PI) / 180;
  const poly = (offset: number) => Array.from({ length: sides }, (_, i) => {
    const a = rot + offset + (i * 2 * Math.PI) / sides - Math.PI / 2;
    return `${(20 + 14 * Math.cos(a)).toFixed(2)},${(20 + 14 * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="19" fill={C.deep} stroke={C.royal} />
      <polygon points={poly(0)} fill="none" stroke={C.goldLite} strokeWidth="1.5" />
      {r(6) % 2 === 0 && <polygon points={poly(Math.PI / sides)} fill="none" stroke={C.mauve} strokeWidth="1" />}
      <circle cx="20" cy="20" r="3" fill={C.gold} />
    </svg>
  );
}

function Footer({ handle, seed, big3, cta }: { handle: string; seed: number; big3: string; cta: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px 40px', borderRadius: 60, background: C.night }}>
        <Sigil seed={seed} size={72} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 34 }}>{handle}</span>
          <span style={{ fontFamily: 'Space Mono', fontSize: 22, color: C.muted, marginTop: 4 }}>{big3}</span>
        </div>
      </div>
      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 40, marginTop: 44 }}>Where the stars agree.</span>
      <span style={{ fontFamily: 'Inter', fontSize: 28, color: C.goldLite, marginTop: 12 }}>{cta}</span>
    </div>
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const handle = clean(q.get('handle'), 30) || 'A Cosmic Stranger';
  const seed = Number(q.get('seed')) || 1;
  const big3 = clean(q.get('big3'), 60).toUpperCase();

  let body: React.ReactNode;
  let cta = 'Find yours at orbori';

  if (kind === 'rarity') {
    const tier = (['Common', 'Uncommon', 'Rare', 'Mythic'].includes(q.get('tier') ?? '') ? q.get('tier')! : 'Rare').toUpperCase();
    const share = clean(q.get('share'), 10);
    const combo = clean(q.get('combo'), 80).toUpperCase();
    cta = 'How rare is yours? Find out on Orbori';
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Space Mono', fontSize: 30, letterSpacing: 4, color: C.goldLite }}>MY CHART RARITY</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 560, height: 560, marginTop: 40, position: 'relative' }}>
          <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: 260, border: `2px solid ${C.line}` }} />
          <div style={{ position: 'absolute', width: 440, height: 440, borderRadius: 220, border: `2px solid ${C.gold}` }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 380, height: 380, borderRadius: 190, background: C.night, border: `5px solid ${C.goldLite}` }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: Math.min(74, 300 / (tier.length * 1.15)), color: C.goldLite, letterSpacing: 2 }}>{tier}</span>
          </div>
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 72, marginTop: 50, textAlign: 'center', lineHeight: 1.1 }}>Only {share} of people</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 72, textAlign: 'center', lineHeight: 1.1 }}>share my combo.</span>
        <span style={{ fontFamily: 'Space Mono', fontSize: 26, color: C.muted, marginTop: 36 }}>{combo}</span>
      </div>
    );
  } else if (kind === 'score') {
    const score = clean(q.get('score'), 4);
    const headline = clean(q.get('headline'), 70);
    const date = clean(q.get('date'), 20).toUpperCase();
    const agree = clean(q.get('agree'), 2);
    cta = "What's your score today? Find out on Orbori";
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Space Mono', fontSize: 30, letterSpacing: 4, color: C.goldLite }}>{`TODAY'S COSMIC COUNCIL · ${date}`}</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 40, fontFamily: 'Space Mono', fontWeight: 700, color: C.goldLite, lineHeight: 1 }}>
          <span style={{ fontSize: 300 }}>{score}</span>
          <span style={{ fontSize: 76, color: C.dim, marginBottom: 30 }}>/10</span>
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 44, marginTop: 10 }}>Convergence Score</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 74, marginTop: 80, textAlign: 'center', lineHeight: 1.1, maxWidth: 860 }}>{headline}</span>
        <span style={{ fontFamily: 'Inter', fontSize: 32, color: C.muted, marginTop: 40 }}>{`${agree} of 5 astrology systems agree today.`}</span>
      </div>
    );
  } else {
    return new Response('Unknown card', { status: 404 });
  }

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '120px 96px 110px', background: C.space, color: C.star, fontFamily: 'Inter', position: 'relative' }}>
        {[[8, 6, C.goldLite], [86, 9, C.mauve], [70, 20, C.star], [12, 38, C.mauve], [92, 52, C.goldLite], [6, 70, C.star], [80, 80, C.mauve], [30, 94, C.goldLite]].map(([x, y, c], i) => (
          <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 6, height: 6, borderRadius: 3, background: c as string }} />
        ))}
        <Wordmark />
        {body}
        <Footer handle={handle} seed={seed} big3={big3} cta={cta} />
      </div>
    ),
    { width: W, height: H, fonts: await loadFonts(), headers: { 'cache-control': 'public, max-age=86400' } },
  );
}
