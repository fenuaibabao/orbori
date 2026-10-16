-- 010: the secret Celestial track.
-- Celestial numbers (the order people reached the top) and the opt-in Hall of the Sky.
create table if not exists public.celestials (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  number      integer generated always as identity unique,
  reached_at  timestamptz not null default now(),
  public      boolean not null default false
);
-- Ask the Council: one question a week.
create table if not exists public.ai_questions (
  user_id     uuid not null references auth.users (id) on delete cascade,
  week        text not null,
  question    text not null,
  answer      text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, week)
);
-- Monthly reflection on your own journal (opt-in, on request).
create table if not exists public.monthly_reflections (
  user_id     uuid not null references auth.users (id) on delete cascade,
  month       text not null,
  body        text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, month)
);
-- Shape Orbori: one vote per poll.
create table if not exists public.votes (
  user_id     uuid not null references auth.users (id) on delete cascade,
  poll        text not null,
  choice      text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, poll)
);
-- Daily questions written by Celestials, published after the owner approves them.
create table if not exists public.question_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  text         text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);
-- Gifts: a week (Oracle) or a month (each Seven Paths path finished).
alter table public.plus_gifts add column if not exists days integer not null default 7;

alter table public.celestials           enable row level security;
alter table public.ai_questions         enable row level security;
alter table public.monthly_reflections  enable row level security;
alter table public.votes                enable row level security;
alter table public.question_submissions enable row level security;

drop policy if exists "own celestial" on public.celestials;
create policy "own celestial" on public.celestials for select using (auth.uid() = user_id);
drop policy if exists "own questions" on public.ai_questions;
create policy "own questions" on public.ai_questions for select using (auth.uid() = user_id);
drop policy if exists "own reflections" on public.monthly_reflections;
create policy "own reflections" on public.monthly_reflections for select using (auth.uid() = user_id);
drop policy if exists "own votes" on public.votes;
create policy "own votes" on public.votes for select using (auth.uid() = user_id);
drop policy if exists "own submissions" on public.question_submissions;
create policy "own submissions" on public.question_submissions for select using (auth.uid() = user_id);
