import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { currentUser, supabaseAdmin } from '@/lib/supabase/server';
import { VISION_KINDS } from '@/lib/visions';

export const runtime = 'nodejs';
export const maxDuration = 30;

const fontFile = (pkg: string, file: string) => readFile(path.join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));
/** The Orbori mark: the dotless i with three orbs. */
function Mark({ size, stem = '#F4EFE6' }: { size: number; stem?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect x="49" y="58" width="22" height="48" rx="11" fill={stem} />
      <circle cx="45" cy="40" r="12" fill="#A2752C" />
      <circle cx="75" cy="40" r="12" fill="#A2752C" fillOpacity="0.85" />
      <circle cx="60" cy="31" r="12" fill="#D4A24C" fillOpacity="0.92" />
    </svg>
  );
}

const clean = (s: string) => s.replace(/[^\p{L}\p{N} .,'’:;()&/·-]/gu, '').slice(0, 220);

/** GET ?id= → the vision as a JPEG with its story printed underneath (and in the file's description). */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  const user = await currentUser();
  if (!admin || !user) return new Response('Sign in first.', { status: 401 });
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const { data: v } = await admin.from('visions').select('kind, note, path, created_at').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!v) return new Response('Not found.', { status: 404 });
  const { data: file, error } = await admin.storage.from('visions').download(v.path);
  if (error || !file) return new Response('Could not load the image.', { status: 500 });

  const img = sharp(Buffer.from(await file.arrayBuffer()));
  const meta = await img.metadata();
  const W = meta.width ?? 1024, H = meta.height ?? 1536, BAND = 250;
  const title = VISION_KINDS.find((k) => k.id === v.kind)?.name ?? 'Cosmic Vision';
  const note = clean(v.note ?? '');
  const date = new Date(v.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const band = await new ImageResponse(
    (
      <div style={{ width: W, height: BAND, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 48px', background: '#060528', color: '#ECE8F4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Space Mono', fontSize: 18, letterSpacing: 4, color: '#D4A24C' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><Mark size={34} /><span style={{ marginLeft: 8 }}>ORBORI · COSMIC VISIONS</span></div><span>{date.toUpperCase()}</span>
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 40, marginTop: 10 }}>{title}</span>
        {note && <span style={{ fontFamily: 'Inter', fontSize: 22, lineHeight: 1.35, color: '#B7B2D8', marginTop: 8 }}>{note}</span>}
        <span style={{ fontFamily: 'Space Mono', fontSize: 16, color: '#9C97C2', marginTop: 12 }}>orbori.app · where the stars agree</span>
      </div>
    ),
    {
      width: W, height: BAND,
      fonts: [
        { name: 'Syne', data: await fontFile('syne', 'syne-latin-800-normal.woff'), weight: 800 },
        { name: 'Inter', data: await fontFile('inter', 'inter-latin-400-normal.woff'), weight: 400 },
        { name: 'Space Mono', data: await fontFile('space-mono', 'space-mono-latin-400-normal.woff'), weight: 400 },
      ],
    },
  ).arrayBuffer();

  // A small stamp in the corner of the picture, so the credit survives a crop of the caption.
  const SW = Math.round(W * 0.2), SH = Math.round(SW * 0.26);
  const stamp = await new ImageResponse(
    (
      <div style={{ width: SW, height: SH, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: SH / 2, background: 'rgba(6,5,40,0.55)', color: '#ECE8F4', fontFamily: 'Space Mono', fontSize: Math.round(SH * 0.42) }}>
        <Mark size={Math.round(SH * 0.85)} /><span style={{ marginLeft: 4 }}>orbori.app</span>
      </div>
    ),
    { width: SW, height: SH, fonts: [{ name: 'Space Mono', data: await fontFile('space-mono', 'space-mono-latin-400-normal.woff'), weight: 400 }] },
  ).arrayBuffer();

  const out = await sharp({ create: { width: W, height: H + BAND, channels: 3, background: '#060528' } })
    .composite([
      { input: await img.png().toBuffer(), top: 0, left: 0 },
      { input: Buffer.from(stamp), top: H - SH - Math.round(W * 0.025), left: W - SW - Math.round(W * 0.025) },
      { input: Buffer.from(band), top: H, left: 0 },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .withExif({ IFD0: { ImageDescription: `${title}. ${note}`.slice(0, 300), Artist: 'Orbori (orbori.app)', Copyright: 'Made with Orbori' } })
    .toBuffer();

  return new Response(new Uint8Array(out), {
    headers: { 'content-type': 'image/jpeg', 'content-disposition': `attachment; filename="orbori-${v.kind}-${id.slice(0, 6)}.jpg"`, 'cache-control': 'private, max-age=3600' },
  });
}
