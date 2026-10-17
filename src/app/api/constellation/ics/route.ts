import { ADVICE_LABEL } from '@/lib/convergence';
import { addDays } from '@/lib/convergence';
import { currentUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** GET ?date=&adv=&name= → one Constellation Day as a calendar file. */
export async function GET(req: Request) {
  if (!(await currentUser())) return new Response('Sign in first.', { status: 401 });
  const q = new URL(req.url).searchParams;
  const date = q.get('date') ?? '';
  const adv = q.get('adv') ?? '';
  const name = (q.get('name') ?? 'Your constellation').replace(/[^\p{L}\p{N} .,'’&!-]/gu, '').slice(0, 32);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !ADVICE_LABEL[adv]) return new Response('Bad request.', { status: 400 });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Orbori//Constellation//EN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${date}-${adv}-constellation@orbori.app`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDays(date, 1).replace(/-/g, '')}`,
    `SUMMARY:${esc(`✦ Constellation Day: ${ADVICE_LABEL[adv]}`)}`,
    `DESCRIPTION:${esc(`Everyone in ${name} gets the same advice from their Cosmic Council today: ${ADVICE_LABEL[adv].toLowerCase()}. https://www.orbori.app/compatibility`)}`,
    'TRANSP:TRANSPARENT', 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc('Tomorrow is a Constellation Day ✦')}`, 'TRIGGER:-PT4H', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
  return new Response(ics, { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="orbori-constellation-${date}.ics"` } });
}
