-- Names friends see. friend_name: what you ask friends to call you (linked friends only, never the public Cosmos).
-- star_nicknames: a private nickname you give a friend; only you ever see it.
alter table public.profiles add column if not exists friend_name text
  check (friend_name is null or char_length(friend_name) between 1 and 24);

create table if not exists public.star_nicknames (
  owner      uuid not null references auth.users on delete cascade,
  friend     uuid not null references auth.users on delete cascade,
  nickname   text not null check (char_length(nickname) between 1 and 24),
  updated_at timestamptz not null default now(),
  primary key (owner, friend)
);
alter table public.star_nicknames enable row level security;
drop policy if exists "own nicknames" on public.star_nicknames;
create policy "own nicknames" on public.star_nicknames
  for all using (auth.uid() = owner) with check (auth.uid() = owner);
