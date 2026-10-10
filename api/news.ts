/**
 * Vercel serverless function: GET /api/news?symbol=NVDA
 * Latest headlines for one watchlist symbol, proxied from Yahoo Finance.
 */

import { ALLOWED_SYMBOLS, fetchYahooNews } from './_lib/yahoo.js'

import { allowRequestInMemory, clientIp } from './_lib/rate-limit.js'

type VercelRequest = {
  method?: string
  headers?: Record<string, string | string[] | undefined>
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

  // Read-only and edge-cached, so a per-instance counter is proportionate here;
  // it blunts a burst without adding a database round trip to every request.
  if (!allowRequestInMemory(`news:` + clientIp(req.headers ?? {}), 60, 60)) {
    res.status(429).json({ ok: false, error: 'Too many requests. Slow down.' })
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
    console.error('upstream fetch failed:', err)
    res.status(502).json({ ok: false, error: 'Upstream error' })
  }
}
