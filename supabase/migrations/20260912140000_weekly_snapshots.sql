-- One row per user per Sunday recap: lets next week's email report
-- "your return this week" and "rank moved up/down". Written only by the
-- weekly-digest cron with the service role; clients never read it.

create table if not exists public.weekly_snapshots (
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_of date not null,
  net_worth numeric(12, 2) not null,
  rank integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, week_of)
);

alter table public.weekly_snapshots enable row level security;
-- No policies on purpose: service role bypasses RLS, everyone else is denied.
