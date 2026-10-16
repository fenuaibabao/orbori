-- 008: one-time level rewards that are claimed (e.g. the Oracle month of Plus).
create table if not exists public.reward_claims (
  user_id     uuid not null references auth.users (id) on delete cascade,
  reward      text not null,
  claimed_at  timestamptz not null default now(),
  primary key (user_id, reward)
);

alter table public.reward_claims enable row level security;

drop policy if exists "see own claims" on public.reward_claims;
create policy "see own claims" on public.reward_claims for select using (auth.uid() = user_id);
