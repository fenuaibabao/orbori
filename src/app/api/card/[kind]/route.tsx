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
    const pct = clean(q.get('pct'), 14);
    const oneIn = clean(q.get('oneIn'), 12);
    const [line1, line2] = pct ? [`Only ${pct} of people`, 'have a chart this rare.'] : ['A classic combo.', `1 in ${oneIn} share it exactly.`];
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
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 68, marginTop: 50, textAlign: 'center', lineHeight: 1.1 }}>{line1}</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 68, textAlign: 'center', lineHeight: 1.1 }}>{line2}</span>
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
  } else if (kind === 'match') {
    const partner = clean(q.get('partner'), 24) || 'Someone';
    const pseed = Number(q.get('pseed')) || 2;
    const score = clean(q.get('score'), 4);
    const headline = clean(q.get('headline'), 70);
    const bars = (q.get('bars') ?? '').split(',').slice(0, 5).map((x) => Math.max(0, Math.min(10, Number(x) || 0)));
    const names = ['Western', 'Vedic', 'Chinese', 'Numerology', 'Mayan'];
    cta = 'Open the link to unlock your half';
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <span style={{ fontFamily: 'Space Mono', fontSize: 30, letterSpacing: 4, color: C.goldLite }}>COSMIC COMPATIBILITY</span>
        <div style={{ display: 'flex', marginTop: 40 }}>
          <Sigil seed={seed} size={150} />
          <div style={{ display: 'flex', marginLeft: -36 }}><Sigil seed={pseed} size={150} /></div>
        </div>
        <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 36, marginTop: 22 }}>{`${handle} + ${partner}`}</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 20, fontFamily: 'Space Mono', fontWeight: 700, color: C.goldLite, lineHeight: 1 }}>
          <span style={{ fontSize: 200 }}>{score}</span>
          <span style={{ fontSize: 64, color: C.dim, marginBottom: 22 }}>/10</span>
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 60, marginTop: 20, textAlign: 'center', lineHeight: 1.1, maxWidth: 880 }}>{headline}</span>
        <div style={{ display: 'flex', flexDirection: 'column', width: 760, marginTop: 40 }}>
          {bars.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: i ? 14 : 0 }}>
              <span style={{ width: 220, fontFamily: 'Inter', fontSize: 26 }}>{names[i]}</span>
              <div style={{ display: 'flex', flex: 1, height: 14, borderRadius: 7, background: C.line }}>
                <div style={{ width: `${v * 10}%`, height: 14, borderRadius: 7, background: C.gold }} />
              </div>
              <span style={{ width: 80, textAlign: 'right', fontFamily: 'Space Mono', fontSize: 26, color: C.goldLite }}>{v.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', height: 96, padding: '0 60px', marginTop: 44, borderRadius: 48, background: C.gold, color: C.space, fontFamily: 'Inter', fontWeight: 600, fontSize: 40 }}>
          {`${partner}: See your side →`}
        </div>
      </div>
    );
  } else if (kind === 'level') {
    const badge = clean(q.get('badge'), 30) || '7-Night Watch';
    const line = clean(q.get('line'), 90);
    const level = clean(q.get('level'), 12) || 'Seer';
    const levels = ['Stargazer', 'Seer', 'Mystic', 'Oracle', 'Celestial'];
    const li = Math.max(0, levels.indexOf(level));
    cta = 'Start your streak on Orbori';
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <span style={{ fontFamily: 'Space Mono', fontSize: 30, letterSpacing: 4, color: C.goldLite }}>LEVEL UP · NEW BADGE</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 400, height: 400, marginTop: 50, borderRadius: 200, border: `2px solid ${C.royal}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 300, height: 300, borderRadius: 150, background: '#221B45', border: `5px solid ${C.goldLite}` }}>
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke={C.goldLite} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z" />
            </svg>
          </div>
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 80, marginTop: 50, textAlign: 'center' }}>{badge}</span>
        <span style={{ fontFamily: 'Inter', fontSize: 36, color: C.muted, marginTop: 20, textAlign: 'center', maxWidth: 820, lineHeight: 1.4 }}>{line}</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 44, marginTop: 64 }}>{`Now a ${level}`}</span>
        <div style={{ display: 'flex', width: '100%', marginTop: 22 }}>
          {levels.map((l, i) => (
            <div key={l} style={{ display: 'flex', flex: 1, height: 72, marginLeft: i ? 12 : 0, alignItems: 'center', justifyContent: 'center', borderRadius: 20, border: `2px solid ${i === li ? C.goldLite : i < li ? '#5A4A30' : '#2E2A6E'}`, background: i === li ? C.gold : i < li ? '#2A2246' : 'transparent', color: i === li ? C.space : i < li ? C.goldLite : C.dim, fontFamily: 'Space Mono', fontWeight: 700, fontSize: 18 }}>
              {l.toUpperCase()}
            </div>
          ))}
        </div>
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
