import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { PriceChart, type ChartStyle } from '../components/PriceChart'
import { StaggerPage } from '../components/StaggerPage'
import { Sparkline } from '../components/Sparkline'
import { TraderLeaderboard } from '../components/TraderLeaderboard'
import { holdingLabel, lotPrice, stocks } from '../data/stocks'
import { CHART_RANGES, fetchChart, type ChartData, type ChartRange } from '../lib/market'
import { fadeSlideUp } from '../motion/variants'

export type Portfolio = Record<string, number>

export type LivePrices = Record<string, { price: number; changePct: number }>

export type PriceHistory = Record<string, number[]>

const CHART_REFRESH_MS = 60_000

type InvestProps = {
  userId: string
  /** Daily net-worth snapshots recorded by App (this device, up to 90 days). */
  netWorthHistory: { date: string; value: number }[]
  balance: number
  portfolio: Portfolio
  live: LivePrices
  /** Today's intraday closes per stock — used for the watchlist sparklines */
  chartSeries: PriceHistory
  onBuy: (stockId: string, price: number) => void
  onSell: (stockId: string, price: number) => void
  /** Stock to show first (set when arriving from Home); changes re-select. */
  focusStockId?: string | null
}

const subPanel =
  'rounded-xl border border-[#2979ff]/30 bg-[#121a15] p-3 transition-all duration-300 hover:border-[#2979ff]/45 '

const pill = 'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors'
const pillOn = 'bg-[#e9ece8] text-[#0f1412]'
const pillOff = 'border border-[#39423b] text-[#a7b0a8] hover:border-[#5c665e] hover:text-[#e9ece8]'

function fmtMoney(v: number) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isNewYorkWeekend(now = new Date()) {
  const day = now.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short' })
  return day === 'Sat' || day === 'Sun'
}

/** Regular session: Mon-Fri 9:30-16:00 New York time (holidays come from the data feed's state). */
function isWithinRegularHours(now = new Date()) {
  if (isNewYorkWeekend(now)) return false
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  const mins = h * 60 + m
  return mins >= 9 * 60 + 30 && mins < 16 * 60
}

function MarketClosedBanner({ state }: { state: string }) {
  // Trust the feed when it gives a definite answer; if it reports UNKNOWN
  // (seen on some responses) fall back to the clock so we never show
  // "closed" mid-session.
  const open = state === 'REGULAR' || (state === 'UNKNOWN' && isWithinRegularHours())
  if (open) return null
  const weekend = isNewYorkWeekend()
  return (
    <motion.div
      variants={fadeSlideUp}
      role="status"
      className="rounded-2xl border border-[#e0b455]/40 bg-[#e0b455]/10 px-4 py-4 text-center"
    >
      <p className="tm-premium-title text-lg text-[#e0b455] sm:text-xl">
        {weekend ? 'Stock market is closed on weekends' : 'Stock market is closed right now'}
      </p>
      <p className="mt-1 text-sm text-[#a7b0a8]">
        {weekend
          ? 'Trading resumes Monday 9:30 AM New York time. Prices below are from the last session.'
          : 'Open Monday to Friday, 9:30 AM to 4:00 PM New York time. Prices below are from the last session.'}
      </p>
    </motion.div>
  )
}

function marketLabel(state: string, alwaysOpen?: boolean) {
  if (alwaysOpen) return 'Trades 24/7'
  if (state === 'REGULAR') return 'Market open'
  if (state === 'PRE') return 'Pre-market'
  if (state === 'POST' || state === 'POSTPOST') return 'After hours'
  return 'Market closed'
}

export function Invest({
  userId,
  netWorthHistory,
  balance,
  portfolio,
  live,
  chartSeries,
  onBuy,
  onSell,
  focusStockId,
}: InvestProps) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [selectedId, setSelectedId] = useState(() =>
    focusStockId && stocks.some((s) => s.id === focusStockId) ? focusStockId : stocks[0].id,
  )
  const [range, setRange] = useState<ChartRange>('1d')
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles')
  const [charts, setCharts] = useState<Record<string, ChartData>>({})
  const [chartLoading, setChartLoading] = useState(false)
  const chartCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusStockId && stocks.some((s) => s.id === focusStockId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- responds to navigation from Home
      setSelectedId(focusStockId)
    }
  }, [focusStockId])

  const selected = stocks.find((s) => s.id === selectedId) ?? stocks[0]
  const chartKey = `${selected.symbol}:${range}`
  const chart = charts[chartKey]

  // Load the selected symbol/range; the 1D view keeps refreshing while open.
  useEffect(() => {
    const ctrl = new AbortController()
    let timer: number | undefined

    async function load() {
      setChartLoading(true)
      const data = await fetchChart(selected.symbol, range, ctrl.signal)
      if (ctrl.signal.aborted) return
      if (data) setCharts((prev) => ({ ...prev, [chartKey]: data }))
      setChartLoading(false)
      if (range === '1d') timer = window.setTimeout(load, CHART_REFRESH_MS)
    }

    void load()
    return () => {
      ctrl.abort()
      if (timer) window.clearTimeout(timer)
    }
  }, [selected.symbol, range, chartKey])

  const price = live[selected.id]?.price ?? chart?.price ?? selected.basePrice
  const dayChangePct = live[selected.id]?.changePct ?? chart?.changePct ?? selected.changePercent

  // Change over the visible range (1D uses the previous close, like a broker app).
  const rangeChange = useMemo(() => {
    if (!chart || chart.points.length < 2) return null
    const start = range === '1d' ? chart.previousClose : chart.points[0].c
    const end = range === '1d' ? price : chart.points[chart.points.length - 1].c
    if (!(start > 0)) return null
    return { abs: end - start, pct: ((end - start) / start) * 100 }
  }, [chart, range, price])

  const shares = portfolio[selected.id] ?? 0
  // Wallet units: whole shares for stocks, 0.001 BTC lots for Bitcoin.
  const unitPrice = lotPrice(selected, price)
  const canBuy = balance >= unitPrice - 1e-9
  const canSell = shares > 0
  const up = (rangeChange?.pct ?? dayChangePct) >= 0

  const portfolioValue = useMemo(() => {
    let sum = balance
    for (const s of stocks) {
      const held = portfolio[s.id] ?? 0
      sum += held * lotPrice(s, live[s.id]?.price ?? s.basePrice)
    }
    return sum
  }, [balance, portfolio, live])

  // Any 1D response carries the exchange state; SPY is always loaded first.
  const marketState = charts[`${stocks[0].symbol}:1d`]?.marketState ?? chart?.marketState

  const pickStock = (id: string) => {
    setSelectedId(id)
    chartCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <StaggerPage className="space-y-6 pb-28">
      {marketState ? <MarketClosedBanner state={marketState} /> : null}
      <motion.header variants={fadeSlideUp} className="px-1">
        <h1 className="tm-premium-title text-3xl sm:text-4xl">Paper trade</h1>
        <p className="mt-2 text-[1.1rem] text-[#a7b0a8]">
          Real market prices, fake money. Pick a stock, choose a time range, and trade with your $
          {fmtMoney(balance)} of play cash.
        </p>
      </motion.header>

      <TraderLeaderboard userId={userId} live={live} />

      <Card title="Portfolio" subtitle="Cash + holdings" accent="neon" glowRgb="0, 255, 136">
        <div className="grid grid-cols-2 gap-3">
          <div className={subPanel}>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[#6b756c]">Cash</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#e9ece8]">${fmtMoney(balance)}</p>
          </div>
          <div className={subPanel}>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[#2979ff]">Total</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#2979ff]">${fmtMoney(portfolioValue)}</p>
          </div>
        </div>
        {netWorthHistory.length >= 2 ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] font-bold uppercase tracking-tighter text-[#6b756c]">
                Net worth · last {netWorthHistory.length} days
              </p>
              {(() => {
                const first = netWorthHistory[0].value
                const last = netWorthHistory[netWorthHistory.length - 1].value
                const pct = first > 0 ? ((last - first) / first) * 100 : 0
                const nwUp = pct >= 0
                return (
                  <p className={`font-mono text-xs font-semibold ${nwUp ? 'text-[#00d18f]' : 'text-[#ff6b5e]'}`}>
                    {nwUp ? '+' : ''}
                    {pct.toFixed(2)}%
                  </p>
                )
              })()}
            </div>
            <Sparkline
              values={netWorthHistory.map((e) => e.value)}
              height={56}
              fluid
              prominent
              positive={netWorthHistory[netWorthHistory.length - 1].value >= netWorthHistory[0].value}
              className="mt-2"
            />
          </div>
        ) : (
          <p className="mt-4 text-xs text-[#5c665e]">
            Your net-worth chart starts building from today — check back tomorrow.
          </p>
        )}
      </Card>

      <div ref={chartCardRef} className="scroll-mt-4">
        <Card accent="neon">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stocks.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={`${pill} ${s.id === selected.id ? pillOn : pillOff}`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold text-[#2979ff]">{selected.symbol}</p>
              <h3 className="tm-premium-title truncate text-lg sm:text-xl">{selected.name}</h3>
              <p className="mt-1 text-[10px] text-[#6b756c]">
                {chart ? marketLabel(chart.marketState, selected.alwaysOpen) : 'Loading…'} · updates every minute
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`font-mono text-2xl font-bold ${up ? 'text-[#2979ff]' : 'text-[#e06a55]'}`}>
                ${fmtMoney(price)}
              </p>
              {rangeChange ? (
                <p className={`font-mono text-xs font-semibold ${up ? 'text-[#2979ff]' : 'text-[#e06a55]'}`}>
                  {up ? '+' : ''}
                  {fmtMoney(rangeChange.abs)} ({up ? '+' : ''}
                  {rangeChange.pct.toFixed(2)}%)
                  <span className="ml-1 text-[#6b756c]">{range === '1d' ? 'today' : range.toUpperCase()}</span>
                </p>
              ) : (
                <p className={`font-mono text-xs font-semibold ${up ? 'text-[#2979ff]' : 'text-[#e06a55]'}`}>
                  {up ? '+' : ''}
                  {dayChangePct.toFixed(2)}% today
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {CHART_RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold transition-colors ${
                    r.id === range ? 'bg-[#232b25] text-[#e9ece8]' : 'text-[#6b756c] hover:text-[#a7b0a8]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-md border border-[#232b25] p-0.5">
              {(['candles', 'line'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setChartStyle(st)}
                  aria-pressed={chartStyle === st}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter transition-colors ${
                    chartStyle === st ? 'bg-[#232b25] text-[#e9ece8]' : 'text-[#6b756c] hover:text-[#a7b0a8]'
                  }`}
                >
                  {st === 'candles' ? 'Candles' : 'Line'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <PriceChart
              points={chart?.points ?? []}
              range={range}
              style={chartStyle}
              previousClose={chart?.previousClose}
              loading={chartLoading}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#232b25] pt-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tighter text-[#6b756c]">You own</p>
              <p className="font-mono text-sm text-[#a7b0a8]">
                {holdingLabel(selected, shares)}
                {shares > 0 ? <span className="text-[#6b756c]"> · ${fmtMoney(shares * unitPrice)}</span> : null}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => onBuy(selected.id, unitPrice)}
                className="min-h-[40px] min-w-[5rem] rounded-full bg-[#e9ece8] px-4 py-2 text-xs font-bold text-[#0f1412] transition-all active:translate-y-px disabled:opacity-35"
              >
                Buy {holdingLabel(selected, 1).replace(/^1 share$/, '1')}
              </button>
              <button
                type="button"
                disabled={!canSell}
                onClick={() => onSell(selected.id, unitPrice)}
                className="min-h-[40px] min-w-[5rem] rounded-full border border-[#39423b] bg-transparent px-4 py-2 text-xs font-bold text-[#e9ece8] transition-all active:translate-y-px disabled:opacity-35"
              >
                Sell {holdingLabel(selected, 1).replace(/^1 share$/, '1')}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#6b756c]">{selected.blurb}</p>
        </Card>
      </div>

      <motion.div variants={fadeSlideUp}>
        <h2 className="tm-headline mb-4 px-1 text-lg sm:text-xl">Watchlist</h2>
        <div className="space-y-2">
          {stocks.map((s) => {
            const p = live[s.id]?.price ?? s.basePrice
            const pct = live[s.id]?.changePct ?? s.changePercent
            const sUp = pct >= 0
            const held = portfolio[s.id] ?? 0
            const spark = chartSeries[s.id] ?? [p, p]
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickStock(s.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border bg-[#121a15] px-4 py-3 text-left transition-all duration-300 hover:border-[#39423b] ${
                  s.id === selected.id ? 'border-[#2979ff]/50' : 'border-[#232b25]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#e9ece8]">{s.name}</p>
                  <p className="font-mono text-[11px] text-[#6b756c]">
                    {s.symbol}
                    {held > 0 ? ` · ${holdingLabel(s, held)} owned` : ''}
                  </p>
                </div>
                <Sparkline values={spark.length >= 2 ? spark : [p, p]} width={72} height={28} positive={sUp} />
                <div className="w-[5.5rem] shrink-0 text-right">
                  <p className="font-mono text-sm font-bold text-[#e9ece8]">${fmtMoney(p)}</p>
                  <p className={`font-mono text-xs font-semibold ${sUp ? 'text-[#2979ff]' : 'text-[#e06a55]'}`}>
                    {sUp ? '+' : ''}
                    {pct.toFixed(2)}%
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>

      <Card title="Disclosure" subtitle="Not real markets" accent="neutral" glowRgb="160, 165, 175">
        <p className="text-sm leading-relaxed text-[#6b756c]">
          Prices come from public market data and may be delayed. Trades here use play money only. Not advice.
        </p>
      </Card>
    </StaggerPage>
  )
}
