/** Client for /api/chart (see api/chart.ts). */

export type ChartRange = '1d' | '1w' | '1m' | '3m' | '1y'

export const CHART_RANGES: { id: ChartRange; label: string }[] = [
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
  { id: '1y', label: '1Y' },
]

/** Unix seconds, open, high, low, close */
export type ChartPoint = { t: number; o: number; h: number; l: number; c: number }

export type ChartData = {
  symbol: string
  price: number
  previousClose: number
  changePct: number
  marketState: string
  points: ChartPoint[]
}

export async function fetchChart(symbol: string, range: ChartRange, signal?: AbortSignal): Promise<ChartData | null> {
  try {
    const res = await fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`, { signal })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<ChartData> & { ok?: boolean }
    if (!data.ok || typeof data.price !== 'number' || !Array.isArray(data.points)) return null
    return {
      symbol: data.symbol ?? symbol,
      price: data.price,
      previousClose: data.previousClose ?? data.price,
      changePct: data.changePct ?? 0,
      marketState: data.marketState ?? 'UNKNOWN',
      points: data.points,
    }
  } catch {
    return null
  }
}

export type NewsItem = { title: string; publisher: string; link: string; publishedAt: number }

export async function fetchNews(symbol: string, signal?: AbortSignal): Promise<NewsItem[]> {
  try {
    const res = await fetch(`/api/news?symbol=${encodeURIComponent(symbol)}`, { signal })
    if (!res.ok) return []
    const data = (await res.json()) as { ok?: boolean; items?: NewsItem[] }
    return data.ok && Array.isArray(data.items) ? data.items : []
  } catch {
    return []
  }
}
