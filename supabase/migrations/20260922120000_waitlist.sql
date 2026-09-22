-- Email waitlist for the mobile app. Visitors add themselves from the landing
-- page; consent is recorded with the row so we can show when it was given.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Anonymous visitors may add themselves, and nothing else. No select policy
-- exists, so nobody can read the list back through the public API.
drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);
