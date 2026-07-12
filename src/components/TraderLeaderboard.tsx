import { useEffect, useMemo, useState } from 'react'
import { Card } from './Card'
import { stocks } from '../data/stocks'
import { supabase } from '../lib/supabase'
import type { LivePrices } from '../pages/Invest'

const STARTING_BALANCE = 1000

type TraderRow = {
  id: string
  name: string
  wallet: { balance: number; portfolio: Record<string, number> }
}

/**
 * Ranks every account's paper-trading return %. Wallets come from the synced
 * profiles.wallet column; holdings are valued with this client's live prices,
 * so tiny cross-device drift is possible — fine for a game leaderboard.
 */
export function TraderLeaderboard({ userId, live }: { userId: string; live: LivePrices }) {
  const [rows, setRows] = useState<TraderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, wallet')
        .not('wallet', 'is', null)
        .limit(200)
      if (cancelled) return
      if (error) {
        console.warn('[traders] fetch failed:', error.message)
        setLoading(false)
        return
      }
      const mapped: TraderRow[] = []
      for (const r of data ?? []) {
        const w = r.wallet as { balance?: unknown; portfolio?: unknown } | null
        if (!w || typeof w.balance !== 'number' || !Number.isFinite(w.balance)) continue
        const portfolio: Record<string, number> = {}
        if (w.portfolio && typeof w.portfolio === 'object') {
          for (const [id, shares] of Object.entries(w.portfolio as Record<string, unknown>)) {
            if (typeof shares === 'number' && Number.isFinite(shares) && shares > 0) portfolio[id] = shares
          }
        }
        mapped.push({
          id: String(r.id),
          name: (r.username as string) || (r.full_name as string) || 'trader',
          wallet: { balance: w.balance, portfolio },
        })
      }
      setRows(mapped)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const ranked = useMemo(() => {
    const valued = rows.map((r) => {
      let value = r.wallet.balance
      for (const s of stocks) {
        const shares = r.wallet.portfolio[s.id] ?? 0
        value += shares * (live[s.id]?.price ?? s.basePrice)
      }
      const returnPct = ((value - STARTING_BALANCE) / STARTING_BALANCE) * 100
      return { ...r, value, returnPct }
    })
    valued.sort((a, b) => b.returnPct - a.returnPct)
    return valued
  }, [rows, live])

  const top = ranked.slice(0, 10)
  const myRank = ranked.findIndex((r) => r.id === userId)
  const me = myRank >= 0 ? ranked[myRank] : null
  const meOutsideTop = me && myRank >= 10

  return (
    <Card title="Top traders" subtitle="Return % on the $1,000 start">
      {loading ? (
        <p className="py-4 text-center text-sm text-[#5c665e]">Loading traders…</p>
      ) : top.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#5c665e]">
          No trades yet. Buy something and claim the top spot.
        </p>
      ) : (
        <ul className="space-y-2">
          {top.map((r, i) => {
            const you = r.id === userId
            const up = r.returnPct >= 0
            return (
              <li
                key={r.id}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                  you ? 'border-[#2979ff]/40 bg-[#2979ff]/5' : 'border-[#222222] bg-transparent'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 shrink-0 font-mono text-sm text-[#5c665e]">{i + 1}</span>
                  <p className="truncate text-sm font-medium text-[#e9ece8]">
                    {r.name}
                    {you ? <span className="ml-2 text-xs text-[#2979ff]">you</span> : null}
                  </p>
                </div>
                <p className={`font-mono text-sm font-semibold ${up ? 'text-[#00d18f]' : 'text-[#ff6b5e]'}`}>
                  {up ? '+' : ''}
                  {r.returnPct.toFixed(2)}%
                </p>
              </li>
            )
          })}
          {meOutsideTop && me ? (
            <li className="flex items-center justify-between rounded-xl border border-[#2979ff]/40 bg-[#2979ff]/5 px-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 shrink-0 font-mono text-sm text-[#5c665e]">{myRank + 1}</span>
                <p className="truncate text-sm font-medium text-[#e9ece8]">
                  {me.name}
                  <span className="ml-2 text-xs text-[#2979ff]">you</span>
                </p>
              </div>
              <p
                className={`font-mono text-sm font-semibold ${
                  me.returnPct >= 0 ? 'text-[#00d18f]' : 'text-[#ff6b5e]'
                }`}
              >
                {me.returnPct >= 0 ? '+' : ''}
                {me.returnPct.toFixed(2)}%
              </p>
            </li>
          ) : null}
        </ul>
      )}
    </Card>
  )
}
