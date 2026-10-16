-- 013: Founding 111 members, and The Cosmos (step one: Circles, crowd stats, reactions).

create table if not exists public.founding_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  number     integer generated always as identity unique,
  joined_at  timestamptz not null default now()
);
alter table public.founding_members enable row level security;
drop policy if exists "own founding" on public.founding_members;
create policy "own founding" on public.founding_members for select using (auth.uid() = user_id);

-- Circles each person belongs to (worked out from their chart by the server), and an opt-out.
alter table public.profiles add column if not exists circles text[] not null default '{}';
alter table public.profiles add column if not exists cosmos_opt_out boolean not null default false;
create index if not exists profiles_circles on public.profiles using gin (circles);

create table if not exists public.circle_reactions (
  user_id   uuid not null references auth.users (id) on delete cascade,
  circle    text not null,
  date      date not null,
  reaction  text not null check (reaction in ('comet', 'moon', 'fire')),
  primary key (user_id, circle, date)
);
alter table public.circle_reactions enable row level security;
drop policy if exists "own reactions" on public.circle_reactions;
create policy "own reactions" on public.circle_reactions for select using (auth.uid() = user_id);

-- Crowd stats for a set of Circles on a day, plus the week's check-ins. Server-only.
create or replace function public.cosmos_stats(keys text[], d date, week_start date)
returns table (circle text, members bigint, checked bigint, nailed bigint, kinda bigint, nope bigint, avg_score numeric, week_checkins bigint)
language sql stable security definer set search_path = public as $$
  select k,
    count(distinct p.user_id),
    count(c.user_id),
    count(c.user_id) filter (where c.answer = 'nailed'),
    count(c.user_id) filter (where c.answer = 'kinda'),
    count(c.user_id) filter (where c.answer = 'nope'),
    round(avg(c.score), 1),
    (select count(*) from check_ins w join profiles q on q.user_id = w.user_id
       where q.circles @> array[k] and not q.cosmos_opt_out and w.date between week_start and week_start + 6)
  from unnest(keys) k
  left join profiles p on p.circles @> array[k] and not p.cosmos_opt_out
  left join check_ins c on c.user_id = p.user_id and c.date = d
  group by k;
$$;
revoke all on function public.cosmos_stats(text[], date, date) from public, anon, authenticated;
grant execute on function public.cosmos_stats(text[], date, date) to service_role;
