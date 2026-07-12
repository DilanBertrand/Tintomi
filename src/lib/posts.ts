import { supabase } from './supabase'

export type PostStatus = 'pending' | 'approved' | 'rejected'

export type Post = {
  id: string
  user_id: string
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

const POST_SELECT = 'id, user_id, content, image_url, status, created_at, profiles (username, full_name, avatar_url)'

/** Approved posts, newest first, for the shared feed. */
export async function fetchApprovedPosts(limit = 50): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('[posts] fetch approved failed:', error.message)
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
