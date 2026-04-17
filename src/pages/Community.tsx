import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { StaggerPage } from '../components/StaggerPage'
import { useAuth } from '../contexts/AuthContext'
import { localProgressKeys } from '../lib/localProgress'
import { updateProfileFields } from '../lib/profiles'
import { supabase } from '../lib/supabase'
import { updateUserXP } from '../lib/updateUserXP'
import { isUsernameRestricted } from '../utils/profanityFilter'

type LeaderRow = { name: string; xp: number; rank: number; you?: boolean }
type DbProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  xp: number | string | null
  created_at: string | null
  updated_at?: string | null
}
type RankedProfileRow = { id: string; name: string; xp: number; rank: number }

const HYBRID_TOP_THREE: LeaderRow[] = [
  { name: 'zara_finance', xp: 9900, rank: 1 },
  { name: 'ethan_trades', xp: 9500, rank: 2 },
  { name: 'nia_macro', xp: 9200, rank: 3 },
]

const rowGlass =
  'flex items-center justify-between rounded-xl border border-[#222222] bg-white/5 px-3 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2a2a2a] hover:shadow-[0_0_20px_rgba(0,255,136,0.06)]'

const POLL_OPTIONS = [
  'Subscriptions stacking silently',
  'Impulse buys on “deals”',
  'Trying to time the market',
] as const

/** Vote distribution shown after the user casts. */
const POLL_RESULT_PCTS: readonly [number, number, number] = [45, 30, 25]

type CommunityProps = {
  userId: string
  userXp: number
  youDisplayName: string
}

export function Community({ userId, userXp, youDisplayName }: CommunityProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [realRows, setRealRows] = useState<RankedProfileRow[]>([])
  const [myLiveRank, setMyLiveRank] = useState<number | null>(null)
  const [myLiveRow, setMyLiveRow] = useState<LeaderRow | null>(null)
  const [profileLocked, setProfileLocked] = useState(true)
  const [lockLoading, setLockLoading] = useState(true)
  const [unlockSaving, setUnlockSaving] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [displayNameInput, setDisplayNameInput] = useState(profile?.full_name ?? '')
  const [usernameInput, setUsernameInput] = useState(profile?.username ?? '')

  useEffect(() => {
    setDisplayNameInput(profile?.full_name ?? '')
    setUsernameInput(profile?.username ?? '')
  }, [profile?.full_name, profile?.username])

  useEffect(() => {
    let cancelled = false

    async function loadLockState() {
      setLockLoading(true)
      const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle()
      if (cancelled) return
      if (error) {
        setProfileLocked(true)
        setLockLoading(false)
        return
      }
      const uname = typeof data?.username === 'string' ? data.username.trim() : ''
      setProfileLocked(!uname)
      setLockLoading(false)
    }

    if (!userId) {
      setProfileLocked(true)
      setLockLoading(false)
      return
    }

    void loadLockState()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    try {
      const raw = localStorage.getItem(localProgressKeys.communityPoll(userId))
      if (raw === null) return
      const n = Number.parseInt(raw, 10)
      if (Number.isInteger(n) && n >= 0 && n < POLL_OPTIONS.length) setSelectedOption(n)
    } catch {
      /* ignore */
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    try {
      const raw = localStorage.getItem(localProgressKeys.communityChallengeJoined(userId))
      setIsJoined(raw === '1' || raw === 'true')
    } catch {
      /* ignore */
    }
  }, [userId])

  useEffect(() => {
    if (!userId || selectedOption === null) return
    try {
      localStorage.setItem(localProgressKeys.communityPoll(userId), String(selectedOption))
    } catch {
      /* ignore */
    }
  }, [userId, selectedOption])

  useEffect(() => {
    if (!userId || !isJoined) return
    try {
      localStorage.setItem(localProgressKeys.communityChallengeJoined(userId), '1')
    } catch {
      /* ignore */
    }
  }, [userId, isJoined])

  useEffect(() => {
    let cancelled = false

    async function loadLeaderboard() {
      const primary = await supabase
        .from('profiles')
        .select('id, username, full_name, xp, created_at')
        .order('xp', { ascending: false })
        .order('created_at', { ascending: true })

      let data: DbProfileRow[] | null = primary.data as DbProfileRow[] | null
      let error = primary.error

      // Backward-compatible fallback for databases that don't yet have `created_at`.
      if (error) {
        const fallback = await supabase
          .from('profiles')
          .select('id, username, full_name, xp, updated_at')
          .order('xp', { ascending: false })
          .order('updated_at', { ascending: true })
        data = fallback.data as DbProfileRow[] | null
        error = fallback.error
      }

      if (error || !data || cancelled) {
        if (!cancelled) {
          setRealRows([])
          setMyLiveRank(null)
          setMyLiveRow(null)
        }
        return
      }

      const topThreeNames = new Set(HYBRID_TOP_THREE.map((row) => row.name.toLowerCase()))
      const parsed = (data as DbProfileRow[])
        .map((row) => {
          const username = typeof row.username === 'string' ? row.username.trim() : ''
          const fullName = typeof row.full_name === 'string' ? row.full_name.trim() : ''
          const resolvedName = username || fullName || 'anonymous_trader'
          const xpValue =
            typeof row.xp === 'number'
              ? row.xp
              : typeof row.xp === 'string'
                ? Number.parseInt(row.xp, 10)
                : 0

          const createdAt =
            typeof row.created_at === 'string' && row.created_at.trim().length > 0
              ? row.created_at
              : typeof row.updated_at === 'string' && row.updated_at.trim().length > 0
                ? row.updated_at
                : '9999-12-31T23:59:59.999Z'

          return {
            id: row.id,
            name: resolvedName,
            xp: Number.isFinite(xpValue) ? Math.max(0, xpValue) : 0,
            createdAt,
          }
        })
        .filter((row) => row.name && !topThreeNames.has(row.name.toLowerCase()))
        .sort((a, b) => {
          if (b.xp !== a.xp) return b.xp - a.xp
          if (a.createdAt < b.createdAt) return -1
          if (a.createdAt > b.createdAt) return 1
          return a.id.localeCompare(b.id)
        })

      // Rank is derived from full real-user order (+3 because #1-#3 are fixed fake bosses).
      const ranked: RankedProfileRow[] = parsed.map((row, index) => ({
        id: row.id,
        name: row.name,
        xp: row.xp,
        rank: index + 4,
      }))
      const myIndex = ranked.findIndex((row) => row.id === userId)
      const myParsedRow = myIndex >= 0 ? ranked[myIndex] : null

      if (!cancelled) {
        setRealRows(ranked)
        setMyLiveRank(myIndex >= 0 ? myIndex + 4 : null)
        setMyLiveRow(
          myParsedRow
            ? {
                name: myParsedRow.name,
                xp: myParsedRow.xp,
                rank: myParsedRow.rank,
                you: true,
              }
            : null,
        )
      }
    }

    loadLeaderboard()
    const channel = supabase
      .channel('community-leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void loadLeaderboard()
      })
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const topFiveRows = useMemo((): LeaderRow[] => {
    // Top 5 = 3 fixed bots + top 2 real users from global ranking.
    const firstTwoReal: LeaderRow[] = realRows.slice(0, 2).map((row) => ({
      name: row.name,
      xp: row.xp,
      rank: row.rank,
    }))
    return [...HYBRID_TOP_THREE, ...firstTwoReal].map((row) => ({
      ...row,
      you: myLiveRank !== null && row.rank === myLiveRank,
    }))
  }, [realRows, myLiveRank])

  const showStickyMe = useMemo(() => {
    if (myLiveRank === null) return false
    return myLiveRank > 5
  }, [myLiveRank])

  const stickyMeRow = useMemo((): LeaderRow | null => {
    if (!showStickyMe || myLiveRank === null) return null
    if (myLiveRow) return myLiveRow
    return { name: youDisplayName, xp: userXp, rank: myLiveRank, you: true }
  }, [showStickyMe, myLiveRank, myLiveRow, youDisplayName, userXp])

  async function handleUnlockProfile() {
    if (!user) return
    setUnlockError(null)

    const nameTrim = displayNameInput.trim()
    const userTrim = usernameInput.trim()
    if (!nameTrim || !userTrim) {
      setUnlockError('Display name and username are required.')
      return
    }
    if (isUsernameRestricted(nameTrim) || isUsernameRestricted(userTrim)) {
      setUnlockError('Username contains restricted language or symbols.')
      return
    }

    setUnlockSaving(true)
    const { error } = await updateProfileFields(user.id, {
      full_name: nameTrim,
      username: userTrim,
    })
    if (error) {
      setUnlockSaving(false)
      setUnlockError(error)
      return
    }

    await refreshProfile()
    setProfileLocked(false)
    setUnlockSaving(false)
  }

  return (
    <div className="overflow-y-auto pb-20">
      <motion.header
        className="px-1"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">NETWORK</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Community</h1>
        <p className="mt-1 max-w-md text-sm text-gray-500">
          Leaderboard, weekly challenge, and community poll.
        </p>
      </motion.header>

      <StaggerPage className="mt-8 space-y-6">
        <Card title="CHALLENGE">
          <p className="text-sm font-semibold text-white">Save $20 this week.</p>
          <p className="mt-2 text-sm text-gray-500">
            Track one no-spend day. Build the habit without the noise.
          </p>
          <button
            type="button"
            disabled={isJoined}
            onClick={async () => {
              if (isJoined) return
              setIsJoined(true)
              await updateUserXP(20)
            }}
            className={`mt-4 min-h-12 w-full rounded-lg py-3 text-sm font-semibold tracking-wide transition-opacity duration-200 ${
              isJoined
                ? 'cursor-default border border-[#00FF88]/25 bg-[#00FF88]/10 text-[#00FF88]/80'
                : 'bg-[#00FF88] text-black hover:opacity-90 active:opacity-80'
            }`}
          >
            {isJoined ? 'JOINED' : "I'm in"}
          </button>
        </Card>

        {profileLocked && !lockLoading ? (
          <Card title="LEADERBOARD">
            <div className="relative">
              <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 opacity-45 blur-[1px]">
                {topFiveRows.map((r) => (
                  <div key={`${r.rank}-${r.name}`} className={rowGlass}>
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-semibold text-gray-500">#{r.rank}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{r.name}</p>
                        <p className="text-xs text-gray-500">XP</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#00FF88]">{r.xp} XP</span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/50 p-2 sm:p-4">
                <div className="mx-auto w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  <p className="text-center text-lg font-semibold text-white">Access the Leaderboard</p>
                  <p className="mt-2 text-center text-sm text-gray-300">
                    Choose a username and display name to see your rank and join the grind.
                  </p>
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value.replace(/\s/g, ''))}
                      placeholder="Display Name"
                      className="min-h-12 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-[#00FF88]/45 focus:ring-2 focus:ring-[#00FF88]/20"
                    />
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value.replace(/\s/g, ''))}
                      placeholder="Username"
                      className="min-h-12 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-[#00FF88]/45 focus:ring-2 focus:ring-[#00FF88]/20"
                    />
                    {unlockError ? <p className="text-center text-xs font-medium text-red-400">{unlockError}</p> : null}
                    <button
                      type="button"
                      onClick={handleUnlockProfile}
                      disabled={unlockSaving}
                      className="min-h-12 w-full rounded-xl bg-[#00FF88] py-3 text-sm font-bold text-black transition hover:brightness-105 disabled:opacity-50"
                    >
                      {unlockSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="LEADERBOARD">
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {topFiveRows.map((r) => (
                <div
                  key={`${r.rank}-${r.name}`}
                  className={`${rowGlass} ${
                    r.you ? 'border-yellow-400/45 bg-yellow-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-semibold text-gray-500">#{r.rank}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {r.name} {r.you ? '(you)' : ''}
                      </p>
                      <p className="text-xs text-gray-500">XP</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#00FF88]">{r.xp} XP</span>
                </div>
              ))}

              {showStickyMe ? (
                <>
                  <div className="px-2 py-1 text-center text-xs font-semibold tracking-[0.22em] text-gray-600">...</div>
                  {stickyMeRow ? (
                    <div className={`${rowGlass} border-yellow-400/45 bg-yellow-500/10`}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-sm font-semibold text-yellow-200">#{stickyMeRow.rank}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{stickyMeRow.name} (you)</p>
                          <p className="text-xs text-yellow-200/80">XP</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-[#00FF88]">{stickyMeRow.xp} XP</span>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </Card>
        )}

        <Card title="POLL" subtitle="Signal check">
          <p className="text-sm font-semibold text-white">
            What&apos;s the biggest money trap right now?
          </p>
          <div className="mt-4 space-y-2">
            {POLL_OPTIONS.map((opt, idx) => {
              const voted = selectedOption !== null
              const isSelected = selectedOption === idx
              const showResults = voted

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={voted}
                  aria-pressed={voted ? isSelected : undefined}
                  onClick={() => setSelectedOption(idx)}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-200 ${
                    voted
                      ? isSelected
                        ? 'cursor-default border border-[#00FF88]/55 bg-[#00FF88]/12 text-[#00FF88] shadow-[0_0_24px_rgba(0,255,136,0.12)]'
                        : 'cursor-default border border-white/[0.07] bg-white/[0.02] text-gray-500 opacity-50'
                      : 'border border-white/10 border-t-white/15 bg-white/5 text-gray-200 hover:bg-white/[0.08] active:scale-[0.99]'
                  }`}
                >
                  <span className="min-w-0 flex-1">{opt}</span>
                  {showResults ? (
                    <span
                      className={`shrink-0 font-mono text-sm tabular-nums ${
                        isSelected ? 'font-semibold text-[#00FF88]' : 'text-gray-500'
                      }`}
                    >
                      {POLL_RESULT_PCTS[idx]}%
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </Card>
      </StaggerPage>
    </div>
  )
}
