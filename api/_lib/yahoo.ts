/**
 * Yahoo Finance chart proxy shared by the Vercel function (api/chart.ts) and
 * the Vite dev middleware (vite.config.ts). Browsers can't call Yahoo
 * directly (no CORS), so both environments go through this server-side hop.
 */

export const ALLOWED_SYMBOLS = new Set(['SPY', 'AAPL', 'TSLA', 'PLTR', 'NVDA', 'AMZN', 'RBLX', 'BTC-USD'])

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
  /** Unix seconds, open, high, low, close */
  points: { t: number; o: number; h: number; l: number; c: number }[]
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
      indicators?: {
        quote?: {
          open?: (number | null)[]
          high?: (number | null)[]
          low?: (number | null)[]
          close?: (number | null)[]
        }[]
      }
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
  const q = result.indicators?.quote?.[0] ?? {}
  const points: ChartPayload['points'] = []
  for (let i = 0; i < ts.length; i++) {
    const c = q.close?.[i]
    if (typeof c !== 'number' || !Number.isFinite(c)) continue
    const num = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : c)
    points.push({ t: ts[i], o: num(q.open?.[i]), h: num(q.high?.[i]), l: num(q.low?.[i]), c })
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

export type NewsItem = {
  title: string
  publisher: string
  link: string
  /** Unix seconds */
  publishedAt: number
}

type YahooSearch = {
  news?: { title?: string; publisher?: string; link?: string; providerPublishTime?: number }[]
}

/** Latest headlines mentioning a symbol (Yahoo search endpoint, no key needed). */
export async function fetchYahooNews(symbol: string, count = 5): Promise<NewsItem[]> {
  const url = new URL('https://query1.finance.yahoo.com/v1/finance/search')
  url.searchParams.set('q', symbol)
  url.searchParams.set('newsCount', String(count))
  url.searchParams.set('quotesCount', '0')
  const res = await fetch(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`yahoo ${res.status}`)
  const data = (await res.json()) as YahooSearch
  const out: NewsItem[] = []
  for (const n of data.news ?? []) {
    if (!n.title || !n.link || !/^https:\/\//.test(n.link)) continue
    out.push({
      title: n.title,
      publisher: n.publisher ?? '',
      link: n.link,
      publishedAt: typeof n.providerPublishTime === 'number' ? n.providerPublishTime : 0,
    })
  }
  return out
}
