-- 014: Instagram autopilot. A queue of posts published through Instagram's API, and the settings it needs.
-- Server-only tables (row-level security on, no policies).
create table if not exists public.social_posts (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null,                -- 'launch' or 'sky'
  slug          text not null,                -- launch post number, or the date of a sky post
  scheduled_at  timestamptz,                  -- null while held
  status        text not null default 'scheduled' check (status in ('scheduled', 'held', 'publishing', 'posted', 'failed', 'canceled')),
  caption       text not null,
  attempts      integer not null default 0,
  ig_media_id   text,
  error         text,
  posted_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (kind, slug)
);
create table if not exists public.social_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);
alter table public.social_posts    enable row level security;
alter table public.social_settings enable row level security;

-- The launch posts (times in UTC = Pacific + 7 hours). Founding 111 is held until paid plans open.
insert into public.social_posts (kind, slug, scheduled_at, status, caption) values
  ('launch', '1', '2026-10-16T18:30:00Z', 'scheduled', 'Most astrology apps speak one language. Orbori listens to seven: Western, Vedic, Chinese, numerology, the K''iche'' Chol Q''ij, the Hawaiian moon calendar and the Islamic lunar mansions. Every day they weigh in on your day, side by side. ✦ Map your sky free at the link in bio.

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope'),
  ('launch', '2', '2026-10-16T18:35:00Z', 'scheduled', 'Every day you get a Convergence Score out of 10: how much the seven traditions agree about your day. High score, lean in. Low score, the holdouts are worth hearing. What would yours be today? Link in bio.

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope'),
  ('launch', '3', '2026-10-16T18:40:00Z', 'scheduled', 'Seven voices, one chart. Here''s who sits on your Council and what each one reads. Which one do you trust most? Tell us below. ↓

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope'),
  ('launch', '4', '2026-10-17T17:30:00Z', 'scheduled', 'Thirteen tones and twenty nawales make the 260-day Chol Q''ij, still kept by K''iche'' day-keepers in Guatemala. Orbori uses its K''iche'' names and follows their count. Your birthday falls on one of the 260 days. Find your nawal at the link in bio.

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope'),
  ('launch', '5', '2026-10-19T02:00:00Z', 'scheduled', 'In the Hawaiian moon calendar, every night of the month has its own name, from Hilo, the first sliver, to Māhealani, the fullest. Tonight has a name. So does the night you were born. 🌕

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope'),
  ('launch', '6', '2026-10-19T19:00:00Z', 'scheduled', 'Everyone on Orbori gets a sigil drawn from their own chart. Set it as your lock screen, or take the tattoo flash to your artist. Get yours at the link in bio.

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope'),
  ('launch', '8', '2026-10-20T19:00:00Z', 'scheduled', 'Check in nightly, journal, play, learn. Stargazer, Seer, Mystic, Oracle, Celestial: every level unlocks something. And the sky doesn''t end at Celestial. That''s all we''ll say. ✦

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope'),
  ('launch', '9', '2026-10-22T01:30:00Z', 'scheduled', 'Why Orbori exists, in one sentence. Thank you for being here at the very beginning. — Endaoism

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope'),
  ('launch', '7', null, 'held', 'When Orbori opens, the first 111 people to go yearly get their first year half off and a Founding Member badge that never goes away. Follow @orbori.app and turn on notifications so you hear first.

#astrology #birthchart #zodiac #numerology #vedicastrology #chineseastrology #moonphases #dailyhoroscope')
on conflict (kind, slug) do nothing;

-- A private secret so only the scheduler can run the autopilot.
insert into public.social_settings (key, value) values ('cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')) on conflict (key) do nothing;

-- Every 5 minutes the database calls the autopilot.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('orbori-social') where exists (select 1 from cron.job where jobname = 'orbori-social');
select cron.schedule('orbori-social', '*/5 * * * *', $job$
  select net.http_get(
    url := 'https://www.orbori.app/api/social-run',
    headers := jsonb_build_object('x-cron-secret', (select value from public.social_settings where key = 'cron_secret')),
    timeout_milliseconds := 110000
  );
$job$);
