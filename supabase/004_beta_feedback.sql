-- Feedback from inside the app, and beta testers who joined through the tester link.
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  email       text,
  page        text,
  message     text not null check (char_length(message) between 1 and 4000),
  created_at  timestamptz not null default now()
);
alter table public.feedback enable row level security;
-- Written and read only by the server (service role); no public policies.

alter table public.subscriptions add column if not exists note text;
