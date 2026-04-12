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

type CommunityProps = {
  userXp: number
  youDisplayName: string
}

export function Community({ userXp, youDisplayName }: CommunityProps) {
  const [poll, setPoll] = useState<number | null>(null)

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
          Leaderboard, weekly challenge, and poll (simulated).
        </p>
      </motion.header>

      <StaggerPage className="mt-8 space-y-6">
        <Card title="CHALLENGE" subtitle="Weekly · simulated">
          <p className="text-sm font-semibold text-white">Save $20 this week.</p>
          <p className="mt-2 text-sm text-gray-500">
            Track one no-spend day. Build the habit without the noise.
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-[#00FF88] py-3 text-sm font-semibold text-black transition-opacity duration-200 hover:opacity-90 active:opacity-80"
          >
            I&apos;m in
          </button>
        </Card>

        <Card title="LEADERBOARD" subtitle="XP · simulated">
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
            {[
              'Subscriptions stacking silently',
              'Impulse buys on “deals”',
              'Trying to time the market',
            ].map((opt, idx) => {
              const active = poll === idx
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPoll(idx)}
                  className={`w-full rounded-lg border-x border-b px-3 py-3 text-left text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'border-t border-t-white/25 border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]'
                      : 'border-t border-t-white/15 border-white/10 bg-white/5 text-gray-200 hover:bg-white/[0.08]'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {poll !== null ? (
            <p className="mt-3 text-xs text-gray-500">Response recorded (demo).</p>
          ) : null}
        </Card>
      </StaggerPage>
    </div>
  )
}
