-- 009: a week of Plus that Oracles can gift to a friend (one gift per year).
create table if not exists public.plus_gifts (
  code         text primary key,
  from_user    uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  redeemed_by  uuid references auth.users (id) on delete set null,
  redeemed_at  timestamptz
);
create index if not exists plus_gifts_from on public.plus_gifts (from_user);

alter table public.plus_gifts enable row level security;

drop policy if exists "see own gifts" on public.plus_gifts;
create policy "see own gifts" on public.plus_gifts for select using (auth.uid() = from_user);
