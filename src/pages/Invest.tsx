import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { StaggerPage } from '../components/StaggerPage'
import { StockCard } from '../components/StockCard'
import { stocks } from '../data/stocks'
import { fadeSlideUp } from '../motion/variants'

export type Portfolio = Record<string, number>

export type LivePrices = Record<string, { price: number; changePct: number }>

export type PriceHistory = Record<string, number[]>

const WATCHLIST_POINTS = 20
const SPARK_TICK_MS = 3000

type InvestProps = {
  balance: number
  portfolio: Portfolio
  live: LivePrices
  /** Finnhub (or merged) closes — used to seed the 20-point watchlist line when available */
  chartSeries: PriceHistory
  onBuy: (stockId: string, price: number) => void
  onSell: (stockId: string, price: number) => void
}

const subPanel =
  'rounded-xl border border-[#2979ff]/30 bg-[#121a15] p-3 transition-all duration-300 hover:border-[#2979ff]/45 '

function initWatchLines(chartSeries: PriceHistory, live: LivePrices): Record<string, number[]> {
  const o: Record<string, number[]> = {}
  for (const s of stocks) {
    const fh = chartSeries[s.id]
    const p = live[s.id]?.price ?? s.basePrice
    if (fh && fh.length >= 2) {
      o[s.id] = fh.slice(-WATCHLIST_POINTS)
    } else {
      o[s.id] = Array.from({ length: Math.min(12, WATCHLIST_POINTS) }, () => p)
    }
  }
  return o
}

export function Invest({ balance, portfolio, live, chartSeries, onBuy, onSell }: InvestProps) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const liveRef = useRef(live)

  useEffect(() => {
    liveRef.current = live
  }, [live])

  const [watchLines, setWatchLines] = useState<Record<string, number[]>>(() =>
    initWatchLines(chartSeries, live),
  )

  useEffect(() => {
    void Promise.resolve().then(() => {
      setWatchLines((prev) => {
        let changed = false
        const next = { ...prev }
        for (const s of stocks) {
          const fh = chartSeries[s.id]
          if (fh && fh.length >= 8) {
            const sliced = fh.slice(-WATCHLIST_POINTS)
            if (JSON.stringify(next[s.id]) !== JSON.stringify(sliced)) {
              next[s.id] = sliced
              changed = true
            }
          }
        }
        return changed ? next : prev
      })
    })
  }, [chartSeries])

  useEffect(() => {
    const id = window.setInterval(() => {
      setWatchLines((prev) => {
        const next = { ...prev }
        for (const s of stocks) {
          const p = liveRef.current[s.id]?.price ?? s.basePrice
          const cur = prev[s.id] ?? [p, p]
          next[s.id] = [...cur, p].slice(-WATCHLIST_POINTS)
        }
        return next
      })
    }, SPARK_TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const portfolioValue = useMemo(() => {
    let sum = balance
    for (const s of stocks) {
      const shares = portfolio[s.id] ?? 0
      const price = live[s.id]?.price ?? s.basePrice
      sum += shares * price
    }
    return sum
  }, [balance, portfolio, live])

  const handleBuy = useCallback(
    (stockId: string, price: number) => {
      onBuy(stockId, price)
    },
    [onBuy],
  )

  const handleSell = useCallback(
    (stockId: string, price: number) => {
      onSell(stockId, price)
    },
    [onSell],
  )

  return (
    <StaggerPage className="space-y-6 pb-28">
      <motion.header variants={fadeSlideUp} className="px-1">
        <h1 className="tm-premium-title text-3xl sm:text-4xl">Paper trade</h1>
        <p className="mt-2 text-[1.1rem] text-[#a7b0a8]">
          Portfolio up top. Watchlist below — neon line tracks your last {WATCHLIST_POINTS} ticks (local ticks + optional
          Finnhub seed).
        </p>
      </motion.header>

      <Card title="Portfolio" subtitle="Cash + holdings" accent="neon" glowRgb="0, 255, 136">
        <div className="grid grid-cols-2 gap-3">
          <div className={subPanel}>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[#6b756c]">Cash</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#e9ece8]">${balance.toFixed(2)}</p>
          </div>
          <div className={subPanel}>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[#2979ff]">Total</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#2979ff]">${portfolioValue.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <motion.div variants={fadeSlideUp}>
        <h2 className="tm-headline mb-4 px-1 text-lg sm:text-xl">Watchlist</h2>
        <div className="space-y-2">
          {stocks.map((s) => (
            <StockCard
              key={s.id}
              stock={s}
              livePrice={live[s.id]?.price ?? s.basePrice}
              liveChangePct={live[s.id]?.changePct ?? s.changePercent}
              shares={portfolio[s.id] ?? 0}
              balance={balance}
              sparkValues={watchLines[s.id] ?? [live[s.id]?.price ?? s.basePrice, live[s.id]?.price ?? s.basePrice]}
              expanded={expandedId === s.id}
              onToggleExpand={() => setExpandedId((id) => (id === s.id ? null : s.id))}
              onBuy={() => handleBuy(s.id, live[s.id]?.price ?? s.basePrice)}
              onSell={() => handleSell(s.id, live[s.id]?.price ?? s.basePrice)}
            />
          ))}
        </div>
      </motion.div>

      <Card title="Disclosure" subtitle="Not real markets" accent="neutral" glowRgb="160, 165, 175">
        <p className="text-sm leading-relaxed text-[#6b756c]">
          External market data is delayed and subject to vendor limits. Not advice.
        </p>
      </Card>
    </StaggerPage>
  )
}
