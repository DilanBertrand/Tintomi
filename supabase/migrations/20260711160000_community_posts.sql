-- =============================================================================
-- Tintomi: community posts with founder approval + post images
-- Run once in Supabase → SQL Editor → New query.
-- =============================================================================
-- Flow: users insert posts as 'pending' (forced by RLS), only the admin can
-- approve/reject, and only 'approved' posts are visible to other users.
-- Authors always see their own posts (with status). After running this,
-- set your own account as admin:
--   update public.profiles set is_admin = true where id = '<your-user-id>';

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists posts_status_created_idx on public.posts (status, created_at desc);
create index if not exists posts_user_idx on public.posts (user_id);

alter table public.posts enable row level security;

-- Anyone signed in can read approved posts.
drop policy if exists "posts_select_approved" on public.posts;
create policy "posts_select_approved"
  on public.posts for select
  using (status = 'approved' and auth.role() = 'authenticated');

-- Authors can always read their own posts (pending/rejected included).
drop policy if exists "posts_select_own" on public.posts;
create policy "posts_select_own"
  on public.posts for select
  using (auth.uid() = user_id);

-- Admins can read everything (the moderation queue).
drop policy if exists "posts_select_admin" on public.posts;
create policy "posts_select_admin"
  on public.posts for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Users can only create their own posts, and only as 'pending'.
drop policy if exists "posts_insert_own_pending" on public.posts;
create policy "posts_insert_own_pending"
  on public.posts for insert
  with check (auth.uid() = user_id and status = 'pending');

-- Only admins can update posts (approve / reject).
drop policy if exists "posts_update_admin" on public.posts;
create policy "posts_update_admin"
  on public.posts for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Authors can delete their own posts; admins can delete any.
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Public bucket for post images (path: {user_id}/{filename})
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read post images" on storage.objects;
create policy "Public read post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "Users can upload own post images" on storage.objects;
create policy "Users can upload own post images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own post images" on storage.objects;
create policy "Users can delete own post images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
