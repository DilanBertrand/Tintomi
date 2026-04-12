import { motion } from 'framer-motion'
import type { Stock } from '../data/stocks'
import { fadeSlideUp } from '../motion/variants'
import { Sparkline } from './Sparkline'

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" title="Live">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF88] opacity-45"
        aria-hidden
      />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.95),0_0_24px_rgba(0,255,136,0.45)]" />
    </span>
  )
}

type StockCardProps = {
  stock: Stock
  livePrice: number
  liveChangePct: number
  shares: number
  balance: number
  /** Last ~20 price samples — neon line */
  sparkValues: number[]
  expanded: boolean
  onToggleExpand: () => void
  onBuy: () => void
  onSell: () => void
}

export function StockCard({
  stock,
  livePrice,
  liveChangePct,
  shares,
  balance,
  sparkValues,
  expanded,
  onToggleExpand,
  onBuy,
  onSell,
}: StockCardProps) {
  const up = liveChangePct >= 0
  const canBuy = balance >= livePrice - 1e-9
  const canSell = shares > 0
  const priceColor = up ? 'text-[#00FF88]' : 'text-[#FF2D92]'

  const series =
    sparkValues.length >= 2 ? sparkValues : [livePrice, Math.max(0.01, livePrice * 1.002)]

  const compactW = 72
  const compactH = 28
  const bigW = 320
  const bigH = 88

  return (
    <motion.div
      variants={fadeSlideUp}
      layout
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#00FF88]/35 bg-[#0A0A0A] px-4 py-3 shadow-[0_0_48px_rgba(0,255,136,0.1),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:scale-[1.03] hover:border-[#00FF88]/55 hover:shadow-[0_0_72px_rgba(0,255,136,0.18)]"
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${stock.symbol}. Tap to ${expanded ? 'shrink' : 'enlarge'} chart.`}
      onClick={() => onToggleExpand()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggleExpand()
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 blur-3xl transition-opacity duration-300 group-hover:opacity-70"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,136,0.18), transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="bg-gradient-to-r from-[#d4a574] to-[#f0f4f8] bg-clip-text text-xs font-semibold text-transparent">
              {stock.symbol}
            </p>
            <p className="truncate text-sm font-semibold text-white">{stock.name}</p>
            <p className="mt-1 text-[10px] text-neutral-500">Living line · last {series.length} ticks · tap to zoom</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-2">
              <LiveDot />
              <p className={`font-mono text-sm font-bold ${priceColor}`}>${livePrice.toFixed(2)}</p>
            </div>
            <p className={`text-xs font-bold uppercase tracking-tighter ${up ? 'text-[#00FF88]' : 'text-[#FF2D92]'}`}>
              {up ? '+' : ''}
              {liveChangePct.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex justify-end sm:justify-center">
          {expanded ? (
            <Sparkline
              values={series}
              width={bigW}
              height={bigH}
              positive
              prominent
              fluid
              className="block w-full max-w-sm"
            />
          ) : (
            <Sparkline values={series} width={compactW} height={compactH} positive />
          )}
        </div>

        <div
          data-trade
          className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-tighter text-neutral-500">Shares</p>
            <p className="font-mono text-sm text-neutral-300">{shares}</p>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={!canBuy}
              onClick={(e) => {
                e.stopPropagation()
                onBuy()
              }}
              className="min-h-[40px] min-w-[5rem] rounded-xl bg-[#00FF88] px-4 py-2 text-xs font-black uppercase tracking-tight text-black shadow-[0_0_24px_rgba(0,255,136,0.55),inset_0_1px_0_0_rgba(255,255,255,0.4)] transition-all hover:shadow-[0_0_36px_rgba(0,255,136,0.75)] active:translate-y-px disabled:opacity-35"
            >
              Buy
            </button>
            <button
              type="button"
              disabled={!canSell}
              onClick={(e) => {
                e.stopPropagation()
                onSell()
              }}
              className="min-h-[40px] min-w-[5rem] rounded-xl border border-[#FF2D92]/35 bg-[#141414] px-4 py-2 text-xs font-black uppercase tracking-tight text-white shadow-[0_0_18px_rgba(255,45,146,0.2)] transition-all hover:shadow-[0_0_28px_rgba(255,45,146,0.35)] active:translate-y-px disabled:opacity-35"
            >
              Sell
            </button>
          </div>
        </div>
      </div>

      <p className="relative mt-2 text-xs leading-relaxed text-neutral-500">{stock.blurb}</p>
    </motion.div>
  )
}
