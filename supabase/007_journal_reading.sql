-- 007: keep the day's reading with each journal entry.
alter table public.journal_entries add column if not exists reading jsonb;
