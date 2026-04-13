import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { StaggerPage } from '../components/StaggerPage'

type LeaderRow = { name: string; xp: number; rank: number; you?: boolean }

const leaderboardOthers: LeaderRow[] = [
  { name: 'zara_finance', xp: 1840, rank: 1 },
  { name: 'ethan_trades', xp: 1622, rank: 2 },
  { name: 'nia_macro', xp: 1490, rank: 3 },
  { name: 'omar_index', xp: 1324, rank: 4 },
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
  userXp: number
  youDisplayName: string
}

export function Community({ userXp, youDisplayName }: CommunityProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isJoined, setIsJoined] = useState(false)

  const rows = useMemo((): LeaderRow[] => {
    const youRow: LeaderRow = { name: youDisplayName, xp: userXp, rank: 0, you: true }
    const copy: LeaderRow[] = [...leaderboardOthers, youRow]
    return copy.sort((a, b) => b.xp - a.xp).map((r, i) => ({ ...r, rank: i + 1 }))
  }, [userXp, youDisplayName])

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
            {rows.map((r) => (
              <div
                key={r.you ? 'you' : r.name}
                className={`${rowGlass} ${
                  r.you ? 'border-[#00FF88]/25 bg-[#00FF88]/[0.07]' : ''
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
