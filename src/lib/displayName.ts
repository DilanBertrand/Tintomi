import type { User } from '@supabase/supabase-js'
import type { ProfileRow } from '../types/profile'

type UserMeta = { full_name?: string; name?: string; username?: string }

export function getDisplayName(profile: ProfileRow | null | undefined, user: User | null | undefined): string {
  if (profile?.full_name?.trim()) return profile.full_name.trim()
  if (profile?.username?.trim()) return profile.username.trim()
  const meta = user?.user_metadata as UserMeta | undefined
  if (meta?.full_name?.trim()) return meta.full_name.trim()
  if (meta?.name?.trim()) return meta.name.trim()
  if (meta?.username?.trim()) return meta.username.trim()
  if (user?.email?.trim()) return user.email.trim()
  return 'You'
}

/** Short label for bottom nav (profile tab). */
export function truncateForNav(label: string, max = 12): string {
  const t = label.trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(1, max - 1))}\u2026`
}
