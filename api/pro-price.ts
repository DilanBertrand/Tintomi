/**
 * Vercel serverless function: GET /api/pro-price
 *
 * Returns the live price of the Tintomi Pro subscription straight from Stripe.
 * The UI reads it from here rather than hard-coding a number, so the amount a
 * user is shown before checkout can never drift from the amount they are
 * actually charged — which is what consumer law requires us to disclose.
 */
import Stripe from 'stripe'

type VercelRequest = { method?: string }
type VercelResponse = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => { json: (body: unknown) => void }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  if (!stripeKey || !priceId) {
    res.status(503).json({ ok: false, error: 'Pro is not configured yet.' })
    return
  }

  try {
    const stripe = new Stripe(stripeKey)
    const price = await stripe.prices.retrieve(priceId)
    if (typeof price.unit_amount !== 'number' || !price.currency) {
      res.status(502).json({ ok: false, error: 'Price is not usable.' })
      return
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({
      ok: true,
      // Minor units (cents). The client formats it for display.
      unitAmount: price.unit_amount,
      currency: price.currency.toUpperCase(),
      interval: price.recurring?.interval ?? null,
      intervalCount: price.recurring?.interval_count ?? 1,
    })
  } catch (err) {
    console.error('pro-price failed:', err)
    res.status(502).json({ ok: false, error: 'Could not load the price.' })
  }
}
