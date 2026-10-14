-- Orbori database schema. Paste this whole file into the Supabase SQL editor and run it once.
-- Every table is protected by row-level security: people can only see and change their own rows.

create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  input       jsonb not null,
  city_label  text not null default '',
  seed        integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.check_ins (
  user_id  uuid not null references auth.users (id) on delete cascade,
  date     date not null,
  answer   text not null check (answer in ('nailed', 'kinda', 'nope')),
  score    numeric(3, 1) not null,
  primary key (user_id, date)
);

create table if not exists public.matches (
  id          text not null,
  user_id     uuid not null references auth.users (id) on delete cascade,
  nickname    text not null,
  input       jsonb not null,
  city_label  text not null default '',
  seed        integer not null,
  added_at    timestamptz not null default now(),
  primary key (user_id, id)
);

-- Written only by the Stripe webhook (service role). People can read their own row.
create table if not exists public.subscriptions (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  status                  text not null default 'none',
  plan                    text,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  updated_at              timestamptz not null default now()
);

alter table public.profiles      enable row level security;
alter table public.check_ins     enable row level security;
alter table public.matches       enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own check-ins" on public.check_ins;
create policy "own check-ins" on public.check_ins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own matches" on public.matches;
create policy "own matches" on public.matches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);
