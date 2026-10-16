-- 016: Convergence forecast. Server-only tables (row-level security on, no policies).
-- A cached year of glowing days per person (the forecast takes about a second to compute).
create table if not exists public.convergence_cache (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  key          text not null,          -- hash of birth details + time zone
  from_date    date not null,
  data         jsonb not null,
  computed_at  timestamptz not null default now()
);
-- A private calendar link per person, so calendar apps can subscribe.
create table if not exists public.calendar_feeds (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  token       text not null unique,
  time_zone   text not null default 'America/Los_Angeles',
  created_at  timestamptz not null default now()
);
alter table public.convergence_cache enable row level security;
alter table public.calendar_feeds   enable row level security;
