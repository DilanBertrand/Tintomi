/**
 * Yahoo Finance chart proxy shared by the Vercel function (api/chart.ts) and
 * the Vite dev middleware (vite.config.ts). Browsers can't call Yahoo
 * directly (no CORS), so both environments go through this server-side hop.
 */

export const ALLOWED_SYMBOLS = new Set(['SPY', 'AAPL', 'TSLA', 'PLTR', 'NVDA', 'AMZN', 'RBLX'])

export const RANGES = {
  '1d': { range: '1d', interval: '5m' },
  '1w': { range: '5d', interval: '30m' },
  '1m': { range: '1mo', interval: '1d' },
  '3m': { range: '3mo', interval: '1d' },
  '1y': { range: '1y', interval: '1wk' },
} as const

export type ChartRange = keyof typeof RANGES

export type ChartPayload = {
  symbol: string
  price: number
  /** Close of the previous regular session — day change is measured against this. */
  previousClose: number
  changePct: number
  marketState: string
  points: { t: number; c: number }[]
}

type YahooChart = {
  chart?: {
    result?: {
      meta?: {
        regularMarketPrice?: number
        chartPreviousClose?: number
        previousClose?: number
        marketState?: string
      }
      timestamp?: number[]
      indicators?: { quote?: { close?: (number | null)[] }[] }
    }[]
    error?: { description?: string } | null
  }
}

export function isChartRange(v: unknown): v is ChartRange {
  return typeof v === 'string' && v in RANGES
}

export async function fetchYahooChart(symbol: string, range: ChartRange): Promise<ChartPayload> {
  const { range: yRange, interval } = RANGES[range]
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`)
  url.searchParams.set('range', yRange)
  url.searchParams.set('interval', interval)
  url.searchParams.set('includePrePost', 'false')

  const res = await fetch(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`yahoo ${res.status}`)
  const data = (await res.json()) as YahooChart
  const result = data.chart?.result?.[0]
  if (!result?.meta) throw new Error(data.chart?.error?.description ?? 'yahoo: empty result')

  const ts = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []
  const points: { t: number; c: number }[] = []
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i]
    if (typeof c === 'number' && Number.isFinite(c)) points.push({ t: ts[i], c })
  }

  const meta = result.meta
  const price = meta.regularMarketPrice ?? points[points.length - 1]?.c
  if (typeof price !== 'number') throw new Error('yahoo: no price')
  const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? price
  const changePct = previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0

  return {
    symbol,
    price,
    previousClose,
    changePct: Math.round(changePct * 100) / 100,
    marketState: meta.marketState ?? 'UNKNOWN',
    points,
  }
}
