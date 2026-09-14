import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ALLOWED_SYMBOLS, fetchYahooChart, fetchYahooNews, isChartRange } from './api/_lib/yahoo'

/** Serves /api/chart and /api/news in `vite dev` the same way the Vercel functions do in prod. */
function devChartApi(): Plugin {
  return {
    name: 'tintomi-dev-chart-api',
    configureServer(server) {
      server.middlewares.use('/api/news', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const symbol = (url.searchParams.get('symbol') ?? '').toUpperCase()
        res.setHeader('Content-Type', 'application/json')
        if (!ALLOWED_SYMBOLS.has(symbol)) {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, error: 'Unknown symbol' }))
          return
        }
        try {
          const items = await fetchYahooNews(symbol)
          res.end(JSON.stringify({ ok: true, symbol, items }))
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Upstream error' }))
        }
      })
      server.middlewares.use('/api/chart', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const symbol = (url.searchParams.get('symbol') ?? '').toUpperCase()
        const range = url.searchParams.get('range') ?? '1d'
        res.setHeader('Content-Type', 'application/json')
        if (!ALLOWED_SYMBOLS.has(symbol) || !isChartRange(range)) {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, error: 'Unknown symbol or range' }))
          return
        }
        try {
          const payload = await fetchYahooChart(symbol, range)
          res.end(JSON.stringify({ ok: true, ...payload }))
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Upstream error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Load `.env*` from the project root (same folder as this config), same as Vite default but explicit.
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), tailwindcss(), devChartApi()],
})
