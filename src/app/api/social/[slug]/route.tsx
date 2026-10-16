import { ImageResponse } from 'next/og';
import { skyToday } from '@/lib/sky';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

/**
 * Instagram posts (1080×1350), drawn by Orbori. The launch set is /api/social/1 … /9;
 * the daily post is /api/social/sky?date=YYYY-MM-DD ("the sky today, seven ways").
 */
const W = 1080, H = 1350;
const C = { space: '#060528', night: '#161240', deep: '#0D0A35', royal: '#343E9F', line: '#2E2A6E', star: '#ECE8F4', muted: '#B7B2D8', dim: '#9C97C2', gold: '#A2752C', goldLite: '#D4A24C', mauve: '#C9A3A6' };
const ff = (pkg: string, file: string) => readFile(path.join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 700 | 800 }[]> | null = null;
const loadFonts = () => (fonts ??= Promise.all([
  ff('syne', 'syne-latin-700-normal.woff').then((data) => ({ name: 'Syne', data, weight: 700 as const })),
  ff('syne', 'syne-latin-800-normal.woff').then((data) => ({ name: 'Syne', data, weight: 800 as const })),
  ff('syne', 'syne-latin-ext-800-normal.woff').then((data) => ({ name: 'Syne', data, weight: 800 as const })),
  ff('inter', 'inter-latin-400-normal.woff').then((data) => ({ name: 'Inter', data, weight: 400 as const })),
  ff('inter', 'inter-latin-ext-400-normal.woff').then((data) => ({ name: 'InterExt', data, weight: 400 as const })),
  ff('inter', 'inter-latin-600-normal.woff').then((data) => ({ name: 'Inter', data, weight: 600 as const })),
  ff('inter', 'inter-latin-ext-600-normal.woff').then((data) => ({ name: 'InterExt', data, weight: 600 as const })),
  ff('space-mono', 'space-mono-latin-400-normal.woff').then((data) => ({ name: 'Space Mono', data, weight: 400 as const })),
  ff('space-mono', 'space-mono-latin-700-normal.woff').then((data) => ({ name: 'Space Mono', data, weight: 700 as const })),
]));

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect x="49" y="58" width="22" height="48" rx="11" fill={C.star} />
      <circle cx="45" cy="40" r="12" fill={C.gold} /><circle cx="75" cy="40" r="12" fill={C.gold} fillOpacity="0.85" /><circle cx="60" cy="31" r="12" fill={C.goldLite} fillOpacity="0.92" />
    </svg>
  );
}

const STARS = [[6, 5], [88, 4], [72, 13], [14, 22], [94, 30], [4, 44], [83, 52], [9, 71], [91, 76], [68, 88], [27, 93], [52, 7], [40, 97]];
function Frame({ eyebrow, children, footer = 'orbori.app · where the stars agree' }: { eyebrow: string; children: React.ReactNode; footer?: string }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '84px 84px 72px', background: C.space, color: C.star, fontFamily: 'Inter, InterExt', position: 'relative' }}>
      {STARS.map(([x, y], i) => <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 5, height: 5, borderRadius: 3, background: i % 3 === 0 ? C.goldLite : i % 3 === 1 ? C.mauve : C.star, opacity: 0.8 }} />)}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}><Mark size={58} /><span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 40, letterSpacing: -1, marginLeft: 6 }}>orbori</span></div>
        <span style={{ fontFamily: 'Space Mono', fontSize: 22, letterSpacing: 5, color: C.goldLite }}>{eyebrow}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>{children}</div>
      <span style={{ fontFamily: 'Space Mono', fontSize: 22, color: C.dim }}>{footer}</span>
    </div>
  );
}
const Big = ({ children, size = 96 }: { children: React.ReactNode; size?: number }) => <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: -2 }}>{children}</span>;
const Body = ({ children }: { children: React.ReactNode }) => <span style={{ fontSize: 36, lineHeight: 1.4, color: C.muted, marginTop: 36 }}>{children}</span>;

const TRADITIONS = [
  ['Western', 'Sun, Moon, Rising and every planet'], ['Vedic', 'Jyotish: nakshatras and your Dasha'], ['Chinese', 'Four Pillars: year, month, day, hour'],
  ['Numerology', 'Life Path and the numbers of your name'], ['Mayan', 'The K\'iche\' Chol Q\'ij: your nawal'], ['Hawaiian', 'Kaulana Mahina: your moon night'],
  ['Islamic', 'Lunar mansions and Abjad'],
] as const;

function Moon({ night, size }: { night: number; size: number }) {
  const p = (night - 0.5) / 30, k = Math.cos(2 * Math.PI * p), waxing = p < 0.5, r = 40, rx = Math.abs(k) * r;
  const inner = k > 0 ? (waxing ? 0 : 1) : (waxing ? 1 : 0);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="#1b1846" stroke={C.line} />
      <path d={`M 50 10 A 40 40 0 0 ${waxing ? 1 : 0} 50 90 A ${rx} 40 0 0 ${inner} 50 10 Z`} fill={C.star} />
    </svg>
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const q = new URL(req.url).searchParams;
  let node: React.ReactNode;

  switch (slug) {
    case '1': node = (
      <Frame eyebrow="HELLO">
        <Big size={120}>Seven traditions.</Big><Big size={120}>One sky.</Big>
        <Body>Orbori reads your birth chart through seven of the world&apos;s great sky traditions, side by side, every day.</Body>
      </Frame>); break;
    case '2': node = (
      <Frame eyebrow="THE COSMIC COUNCIL">
        <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 260, color: C.goldLite, lineHeight: 1 }}>8.4</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 44, marginTop: 8 }}>Convergence Score</span>
        <Body>Every day, seven voices weigh in on your day. The score is how much they agree. Where they agree, lean in. Where they don&apos;t, that&apos;s worth knowing too.</Body>
      </Frame>); break;
    case '3': node = (
      <Frame eyebrow="THE SEVEN">
        <Big size={78}>Meet the Council</Big>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
          {TRADITIONS.map(([n, d]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'baseline', marginTop: 20 }}>
              <span style={{ width: 300, fontFamily: 'Syne', fontWeight: 700, fontSize: 40, color: C.goldLite }}>{n}</span>
              <span style={{ flex: 1, fontSize: 30, color: C.muted }}>{d}</span>
            </div>
          ))}
        </div>
      </Frame>); break;
    case '4': node = (
      <Frame eyebrow="CHOL Q'IJ">
        <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: 'Space Mono', fontWeight: 700, color: C.goldLite }}>
          <span style={{ fontSize: 150 }}>13</span><span style={{ fontSize: 70, margin: '0 24px', color: C.dim }}>×</span><span style={{ fontSize: 150 }}>20</span><span style={{ fontSize: 70, margin: '0 24px', color: C.dim }}>=</span><span style={{ fontSize: 150 }}>260</span>
        </div>
        <Big size={70}>Thirteen tones. Twenty nawales. One sacred count.</Big>
        <Body>The Chol Q&apos;ij is still kept by K&apos;iche&apos; day-keepers in Guatemala today. Orbori uses its K&apos;iche&apos; names and follows the count they keep. What&apos;s your nawal?</Body>
      </Frame>); break;
    case '5': node = (
      <Frame eyebrow="KAULANA MAHINA">
        <div style={{ display: 'flex', justifyContent: 'center' }}><Moon night={16} size={380} /></div>
        <Big size={84}>Thirty nights. Thirty names.</Big>
        <Body>The Hawaiian moon calendar names every night of the month, from Hilo to Muku. The night you were born has a name too.</Body>
      </Frame>); break;
    case '6': node = (
      <Frame eyebrow="YOUR SIGIL">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width="460" height="460" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="95" fill="none" stroke={C.goldLite} strokeWidth="2" /><circle cx="100" cy="100" r="76" fill="none" stroke={C.mauve} strokeWidth="1.2" />
            <polygon points="100,30 166.6,78.4 141.1,156.6 58.9,156.6 33.4,78.4" fill="none" stroke={C.goldLite} strokeWidth="4" strokeLinejoin="round" />
            <circle cx="100" cy="100" r="12" fill={C.gold} /><circle cx="153.7" cy="153.7" r="5" fill={C.star} />
          </svg>
        </div>
        <Big size={84}>No two skies are the same.</Big>
        <Body>Everyone on Orbori gets a sigil drawn from their own chart. Wear it as a wallpaper, or take it to your tattoo artist.</Body>
      </Frame>); break;
    case '7': node = (
      <Frame eyebrow="FOUNDING 111">
        <Big size={150}>111</Big>
        <Big size={72}>founding members.</Big>
        <Body>When Orbori opens, the first 111 people to go yearly get their first year half off, and a Founding Member badge that stays forever. Follow along so you don&apos;t miss it.</Body>
      </Frame>); break;
    case '8': node = (
      <Frame eyebrow="STARGAZER → CELESTIAL">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {['Stargazer', 'Seer', 'Mystic', 'Oracle', 'Celestial'].map((l, i) => (
            <span key={l} style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 92, lineHeight: 1.05, color: i === 4 ? C.goldLite : C.star, opacity: 0.45 + i * 0.14 }}>{l}</span>
          ))}
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 92, lineHeight: 1.05, color: C.dim }}>?</span>
        </div>
        <Body>Check in nightly, journal, play, learn. Every level unlocks something. And the sky doesn&apos;t end at Celestial.</Body>
      </Frame>); break;
    case '9': node = (
      <Frame eyebrow="FROM THE FOUNDER">
        <span style={{ fontSize: 46, lineHeight: 1.45 }}>&ldquo;I kept noticing that the world&apos;s oldest ways of reading time don&apos;t argue as much as people think. On the good days, they say the same thing. So I built a place where you can hear all of them at once.&rdquo;</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 40, color: C.goldLite, marginTop: 44 }}>— Endaoism, founder of Orbori</span>
      </Frame>); break;
    case 'sky': {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get('date') ?? '') ? q.get('date')! : new Date().toISOString().slice(0, 10);
      const rows = skyToday(date);
      const pretty = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
      node = (
        <Frame eyebrow="THE SKY TODAY">
          <Big size={76}>{pretty}</Big>
          <span style={{ fontSize: 32, color: C.muted, marginTop: 14 }}>Seven traditions, one day.</span>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40 }}>
            {rows.map(([n, v]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'baseline', marginTop: 22, paddingBottom: 18, borderBottom: `1px solid ${C.line}` }}>
                <span style={{ width: 280, fontFamily: 'Space Mono', fontSize: 26, letterSpacing: 3, color: C.goldLite }}>{n.toUpperCase()}</span>
                <span style={{ flex: 1, fontFamily: 'Inter, InterExt', fontWeight: 600, fontSize: 38 }}>{v.replace(/\u02BF/g, '‘').replace(/\u02BE/g, '’')}</span>
              </div>
            ))}
          </div>
        </Frame>
      );
      break;
    }
    default: return new Response('Unknown post', { status: 404 });
  }
  const png = new ImageResponse(node as React.ReactElement, { width: W, height: H, fonts: await loadFonts() });
  // Instagram's publishing API only takes JPEGs.
  if (q.get('format') === 'jpg') {
    const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpg), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=3600' } });
  }
  return png;
}
