import { motion } from 'framer-motion'
import type { Stock } from '../data/stocks'
import { fadeSlideUp } from '../motion/variants'
import { Sparkline } from './Sparkline'

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" title="Live">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2979ff] opacity-45"
        aria-hidden
      />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2979ff]" />
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
  const priceColor = up ? 'text-[#2979ff]' : 'text-[#e06a55]'

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
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#232b25] bg-[#121a15] px-4 py-3 transition-all duration-300 hover:scale-[1.03] hover:border-[#39423b]"
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
      <div className="relative flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-semibold text-[#2979ff]">
              {stock.symbol}
            </p>
            <p className="truncate text-sm font-semibold text-[#e9ece8]">{stock.name}</p>
            <p className="mt-1 text-[10px] text-[#6b756c]">Living line · last {series.length} ticks · tap to zoom</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-2">
              <LiveDot />
              <p className={`font-mono text-sm font-bold ${priceColor}`}>${livePrice.toFixed(2)}</p>
            </div>
            <p className={`text-xs font-bold uppercase tracking-tighter ${up ? 'text-[#2979ff]' : 'text-[#e06a55]'}`}>
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
          className="flex flex-col gap-3 border-t border-[#232b25] pt-3 sm:flex-row sm:items-center sm:justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[#6b756c]">Shares</p>
            <p className="font-mono text-sm text-[#a7b0a8]">{shares}</p>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={!canBuy}
              onClick={(e) => {
                e.stopPropagation()
                onBuy()
              }}
              className="min-h-[40px] min-w-[5rem] rounded-full bg-[#e9ece8] px-4 py-2 text-xs font-bold text-[#0f1412] transition-all active:translate-y-px disabled:opacity-35"
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
              className="min-h-[40px] min-w-[5rem] rounded-full border border-[#39423b] bg-transparent px-4 py-2 text-xs font-bold text-[#e9ece8] transition-all active:translate-y-px disabled:opacity-35"
            >
              Sell
            </button>
          </div>
        </div>
      </div>

      <p className="relative mt-2 text-xs leading-relaxed text-[#6b756c]">{stock.blurb}</p>
    </motion.div>
  )
}
