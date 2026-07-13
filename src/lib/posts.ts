import { supabase } from './supabase'
import { containsBannedContent } from '../utils/profanityFilter'

export type PostStatus = 'pending' | 'approved' | 'rejected'

export type Post = {
  id: string
  user_id: string
  parent_id: string | null
  content: string
  image_url: string | null
  status: PostStatus
  created_at: string
  author_name: string
  author_avatar_url: string | null
}

const MAX_IMAGE_DIMENSION = 1600
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

type PostRow = {
  id: string
  user_id: string
  parent_id: string | null
  content: string
  image_url: string | null
  status: string
  created_at: string
  profiles: { username: string | null; full_name: string | null; avatar_url: string | null } | null
}

function mapPost(row: PostRow): Post {
  const p = row.profiles
  return {
    id: row.id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    content: row.content,
    image_url: row.image_url,
    status: (['pending', 'approved', 'rejected'] as const).includes(row.status as PostStatus)
      ? (row.status as PostStatus)
      : 'pending',
    created_at: row.created_at,
    author_name: p?.username || p?.full_name || 'member',
    author_avatar_url: p?.avatar_url ?? null,
  }
}

// profiles is named explicitly via the FK constraint (posts_user_id_fkey) because
// PostgREST otherwise reports "more than one relationship" between posts and
// profiles (posts also self-references via parent_id, and PostgREST's embed
// resolution can misfire without the explicit hint).
const POST_SELECT =
  'id, user_id, parent_id, content, image_url, status, created_at, profiles!posts_user_id_fkey (username, full_name, avatar_url)'

/** Approved top-level posts (no replies), newest first, for the shared feed. */
export async function fetchApprovedPosts(limit = 50): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'approved')
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('[posts] fetch approved failed:', error.message)
    return []
  }
  return ((data ?? []) as unknown as PostRow[]).map(mapPost)
}

/** Approved replies for the given parent posts, oldest first. */
export async function fetchApprovedReplies(parentIds: string[]): Promise<Post[]> {
  if (parentIds.length === 0) return []
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'approved')
    .in('parent_id', parentIds)
    .order('created_at', { ascending: true })
  if (error) {
    console.warn('[posts] fetch replies failed:', error.message)
    return []
  }
  return ((data ?? []) as unknown as PostRow[]).map(mapPost)
}

/** The signed-in user's own posts in any status (for pending/rejected badges). */
export async function fetchMyPosts(userId: string, limit = 20): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('[posts] fetch mine failed:', error.message)
    return []
  }
  return ((data ?? []) as unknown as PostRow[]).map(mapPost)
}

/** Admin only (RLS-enforced): the moderation queue. */
export async function fetchPendingPosts(limit = 50): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) {
    console.warn('[posts] fetch pending failed:', error.message)
    return []
  }
  return ((data ?? []) as unknown as PostRow[]).map(mapPost)
}

/** Downscale + JPEG-compress an image in the browser before upload. */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  return blob ?? file
}

/**
 * Creates a post as 'pending' (RLS forces that), uploading the image first if
 * given. Returns an error string for the UI, or null on success.
 */
export async function createPost(userId: string, content: string, imageFile: File | null): Promise<string | null> {
  const text = content.trim()
  if (text.length < 1) return 'Write something first.'
  if (text.length > 1000) return 'Posts are capped at 1000 characters.'
  if (containsBannedContent(text)) return 'That post contains language that isn\'t allowed here.'

  let imageUrl: string | null = null
  if (imageFile) {
    if (!imageFile.type.startsWith('image/')) return 'Only image files can be attached.'
    let blob: Blob
    try {
      blob = await compressImage(imageFile)
    } catch {
      return 'Could not read that image. Try a different one.'
    }
    if (blob.size > MAX_UPLOAD_BYTES) return 'Image is too large even after compression (5MB max).'
    const path = `${userId}/${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage
      .from('post-images')
      .upload(path, blob, { contentType: 'image/jpeg' })
    if (upErr) {
      console.warn('[posts] image upload failed:', upErr.message)
      return 'Image upload failed. Try again.'
    }
    imageUrl = supabase.storage.from('post-images').getPublicUrl(path).data.publicUrl
  }

  const { error } = await supabase.from('posts').insert({ user_id: userId, content: text, image_url: imageUrl })
  if (error) {
    console.warn('[posts] insert failed:', error.message)
    return 'Could not submit the post. Try again.'
  }
  return null
}

/** Creates a reply as 'pending' — text only, subject to the same approval flow. */
export async function createReply(userId: string, parentId: string, content: string): Promise<string | null> {
  const text = content.trim()
  if (text.length < 1) return 'Write a reply first.'
  if (text.length > 1000) return 'Replies are capped at 1000 characters.'
  if (containsBannedContent(text)) return 'That reply contains language that isn\'t allowed here.'
  const { error } = await supabase
    .from('posts')
    .insert({ user_id: userId, parent_id: parentId, content: text })
  if (error) {
    console.warn('[posts] reply insert failed:', error.message)
    return 'Could not submit the reply. Try again.'
  }
  return null
}

export type LikeInfo = { count: number; likedByMe: boolean }

/** Like counts + whether the current user liked, for the given post ids. */
export async function fetchLikes(postIds: string[], userId: string): Promise<Record<string, LikeInfo>> {
  const result: Record<string, LikeInfo> = {}
  for (const id of postIds) result[id] = { count: 0, likedByMe: false }
  if (postIds.length === 0) return result
  const { data, error } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds)
  if (error) {
    console.warn('[posts] fetch likes failed:', error.message)
    return result
  }
  for (const row of data ?? []) {
    const pid = String((row as { post_id: string }).post_id)
    const uid = String((row as { user_id: string }).user_id)
    if (!result[pid]) result[pid] = { count: 0, likedByMe: false }
    result[pid].count += 1
    if (uid === userId) result[pid].likedByMe = true
  }
  return result
}

/** Toggle a like on a post. `liked` is the CURRENT state; we flip it. */
export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<string | null> {
  if (liked) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) {
      console.warn('[posts] unlike failed:', error.message)
      return 'Could not update like.'
    }
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    if (error) {
      console.warn('[posts] like failed:', error.message)
      return 'Could not update like.'
    }
  }
  return null
}

/** Admin only (RLS-enforced): approve or reject a pending post. */
export async function reviewPost(postId: string, status: 'approved' | 'rejected'): Promise<string | null> {
  const { error } = await supabase
    .from('posts')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', postId)
  if (error) {
    console.warn('[posts] review failed:', error.message)
    return 'Could not update the post.'
  }
  return null
}

/** Author or admin (RLS-enforced): remove a post. */
export async function deletePost(postId: string): Promise<string | null> {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) {
    console.warn('[posts] delete failed:', error.message)
    return 'Could not delete the post.'
  }
  return null
}
