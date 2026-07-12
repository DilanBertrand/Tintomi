-- =============================================================================
-- Tintomi: cross-device progress on public.profiles
-- Run once in Supabase → SQL Editor → New query.
-- =============================================================================
-- xp already exists (integer). These add the rest of a user's learning +
-- paper-trading progress so it follows the account across devices. The client
-- updates its own row (RLS policy "profiles_update_own"); no service role.

alter table public.profiles
  add column if not exists completed_lessons jsonb not null default '[]'::jsonb,
  add column if not exists completed_stories jsonb not null default '[]'::jsonb,
  add column if not exists learn_streak jsonb,
  add column if not exists wallet jsonb;
