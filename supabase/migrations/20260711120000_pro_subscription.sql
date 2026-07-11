-- =============================================================================
-- Tintomi Pro: subscription columns on public.profiles
-- Run once in Supabase → SQL Editor → New query.
-- =============================================================================

alter table public.profiles
  add column if not exists is_pro boolean not null default false,
  add column if not exists pro_since timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Look up a profile by Stripe customer id from the webhook (service role only).
create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id);

-- NOTE: is_pro is written ONLY by the Stripe webhook using the service-role key,
-- which bypasses RLS. The existing "profiles_update_own" policy still lets users
-- update their own row (name, avatar, xp), but clients must never be trusted to
-- set is_pro themselves — the webhook is the single source of truth.
