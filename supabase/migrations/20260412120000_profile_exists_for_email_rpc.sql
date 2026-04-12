-- Allow anonymous sign-up flow to detect existing accounts (email confirmation ON)
-- by checking auth.users + public.profiles. Callable only via this RPC (no row data exposed).

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
