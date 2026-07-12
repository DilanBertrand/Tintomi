import { supabase } from './supabase'

export type ProgressPatch = {
  xp?: number
  completed_lessons?: string[]
  completed_stories?: string[]
  learn_streak?: { streak: number; lastStreakDate: string | null }
  wallet?: { balance: number; portfolio: Record<string, number> }
}

/**
 * Writes progress columns to the signed-in user's own profile row (allowed by
 * the profiles_update_own RLS policy). Fire-and-forget: failures are logged,
 * not thrown, because localStorage already holds the same data as a cache and
 * the UI must not block on the network. Never touches is_pro.
 */
export async function saveProgress(userId: string, patch: ProgressPatch): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
    if (error) console.warn('[progressSync] save failed:', error.message)
  } catch (err) {
    console.warn('[progressSync] save threw:', err)
  }
}
