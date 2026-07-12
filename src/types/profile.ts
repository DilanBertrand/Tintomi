export type ProfileRow = {
  id: string
  full_name: string | null
  username: string | null
  xp: number
  avatar_url: string | null
  login_streak: number
  last_streak_date: string | null
  is_pro: boolean
  is_admin: boolean
  completed_lessons: string[]
  completed_stories: string[]
  learn_streak: { streak: number; lastStreakDate: string | null } | null
  wallet: { balance: number; portfolio: Record<string, number> } | null
  updated_at: string
}
