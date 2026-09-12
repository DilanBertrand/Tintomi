/**
 * Vercel serverless function: GET /api/chart?symbol=NVDA&range=1d
 * Proxies Yahoo Finance chart data for the paper-trading page. Only the
 * watchlist symbols are allowed so the endpoint can't be used as an open proxy.
 */

import { ALLOWED_SYMBOLS, fetchYahooChart, isChartRange } from './_lib/yahoo'

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
  const range = first(req.query?.range) ?? '1d'
  if (!ALLOWED_SYMBOLS.has(symbol) || !isChartRange(range)) {
    res.status(400).json({ ok: false, error: 'Unknown symbol or range' })
    return
  }

  try {
    const payload = await fetchYahooChart(symbol, range)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json({ ok: true, ...payload })
  } catch (err) {
    res.status(502).json({ ok: false, error: err instanceof Error ? err.message : 'Upstream error' })
  }
}
