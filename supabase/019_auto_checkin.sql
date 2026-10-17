-- Opening Orbori now checks you in. 'seen' = checked in by opening the app (no rating).
alter table public.check_ins drop constraint if exists check_ins_answer_check;
alter table public.check_ins add constraint check_ins_answer_check check (answer in ('nailed', 'kinda', 'nope', 'seen'));
