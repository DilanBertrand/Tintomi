import type { PostgrestError, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { fallbackStreakDaysFromActivity, reconcileLoginStreak } from './streak'
import type { ProfileRow } from '../types/profile'

/** PostgREST / Postgres when `public.profiles` has not been created. */
export function isMissingProfilesTableError(error: PostgrestError | { message?: string; code?: string }): boolean {
  const code = 'code' in error ? String(error.code ?? '') : ''
  const msg = (error.message ?? '').toLowerCase()
  return (
    code === 'PGRST205' ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist') && msg.includes('profiles'))
  )
}

export const PROFILES_TABLE_SETUP_HINT =
  'Cloud profiles are not set up yet. In Supabase → SQL Editor, run the SQL from `supabase/setup_profiles.sql` in this repo (or your migration file) to create `public.profiles`.'

/** Pre-signup: true if this email already has an auth user with a profiles row (RPC must exist in DB). */
export async function profileExistsForEmail(email: string): Promise<{ exists: boolean; skipped: boolean }> {
  const trimmed = email.trim()
  if (!trimmed) return { exists: false, skipped: true }

  const { data, error } = await supabase.rpc('profile_exists_for_email', { check_email: trimmed })

  if (error) {
    if (isMissingProfilesTableError(error)) {
      console.warn('[profiles] profile_exists_for_email — profiles table missing.')
    } else {
      console.warn('[profiles] profile_exists_for_email RPC failed', error.message)
    }
    return { exists: false, skipped: true }
  }

  return { exists: data === true, skipped: false }
}

function mapProfile(row: Record<string, unknown>): ProfileRow {
  return {
    id: String(row.id),
    full_name: (row.full_name as string) ?? null,
    username: (row.username as string) ?? null,
    avatar_url: (row.avatar_url as string) ?? null,
    login_streak: typeof row.login_streak === 'number' ? row.login_streak : Number(row.login_streak) || 1,
    last_streak_date: (row.last_streak_date as string) ?? null,
    updated_at: String(row.updated_at ?? ''),
  }
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    if (isMissingProfilesTableError(error)) {
      console.warn('[profiles] public.profiles table is missing — run supabase/setup_profiles.sql in Supabase.')
    } else {
      console.warn('[profiles] fetch failed', error.message)
    }
    return null
  }
  if (!data) return null
  return mapProfile(data as Record<string, unknown>)
}

export async function ensureProfileRow(user: User): Promise<ProfileRow | null> {
  const existing = await fetchProfile(user.id)
  if (existing) return existing

  const meta = user.user_metadata as { full_name?: string } | undefined
  const full_name = meta?.full_name?.trim() || null
  const { data, error } = await supabase.from('profiles').insert({ id: user.id, full_name }).select().single()

  if (error) {
    if (isMissingProfilesTableError(error)) {
      console.warn('[profiles] cannot insert — public.profiles missing. Run setup_profiles.sql in Supabase.')
      return null
    }
    if (error.code === '23505') {
      return fetchProfile(user.id)
    }
    console.warn('[profiles] insert failed', error.message)
    return null
  }
  return mapProfile(data as Record<string, unknown>)
}

/** Load or create profile row, then reconcile login streak for today. */
export async function loadProfileWithStreakSync(user: User): Promise<ProfileRow | null> {
  let row = await fetchProfile(user.id)
  if (!row) {
    row = await ensureProfileRow(user)
  }
  if (!row) {
    return null
  }

  const next = reconcileLoginStreak(
    { streak: row.login_streak, lastStreakDate: row.last_streak_date },
    new Date(),
  )

  const unchanged =
    row.login_streak === next.streak && row.last_streak_date === next.lastStreakDate
  if (unchanged) {
    return row
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      login_streak: next.streak,
      last_streak_date: next.lastStreakDate,
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    if (isMissingProfilesTableError(error)) {
      console.warn('[profiles] streak not persisted — public.profiles missing.')
    } else {
      console.warn('[profiles] streak update failed', error.message)
    }
    return {
      ...row,
      login_streak: next.streak,
      last_streak_date: next.lastStreakDate,
    }
  }
  return mapProfile(data as Record<string, unknown>)
}

export function streakForDisplay(row: ProfileRow | null, user: User | null): number {
  const inferred = fallbackStreakDaysFromActivity(user?.last_sign_in_at, row?.updated_at)
  if (row) return Math.max(row.login_streak, inferred)
  return inferred
}

export type ProfileUpdatePayload = {
  full_name: string | null
  username: string | null
}

export async function updateProfileFields(
  userId: string,
  payload: ProfileUpdatePayload,
): Promise<{ error: string | null; row: ProfileRow | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: payload.full_name,
        username: payload.username || null,
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) {
    if (isMissingProfilesTableError(error)) {
      return { error: PROFILES_TABLE_SETUP_HINT, row: null }
    }
    return { error: error.message, row: null }
  }
  return { error: null, row: mapProfile(data as Record<string, unknown>) }
}

export async function setProfileAvatarUrl(userId: string, avatarUrl: string | null) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return { error: error.message as string, row: null as ProfileRow | null }
  }
  return { error: null as string | null, row: mapProfile(data as Record<string, unknown>) }
}

const AVATAR_BUCKET = 'avatars'

export async function uploadAvatarFile(userId: string, file: File): Promise<{ publicUrl: string | null; error: string | null }> {
  const safeName = file.name.replace(/[^\w.-]/g, '') || 'avatar'
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`

  const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (upErr) {
    return { publicUrl: null, error: upErr.message }
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl, error: null }
}
