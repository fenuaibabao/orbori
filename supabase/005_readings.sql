-- 005: AI daily readings. One per person per day, written by the server (service role).
create table if not exists public.readings (
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  body        text not null,
  model       text not null default '',
  created_at  timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.readings enable row level security;

drop policy if exists "read own readings" on public.readings;
create policy "read own readings" on public.readings
  for select using (auth.uid() = user_id);
