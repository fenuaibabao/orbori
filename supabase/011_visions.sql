-- 011: Cosmic Visions. Images live in a private storage bucket; only the server writes them.
insert into storage.buckets (id, name, public) values ('visions', 'visions', false) on conflict (id) do nothing;

create table if not exists public.visions (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null,
  note        text,
  path        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists visions_user on public.visions (user_id, created_at desc);

alter table public.visions enable row level security;
drop policy if exists "own visions" on public.visions;
create policy "own visions" on public.visions for select using (auth.uid() = user_id);
