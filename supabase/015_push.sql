-- 015: Nightly reminder notifications (Web Push). Server-only table (row-level security on, no policies).
create table if not exists public.push_subscriptions (
  endpoint      text primary key,
  user_id       uuid references auth.users(id) on delete cascade,
  p256dh        text not null,
  auth          text not null,
  remind_at     text not null default '20:00',   -- 'HH:MM' in the person's own time zone
  time_zone     text not null default 'America/Los_Angeles',
  last_sent_on  date,                            -- their local date of the last reminder
  failures      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;

-- Every 5 minutes the database asks the app to send any reminders that are due.
select cron.unschedule('orbori-push') where exists (select 1 from cron.job where jobname = 'orbori-push');
select cron.schedule('orbori-push', '*/5 * * * *', $job$
  select net.http_get(
    url := 'https://www.orbori.app/api/push-run',
    headers := jsonb_build_object('x-cron-secret', (select value from public.social_settings where key = 'cron_secret')),
    timeout_milliseconds := 60000
  );
$job$);
