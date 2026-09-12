import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChartPoint, ChartRange } from '../lib/market'

export type ChartStyle = 'candles' | 'line'

type PriceChartProps = {
  points: ChartPoint[]
  range: ChartRange
  style?: ChartStyle
  /** Previous session close — drawn as a dashed reference line on the 1D view */
  previousClose?: number
  height?: number
  loading?: boolean
}

const UP = '#2979ff'
const DOWN = '#e06a55'
const AXIS_W = 52
const PAD_TOP = 10
const PAD_BOTTOM = 22
/** Intraday views get many bars; cap so candles stay legible on a phone. */
const MAX_CANDLES = 78

function fmtPrice(v: number) {
  return v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v.toFixed(2)
}

// Axis and tooltip times are shown in US market time, not the viewer's zone.
const TZ = { timeZone: 'America/New_York' } as const

function fmtTime(t: number, range: ChartRange) {
  const d = new Date(t * 1000)
  if (range === '1d') return d.toLocaleTimeString('en-US', { ...TZ, hour: 'numeric', minute: '2-digit' })
  if (range === '1w') return d.toLocaleDateString('en-US', { ...TZ, weekday: 'short', hour: 'numeric' })
  if (range === '1y') return d.toLocaleDateString('en-US', { ...TZ, month: 'short', year: '2-digit' })
  return d.toLocaleDateString('en-US', { ...TZ, month: 'short', day: 'numeric' })
}

function fmtTooltipTime(t: number, range: ChartRange) {
  const d = new Date(t * 1000)
  if (range === '1d' || range === '1w') {
    return `${d.toLocaleString('en-US', { ...TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} ET`
  }
  return d.toLocaleDateString('en-US', { ...TZ, month: 'short', day: 'numeric', year: 'numeric' })
}

function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min || 1
  const rawStep = span / count
  const mag = 10 ** Math.floor(Math.log10(rawStep))
  const norm = rawStep / mag
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag
  const out: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(v)
  return out
}

/** Merge consecutive bars so at most `max` candles are drawn; OHLC aggregates correctly. */
function downsample(points: ChartPoint[], max: number): ChartPoint[] {
  if (points.length <= max) return points
  const per = Math.ceil(points.length / max)
  const out: ChartPoint[] = []
  for (let i = 0; i < points.length; i += per) {
    const chunk = points.slice(i, i + per)
    out.push({
      t: chunk[0].t,
      o: chunk[0].o,
      h: Math.max(...chunk.map((p) => p.h)),
      l: Math.min(...chunk.map((p) => p.l)),
      c: chunk[chunk.length - 1].c,
    })
  }
  return out
}

export function PriceChart({
  points: rawPoints,
  range,
  style = 'candles',
  previousClose,
  height = 240,
  loading = false,
}: PriceChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth(Math.floor(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const plotW = Math.max(0, width - AXIS_W)
  const plotH = height - PAD_TOP - PAD_BOTTOM

  const points = useMemo(
    () => (style === 'candles' ? downsample(rawPoints, MAX_CANDLES) : rawPoints),
    [rawPoints, style],
  )

  const geom = useMemo(() => {
    if (points.length < 2 || plotW <= 0) return null
    let min = Infinity
    let max = -Infinity
    for (const p of points) {
      if (style === 'candles') {
        min = Math.min(min, p.l)
        max = Math.max(max, p.h)
      } else {
        min = Math.min(min, p.c)
        max = Math.max(max, p.c)
      }
    }
    // Stretch to the previous close only when it is near the session's range;
    // a big gap day would otherwise squash the bars into a sliver.
    let showPrevClose = false
    if (range === '1d' && typeof previousClose === 'number') {
      const dataSpan = max - min || max * 0.01 || 1
      const overshoot = Math.max(min - previousClose, previousClose - max, 0)
      if (overshoot <= dataSpan * 0.6) {
        showPrevClose = true
        min = Math.min(min, previousClose)
        max = Math.max(max, previousClose)
      }
    }
    const span = max - min || max * 0.01 || 1
    min -= span * 0.06
    max += span * 0.06
    // Candles are centred in equal slots; the line uses the full width.
    const slot = plotW / points.length
    const x = (i: number) => (style === 'candles' ? slot * (i + 0.5) : (i / (points.length - 1)) * plotW)
    const y = (v: number) => PAD_TOP + (1 - (v - min) / (max - min)) * plotH
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.c).toFixed(1)}`).join(' ')
    const area = `${line} L${x(points.length - 1).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} Z`
    const candleW = Math.max(2, Math.min(12, slot * 0.65))
    const yTicks = niceTicks(min, max, 4)
    const xTickCount = width < 420 ? 3 : 5
    const xTicks = Array.from({ length: xTickCount }, (_, k) =>
      Math.round((k / (xTickCount - 1)) * (points.length - 1)),
    )
    return { min, max, x, y, line, area, slot, candleW, yTicks, xTicks, showPrevClose }
  }, [points, plotW, plotH, range, previousClose, width, style])

  const baseline = range === '1d' && typeof previousClose === 'number' ? previousClose : points[0]?.c
  const last = points[points.length - 1]?.c
  const up = typeof last === 'number' && typeof baseline === 'number' ? last >= baseline : true
  const color = up ? UP : DOWN
  const gradId = up ? 'tm-chart-up' : 'tm-chart-down'

  const hover = hoverIdx !== null && geom ? points[hoverIdx] : null

  const idxFromX = (px: number) => {
    if (!geom) return null
    if (px < 0 || px > plotW) return null
    if (style === 'candles') return Math.min(points.length - 1, Math.floor(px / geom.slot))
    return Math.round((px / plotW) * (points.length - 1))
  }

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ height }}>
      {geom ? (
        <svg
          width={width}
          height={height}
          className="block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setHoverIdx(idxFromX(e.clientX - rect.left))
          }}
          onMouseLeave={() => setHoverIdx(null)}
          onTouchMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const idx = idxFromX(e.touches[0].clientX - rect.left)
            if (idx !== null) setHoverIdx(idx)
          }}
          onTouchEnd={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="tm-chart-up" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={UP} stopOpacity={0.28} />
              <stop offset="100%" stopColor={UP} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="tm-chart-down" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={DOWN} stopOpacity={0.28} />
              <stop offset="100%" stopColor={DOWN} stopOpacity={0} />
            </linearGradient>
          </defs>

          {geom.yTicks.map((v) => (
            <g key={v}>
              <line x1={0} x2={plotW} y1={geom.y(v)} y2={geom.y(v)} stroke="#232b25" strokeWidth={1} />
              <text
                x={plotW + 8}
                y={geom.y(v) + 3.5}
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill="#6b756c"
              >
                {fmtPrice(v)}
              </text>
            </g>
          ))}

          {geom.showPrevClose && typeof previousClose === 'number' ? (
            <line
              x1={0}
              x2={plotW}
              y1={geom.y(previousClose)}
              y2={geom.y(previousClose)}
              stroke="#a7b0a8"
              strokeOpacity={0.5}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ) : null}

          {style === 'line' ? (
            <>
              <path d={geom.area} fill={`url(#${gradId})`} />
              <path
                d={geom.line}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            points.map((p, i) => {
              const bull = p.c >= p.o
              const col = bull ? UP : DOWN
              const cx = geom.x(i)
              const top = geom.y(Math.max(p.o, p.c))
              const bottom = geom.y(Math.min(p.o, p.c))
              const dim = hoverIdx !== null && hoverIdx !== i
              return (
                <g key={p.t} opacity={dim ? 0.55 : 1}>
                  <line x1={cx} x2={cx} y1={geom.y(p.h)} y2={geom.y(p.l)} stroke={col} strokeWidth={1} />
                  <rect
                    x={cx - geom.candleW / 2}
                    y={top}
                    width={geom.candleW}
                    height={Math.max(1, bottom - top)}
                    fill={bull ? col : col}
                    fillOpacity={bull ? 0.9 : 1}
                    rx={geom.candleW > 4 ? 1 : 0}
                  />
                </g>
              )
            })
          )}

          {geom.xTicks.map((i, k) => {
            const anchor = k === 0 ? 'start' : k === geom.xTicks.length - 1 ? 'end' : 'middle'
            return (
              <text
                key={i}
                x={geom.x(i)}
                y={height - 6}
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill="#6b756c"
                textAnchor={anchor}
              >
                {fmtTime(points[i].t, range)}
              </text>
            )
          })}

          {hover && hoverIdx !== null ? (
            <g>
              <line
                x1={geom.x(hoverIdx)}
                x2={geom.x(hoverIdx)}
                y1={PAD_TOP}
                y2={PAD_TOP + plotH}
                stroke="#a7b0a8"
                strokeOpacity={0.6}
                strokeWidth={1}
              />
              {style === 'line' ? (
                <circle cx={geom.x(hoverIdx)} cy={geom.y(hover.c)} r={4} fill={color} stroke="#121a15" strokeWidth={2} />
              ) : null}
            </g>
          ) : null}
        </svg>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-[#6b756c]">
          {loading ? 'Loading chart…' : 'No chart data'}
        </div>
      )}

      {hover && geom && hoverIdx !== null ? (
        <div
          className="pointer-events-none absolute top-0 rounded-md border border-[#39423b] bg-[#0f1412] px-2 py-1 font-mono text-[11px]"
          style={{ left: Math.min(Math.max(0, geom.x(hoverIdx) - 80), Math.max(0, plotW - 190)) }}
        >
          {style === 'candles' ? (
            <div className="flex gap-2">
              <span className="text-[#6b756c]">
                O <span className="text-[#e9ece8]">{fmtPrice(hover.o)}</span>
              </span>
              <span className="text-[#6b756c]">
                H <span className="text-[#e9ece8]">{fmtPrice(hover.h)}</span>
              </span>
              <span className="text-[#6b756c]">
                L <span className="text-[#e9ece8]">{fmtPrice(hover.l)}</span>
              </span>
              <span className="text-[#6b756c]">
                C <span className={hover.c >= hover.o ? 'text-[#2979ff]' : 'text-[#e06a55]'}>{fmtPrice(hover.c)}</span>
              </span>
            </div>
          ) : (
            <span className="font-bold text-[#e9ece8]">${fmtPrice(hover.c)}</span>
          )}
          <div className="text-[#a7b0a8]">{fmtTooltipTime(hover.t, range)}</div>
        </div>
      ) : null}

      {loading && geom ? (
        <div className="pointer-events-none absolute right-0 top-0 text-[10px] uppercase tracking-tighter text-[#6b756c]">
          updating…
        </div>
      ) : null}
    </div>
  )
}
