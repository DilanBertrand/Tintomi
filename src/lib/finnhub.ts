/**
 * Finnhub REST (free tier). Set VITE_FINNHUB_TOKEN in .env (see .env.example).
 * https://finnhub.io/docs/api/stock-candles
 */

export async function fetchCandleCloses(symbol: string): Promise<number[] | null> {
  const token = import.meta.env.VITE_FINNHUB_TOKEN as string | undefined
  if (!token) return null

  const to = Math.floor(Date.now() / 1000)
  const from = to - 86400 * 10

  try {
    const url = new URL('https://finnhub.io/api/v1/stock/candle')
    url.searchParams.set('symbol', symbol)
    url.searchParams.set('resolution', '15')
    url.searchParams.set('from', String(from))
    url.searchParams.set('to', String(to))
    url.searchParams.set('token', token)

    const res = await fetch(url.toString())
    if (!res.ok) return null
    const data = (await res.json()) as { s?: string; c?: number[] }
    if (data.s !== 'ok' || !Array.isArray(data.c) || data.c.length < 2) return null
    return data.c
  } catch {
    return null
  }
}
