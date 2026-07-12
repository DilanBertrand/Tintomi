export type LearnStreak = { streak: number; lastStreakDate: string | null }

/** Bump the lesson streak on a completion: same day unchanged, yesterday +1, gap resets to 1. */
export function bumpLearnStreak(prev: LearnStreak, now: Date = new Date()): LearnStreak {
  const today = toLocalYmd(now)
  const yesterday = toLocalYmd(addLocalDays(now, -1))
  if (prev.lastStreakDate === today) return prev
  if (prev.lastStreakDate === yesterday) return { streak: prev.streak + 1, lastStreakDate: today }
  return { streak: 1, lastStreakDate: today }
}

/** Days-with-a-lesson streak, showing 0 if the chain is already broken. */
export function displayLearnStreak(s: LearnStreak, now: Date = new Date()): number {
  if (!s.lastStreakDate) return 0
  const today = toLocalYmd(now)
  const yesterday = toLocalYmd(addLocalDays(now, -1))
  if (s.lastStreakDate === today || s.lastStreakDate === yesterday) return s.streak
  return 0
}

/** Merge two lesson streaks (local vs DB): the one with the more recent day wins. */
export function mergeLearnStreak(a: LearnStreak | null, b: LearnStreak | null): LearnStreak {
  if (!a || !a.lastStreakDate) return b ?? { streak: 0, lastStreakDate: null }
  if (!b || !b.lastStreakDate) return a
  if (a.lastStreakDate >= b.lastStreakDate) return a
  return b
}

/** Local calendar day as YYYY-MM-DD (no UTC drift). */
export function toLocalYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addLocalDays(d: Date, delta: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta)
  return x
}

/**
 * Updates streak when the user opens the app: same calendar day → unchanged;
 * yesterday → +1; any longer gap → reset to 1.
 */
export function reconcileLoginStreak(
  prev: { streak: number; lastStreakDate: string | null },
  now: Date = new Date(),
): { streak: number; lastStreakDate: string } {
  const today = toLocalYmd(now)
  const yesterday = toLocalYmd(addLocalDays(now, -1))
  const streak = Math.max(1, prev.streak || 1)
  const last = prev.lastStreakDate

  if (!last) {
    return { streak: 1, lastStreakDate: today }
  }
  if (last === today) {
    return { streak, lastStreakDate: today }
  }
  if (last === yesterday) {
    return { streak: streak + 1, lastStreakDate: today }
  }
  return { streak: 1, lastStreakDate: today }
}

/**
 * When profile row / streak columns are missing, infer a minimal display from
 * Supabase auth `last_sign_in_at` and/or profile `updated_at` (latest instant wins).
 */
export function fallbackStreakDaysFromActivity(
  lastSignInAt: string | undefined,
  profileUpdatedAt: string | undefined,
  now: Date = new Date(),
): number {
  const times = [lastSignInAt, profileUpdatedAt].filter(Boolean) as string[]
  if (times.length === 0) return 0
  const latest = Math.max(...times.map((t) => new Date(t).getTime()))
  if (!Number.isFinite(latest)) return 0
  const today = toLocalYmd(now)
  const lastDay = toLocalYmd(new Date(latest))
  if (lastDay === today) return 1
  const y = toLocalYmd(addLocalDays(now, -1))
  if (lastDay === y) return 1
  return 0
}
