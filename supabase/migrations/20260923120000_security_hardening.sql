-- =============================================================================
-- Security hardening
-- =============================================================================
-- Before this migration any signed-in user could run
--   update profiles set is_admin = true where id = auth.uid()
-- because anon/authenticated held table-wide UPDATE on public.profiles, and
-- could read every other user's stripe_customer_id via the
-- profiles_select_authenticated policy. RLS restricts rows, never columns, so
-- the fix is column-level privileges.

-- --- profiles: least-privilege column grants ---------------------------------
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;

-- Payment identifiers and email_opt_out are excluded: no client code reads them.
grant select (
  id, full_name, username, xp, avatar_url, login_streak, last_streak_date,
  is_pro, is_admin, referral_code, referred_by,
  completed_lessons, completed_stories, learn_streak, wallet,
  created_at, updated_at
) on table public.profiles to authenticated;

grant update (
  full_name, username, avatar_url, xp, login_streak, last_streak_date,
  completed_lessons, completed_stories, learn_streak, wallet
) on table public.profiles to authenticated;

grant insert (id, full_name, username, xp) on table public.profiles to authenticated;

-- --- Defence in depth --------------------------------------------------------
-- Column grants are the primary control. This trigger means a future GRANT
-- mistake still cannot hand out admin, Pro, or someone else's Stripe id.
-- It keys on current_user, not auth.uid(), so SECURITY DEFINER functions such
-- as redeem_referral (which legitimately sets referred_by) still work.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if current_user <> 'authenticated' and current_user <> 'anon' then
    return new;
  end if;
  new.is_admin               := old.is_admin;
  new.is_pro                 := old.is_pro;
  new.pro_since              := old.pro_since;
  new.stripe_customer_id     := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  new.referral_code          := old.referral_code;
  new.referred_by            := old.referred_by;
  new.created_at             := old.created_at;
  new.email_opt_out          := old.email_opt_out;
  return new;
end;
$$;
revoke all on function public.guard_profile_privileges() from public, anon, authenticated;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- --- Trigger functions must not be REST-callable ------------------------------
revoke all on function public.handle_new_user()         from public, anon, authenticated;
revoke all on function public.notify_post_review()      from public, anon, authenticated;
revoke all on function public.set_profiles_updated_at() from public, anon, authenticated;
revoke all on function public.username_from_email(text) from public, anon, authenticated;

revoke all on function public.redeem_referral(text) from public, anon;
grant execute on function public.redeem_referral(text) to authenticated;

-- Stays anon-callable: the signup form needs it before a session exists.
revoke all on function public.profile_exists_for_email(text) from public;
grant execute on function public.profile_exists_for_email(text) to anon, authenticated;

-- --- Pin search_path (guards against search_path injection) -------------------
alter function public.set_profiles_updated_at() set search_path = public, pg_temp;
alter function public.username_from_email(text)  set search_path = public, pg_temp;

-- --- waitlist: validate input, cap anonymous flooding -------------------------
alter table public.waitlist drop constraint if exists waitlist_email_shape;
alter table public.waitlist add constraint waitlist_email_shape
  check (char_length(email) between 6 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

create or replace function public.waitlist_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare recent int;
begin
  -- Unauthenticated endpoint, so there is no per-user key: cap the global rate.
  select count(*) into recent from public.waitlist
   where created_at > now() - interval '1 hour';
  if recent >= 200 then
    raise exception 'waitlist temporarily closed, try again later'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.waitlist_rate_limit() from public, anon, authenticated;
drop trigger if exists waitlist_rate_limit on public.waitlist;
create trigger waitlist_rate_limit
  before insert on public.waitlist
  for each row execute function public.waitlist_rate_limit();

revoke all on table public.waitlist from anon, authenticated;
grant insert (email) on table public.waitlist to anon, authenticated;

-- --- posts: per-user flood control + column-scoped writes ---------------------
create or replace function public.posts_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare recent int;
begin
  if auth.uid() is null then return new; end if;
  select count(*) into recent from public.posts
   where user_id = auth.uid() and created_at > now() - interval '10 minutes';
  if recent >= 10 then
    raise exception 'You are posting too quickly. Try again in a few minutes.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.posts_rate_limit() from public, anon, authenticated;
drop trigger if exists posts_rate_limit on public.posts;
create trigger posts_rate_limit
  before insert on public.posts
  for each row execute function public.posts_rate_limit();

revoke all on table public.posts from anon;
revoke insert, update on table public.posts from authenticated;
grant insert (user_id, content, image_url, parent_id, status) on table public.posts to authenticated;
grant update (status) on table public.posts to authenticated;

notify pgrst, 'reload schema';
