import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChartPoint, ChartRange } from '../lib/market'

type PriceChartProps = {
  points: ChartPoint[]
  range: ChartRange
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

export function PriceChart({ points, range, previousClose, height = 240, loading = false }: PriceChartProps) {
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

  const geom = useMemo(() => {
    if (points.length < 2 || plotW <= 0) return null
    const closes = points.map((p) => p.c)
    let min = Math.min(...closes)
    let max = Math.max(...closes)
    if (range === '1d' && typeof previousClose === 'number') {
      min = Math.min(min, previousClose)
      max = Math.max(max, previousClose)
    }
    const span = max - min || max * 0.01 || 1
    min -= span * 0.06
    max += span * 0.06
    const x = (i: number) => (i / (points.length - 1)) * plotW
    const y = (v: number) => PAD_TOP + (1 - (v - min) / (max - min)) * plotH
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.c).toFixed(1)}`).join(' ')
    const area = `${line} L${plotW.toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} L0,${(PAD_TOP + plotH).toFixed(1)} Z`
    const yTicks = niceTicks(min, max, 4)
    const xTickCount = width < 420 ? 3 : 5
    const xTicks = Array.from({ length: xTickCount }, (_, k) =>
      Math.round((k / (xTickCount - 1)) * (points.length - 1)),
    )
    return { min, max, x, y, line, area, yTicks, xTicks }
  }, [points, plotW, plotH, range, previousClose, width])

  const baseline = range === '1d' && typeof previousClose === 'number' ? previousClose : points[0]?.c
  const last = points[points.length - 1]?.c
  const up = typeof last === 'number' && typeof baseline === 'number' ? last >= baseline : true
  const color = up ? UP : DOWN
  const gradId = up ? 'tm-chart-up' : 'tm-chart-down'

  const hover = hoverIdx !== null && geom ? points[hoverIdx] : null

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ height }}>
      {geom ? (
        <svg
          width={width}
          height={height}
          className="block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const px = e.clientX - rect.left
            if (px < 0 || px > plotW) return setHoverIdx(null)
            setHoverIdx(Math.round((px / plotW) * (points.length - 1)))
          }}
          onMouseLeave={() => setHoverIdx(null)}
          onTouchMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const px = e.touches[0].clientX - rect.left
            if (px < 0 || px > plotW) return
            setHoverIdx(Math.round((px / plotW) * (points.length - 1)))
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

          {range === '1d' && typeof previousClose === 'number' ? (
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

          <path d={geom.area} fill={`url(#${gradId})`} />
          <path
            d={geom.line}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

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
              <circle cx={geom.x(hoverIdx)} cy={geom.y(hover.c)} r={4} fill={color} stroke="#121a15" strokeWidth={2} />
            </g>
          ) : null}
        </svg>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-[#6b756c]">
          {loading ? 'Loading chart…' : 'No chart data'}
        </div>
      )}

      {hover ? (
        <div
          className="pointer-events-none absolute top-0 rounded-md border border-[#39423b] bg-[#0f1412] px-2 py-1 text-[11px]"
          style={{
            left: Math.min(Math.max(0, geom!.x(hoverIdx!) - 60), Math.max(0, plotW - 120)),
          }}
        >
          <span className="font-mono font-bold text-[#e9ece8]">${fmtPrice(hover.c)}</span>
          <span className="ml-2 text-[#a7b0a8]">{fmtTooltipTime(hover.t, range)}</span>
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
