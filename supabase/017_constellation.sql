-- 017: Live Constellation. A name for your constellation, and a cached forecast of
-- Constellation Days (when everyone in it gets the same strong advice). Server-only tables.
create table if not exists public.constellations (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  updated_at  timestamptz not null default now()
);
create table if not exists public.constellation_cache (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  key          text not null,
  from_date    date not null,
  data         jsonb not null,
  computed_at  timestamptz not null default now()
);
alter table public.constellations      enable row level security;
alter table public.constellation_cache enable row level security;
