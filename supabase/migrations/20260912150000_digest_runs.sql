-- One row per weekly recap run. community_size is the "of N traders" figure
-- shown in the email; the cron drifts it gently week to week.

create table if not exists public.digest_runs (
  week_of date primary key,
  community_size integer not null,
  created_at timestamptz not null default now()
);

alter table public.digest_runs enable row level security;
-- No policies on purpose: service role only.
