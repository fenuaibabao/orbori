// Render an Orbori reel: node render.mjs <out.mp4> '<json data>' [template.html]
// Frames are drawn by the template's render(t) and captured one by one, then
// encoded with ffmpeg along with a soft generated soundtrack (or --audio file).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [out, json, tpl = path.join(here, 'sky-reel.html')] = process.argv.slice(2);
const audioArg = process.argv.find((a) => a.startsWith('--audio='))?.slice(8);
const FPS = 30;
const fonts = path.join(here, '..', '..', 'node_modules', '@fontsource');
const dir = mkdtempSync(path.join(tmpdir(), 'reel-'));
const page = path.join(dir, 'page.html');
writeFileSync(page, readFileSync(tpl, 'utf8').replaceAll('FONTS/', `file://${fonts}/`));

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(`file://${page}#${encodeURIComponent(json)}`);
await p.evaluate(() => document.fonts.ready);
const duration = await p.evaluate(() => window.DURATION);
const n = Math.round(duration * FPS);
for (let i = 0; i < n; i++) {
  await p.evaluate((t) => window.render(t), i / FPS);
  await p.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) });
}
const cues = await p.evaluate(() => window.CUES || []);
await b.close();

// Soundtrack: a slow shimmering pad plus a soft chime as each voice lights up.
let audio = audioArg;
if (!audio) {
  audio = path.join(dir, 'a.wav');
  const notes = [659.25, 739.99, 880, 987.77, 1108.73, 1318.51, 1479.98];
  const inputs = [], filters = [];
  [110, 164.81, 220, 277.18, 329.63].forEach((f, i) => {
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=${f}:duration=${duration}`);
    filters.push(`[${i}]volume=${i < 2 ? 0.16 : 0.08},tremolo=f=${0.15 + i * 0.07}:d=0.5[p${i}]`);
  });
  cues.forEach((t, j) => {
    const k = 5 + j;
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=${notes[j % notes.length]}:duration=1.6`);
    filters.push(`[${k}]volume=0.22,afade=t=in:d=0.01,afade=t=out:st=0.05:d=1.5,adelay=${Math.round(t * 1000)}:all=1[c${j}]`);
  });
  const labels = [...[0, 1, 2, 3, 4].map((i) => `[p${i}]`), ...cues.map((_, j) => `[c${j}]`)].join('');
  filters.push(`${labels}amix=inputs=${5 + cues.length}:normalize=0,lowpass=f=5000,aecho=0.8:0.7:400|700:0.3|0.2,afade=t=in:d=1.2,afade=t=out:st=${duration - 1.8}:d=1.8,volume=0.9[a]`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[a]', '-t', String(duration), '-ar', '44100', audio]);
}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.png'), '-i', audio,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '20', '-preset', 'medium', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out]);
rmSync(dir, { recursive: true, force: true });
console.log(`wrote ${out} (${duration}s, ${n} frames)`);
