/**
 * Vercel serverless function: GET /api/news?symbol=NVDA
 * Latest headlines for one watchlist symbol, proxied from Yahoo Finance.
 */

import { ALLOWED_SYMBOLS, fetchYahooNews } from './_lib/yahoo.js'

type VercelRequest = {
  method?: string
  query?: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => { json: (body: unknown) => void }
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }
  const symbol = (first(req.query?.symbol) ?? '').toUpperCase()
  if (!ALLOWED_SYMBOLS.has(symbol)) {
    res.status(400).json({ ok: false, error: 'Unknown symbol' })
    return
  }
  try {
    const items = await fetchYahooNews(symbol)
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600')
    res.status(200).json({ ok: true, symbol, items })
  } catch (err) {
    res.status(502).json({ ok: false, error: err instanceof Error ? err.message : 'Upstream error' })
  }
}
