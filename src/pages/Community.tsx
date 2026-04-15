import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { StaggerPage } from '../components/StaggerPage'
import { localProgressKeys } from '../lib/localProgress'
import { supabase } from '../lib/supabase'

type LeaderRow = { name: string; xp: number; rank: number; you?: boolean }
type DbProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  xp: number | string | null
  created_at: string | null
  updated_at?: string | null
}

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
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [realRows, setRealRows] = useState<LeaderRow[]>([])
  const [myLiveRank, setMyLiveRank] = useState<number | null>(null)
  const [myLiveRow, setMyLiveRow] = useState<LeaderRow | null>(null)

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

      const ranked = parsed.map((row, index) => ({ name: row.name, xp: row.xp, rank: index + 4 }))
      const myIndex = parsed.findIndex((row) => row.id === userId)
      const myParsedRow = myIndex >= 0 ? parsed[myIndex] : null

      if (!cancelled) {
        setRealRows(ranked)
        setMyLiveRank(myIndex >= 0 ? myIndex + 4 : null)
        setMyLiveRow(
          myParsedRow
            ? {
                name: myParsedRow.name,
                xp: myParsedRow.xp,
                rank: myIndex + 4,
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
    const firstTwoReal = realRows.slice(0, 2)
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

  return (
    <div className="pb-28">
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
            onClick={() => setIsJoined(true)}
            className={`mt-4 w-full rounded-lg py-3 text-sm font-semibold tracking-wide transition-opacity duration-200 ${
              isJoined
                ? 'cursor-default border border-[#00FF88]/25 bg-[#00FF88]/10 text-[#00FF88]/80'
                : 'bg-[#00FF88] text-black hover:opacity-90 active:opacity-80'
            }`}
          >
            {isJoined ? 'JOINED' : "I'm in"}
          </button>
        </Card>

        <Card title="LEADERBOARD">
          <div className="space-y-2">
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
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-200 ${
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
