import { supabase } from './supabase'

export async function updateUserXP(points: number): Promise<{ error: string | null }> {
  const safePoints = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0
  if (safePoints <= 0) return { error: null }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) return { error: sessionError.message }

  const session = sessionData.session
  if (!session?.user?.id) return { error: null }

  const userId = session.user.id
  const { data: row, error: rowError } = await supabase.from('profiles').select('xp').eq('id', userId).maybeSingle()
  if (rowError) return { error: rowError.message }

  const currentXpRaw = (row as { xp?: unknown } | null)?.xp
  const currentXp =
    typeof currentXpRaw === 'number'
      ? currentXpRaw
      : typeof currentXpRaw === 'string'
        ? Number(currentXpRaw)
        : 0

  const nextXp = Math.max(0, (Number.isFinite(currentXp) ? currentXp : 0) + safePoints)

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      xp: nextXp,
    },
    { onConflict: 'id' },
  )
  if (upsertError) return { error: upsertError.message }

  return { error: null }
}
