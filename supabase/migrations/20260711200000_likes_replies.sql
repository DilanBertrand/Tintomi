-- =============================================================================
-- Tintomi: post likes + replies (replies are approved like posts)
-- Run once in Supabase → SQL Editor → New query.
-- =============================================================================

-- Replies are just posts with a parent. They reuse the pending→approved flow
-- and the existing posts_review_notify trigger, so a reply also needs approval
-- and its author is notified on approve/reject.
alter table public.posts
  add column if not exists parent_id uuid references public.posts (id) on delete cascade;

create index if not exists posts_parent_idx on public.posts (parent_id, created_at);

-- ---------- Likes ------------------------------------------------------------
create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_post_idx on public.post_likes (post_id);

alter table public.post_likes enable row level security;

-- Anyone signed in can read likes (to show counts).
drop policy if exists "post_likes_select" on public.post_likes;
create policy "post_likes_select"
  on public.post_likes for select using (auth.role() = 'authenticated');

-- Users can like/unlike only as themselves.
drop policy if exists "post_likes_insert_own" on public.post_likes;
create policy "post_likes_insert_own"
  on public.post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "post_likes_delete_own" on public.post_likes;
create policy "post_likes_delete_own"
  on public.post_likes for delete using (auth.uid() = user_id);
