alter table public.profiles
  add column if not exists xp integer not null default 0;

alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');
