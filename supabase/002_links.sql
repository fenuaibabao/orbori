-- Connections between accounts (mutual links from accepted invites) and nudges.
-- Paste into the Supabase SQL editor and run once.

create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  a           uuid not null references auth.users (id) on delete cascade,
  b           uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint links_ordered check (a < b),
  unique (a, b)
);
create index if not exists links_a on public.links (a);
create index if not exists links_b on public.links (b);

create table if not exists public.nudges (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references auth.users (id) on delete cascade,
  to_user     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  created_at  timestamptz not null default now(),
  unique (from_user, to_user, date)
);
create index if not exists nudges_to on public.nudges (to_user, date);

alter table public.links  enable row level security;
alter table public.nudges enable row level security;

-- People can see their own links; links are created by the server when an invite is accepted.
drop policy if exists "see own links" on public.links;
create policy "see own links" on public.links for select using (auth.uid() = a or auth.uid() = b);
drop policy if exists "leave a link" on public.links;
create policy "leave a link" on public.links for delete using (auth.uid() = a or auth.uid() = b);

drop policy if exists "see own nudges" on public.nudges;
create policy "see own nudges" on public.nudges for select using (auth.uid() = to_user or auth.uid() = from_user);
