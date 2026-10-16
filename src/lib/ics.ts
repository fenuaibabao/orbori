/** A tiny iCalendar writer for all-day Orbori events. */
import { ADVICE_LABEL, addDays, glowSummary, type GlowDay } from './convergence';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
/** Lines over 75 bytes are folded, as the format requires. */
function fold(line: string): string {
  const out: string[] = []; let cur = '';
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 74) { out.push(cur); cur = ' ' + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n');
}
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

export function glowEvent(g: GlowDay, uidSeed: string): string[] {
  const title = g.n === 7 ? `✦✦ Orbori Convergence: ${ADVICE_LABEL[g.adv]}` : `✦ Orbori Alignment: ${ADVICE_LABEL[g.adv]}`;
  const desc = `${g.head}\n\n${glowSummary(g)}\n\n${g.agree}\n\nSee the full Council: https://www.orbori.app/convergence`;
  return [
    'BEGIN:VEVENT',
    `UID:${g.d}-${uidSeed}@orbori.app`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${g.d.replace(/-/g, '')}`,
    `DTEND;VALUE=DATE:${addDays(g.d, 1).replace(/-/g, '')}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(desc)}`,
    'URL:https://www.orbori.app/convergence',
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(g.n === 7 ? 'Tomorrow is a Convergence day ✦' : 'Tomorrow is an Alignment day ✦')}`,
    'TRIGGER:-PT4H',
    'END:VALARM',
    'END:VEVENT',
  ];
}

export function calendar(name: string, events: string[][]): string {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Orbori//Convergence//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`, 'X-WR-CALDESC:The days the Cosmic Council agrees\\, from orbori.app',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H',
    ...events.flat(), 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}
