-- 006: private journal, one entry per person per day. Only the owner can read or write it.
create table if not exists public.journal_entries (
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  text        text not null default '',
  prompt      text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.journal_entries enable row level security;

drop policy if exists "own journal" on public.journal_entries;
create policy "own journal" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
