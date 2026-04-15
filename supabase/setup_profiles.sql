-- =============================================================================
-- Tintomi: create `public.profiles` (run once in Supabase → SQL → New query)
-- =============================================================================
-- After this runs, refresh the app. Optional: also run `20260411180000_profiles_avatars.sql` for storage.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text unique,
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  avatar_url text,
  login_streak integer not null default 1,
  last_streak_date date,
  updated_at timestamptz not null default now()
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user is inserted (optional but recommended)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Sign-up precheck (email confirmation ON): existing user + profile row for this email.
create or replace function public.profile_exists_for_email(check_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    inner join public.profiles p on p.id = u.id
    where lower(u.email) = lower(trim(check_email))
      and nullif(trim(check_email), '') is not null
  );
$$;

revoke all on function public.profile_exists_for_email(text) from public;
grant execute on function public.profile_exists_for_email(text) to anon, authenticated;
