-- 012: vision credits (bought in packs, one per extra vision) and real image costs.
create table if not exists public.credit_ledger (
  id          text primary key,            -- Stripe checkout session id, or vision:<id> when spent
  user_id     uuid not null references auth.users (id) on delete cascade,
  delta       integer not null,
  reason      text,
  created_at  timestamptz not null default now()
);
create index if not exists credit_ledger_user on public.credit_ledger (user_id);
alter table public.credit_ledger enable row level security;
drop policy if exists "own credits" on public.credit_ledger;
create policy "own credits" on public.credit_ledger for select using (auth.uid() = user_id);

alter table public.visions add column if not exists model text;
alter table public.visions add column if not exists cost_usd numeric(8, 5);
alter table public.visions add column if not exists paid boolean not null default false;
