-- =============================================================================
-- Tintomi: in-app notifications + referrals
-- Run once in Supabase → SQL Editor → New query.
-- =============================================================================

-- ---------- Notifications ----------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  link_tab text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete using (auth.uid() = user_id);
-- No insert policy: rows are created only by the security-definer trigger below.

-- Notify the author when their post is approved or rejected.
create or replace function public.notify_post_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved' then
      insert into public.notifications (user_id, message, link_tab)
        values (new.user_id, 'Your post was approved and is now live.', 'community');
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, message, link_tab)
        values (new.user_id, 'Your post was not approved this time.', 'community');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_review_notify on public.posts;
create trigger posts_review_notify
  after update on public.posts
  for each row
  execute function public.notify_post_review();

-- ---------- Referrals --------------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text unique
    default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  add column if not exists referred_by uuid references public.profiles (id);

-- Backfill codes for existing accounts.
update public.profiles
  set referral_code = upper(substr(md5(gen_random_uuid()::text), 1, 6))
  where referral_code is null;

-- Redeem a referral code: grants +100 XP to both the new user and the
-- referrer, exactly once per new user. Runs as definer so it can credit the
-- referrer's row (which the caller could not update directly).
create or replace function public.redeem_referral(code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  referrer_id uuid;
begin
  if caller is null then return 'not_authenticated'; end if;
  if exists (select 1 from public.profiles where id = caller and referred_by is not null) then
    return 'already_referred';
  end if;
  select id into referrer_id
    from public.profiles
    where upper(referral_code) = upper(trim(code));
  if referrer_id is null then return 'invalid_code'; end if;
  if referrer_id = caller then return 'self'; end if;

  update public.profiles set referred_by = referrer_id, xp = xp + 100 where id = caller;
  update public.profiles set xp = xp + 100 where id = referrer_id;
  return 'ok';
end;
$$;

grant execute on function public.redeem_referral(text) to authenticated;
