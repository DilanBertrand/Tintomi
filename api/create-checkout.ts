/**
 * Vercel serverless function: starts a Stripe Checkout session for Tintomi Pro.
 *
 * SECURITY: the caller is identified by their Supabase access token (sent as a
 * Bearer header), NOT by a user id in the request body — a client cannot start
 * checkout on someone else's behalf. The Stripe secret key, price id, and
 * Supabase service-role key live only in server env vars. is_pro is never set
 * here; only the webhook flips it after Stripe confirms payment.
 */
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

type VercelRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}
type VercelResponse = {
  status: (code: number) => { json: (body: unknown) => void }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  if (!stripeKey || !priceId || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    res.status(503).json({ ok: false, error: 'Pro checkout is not configured yet.' })
    return
  }

  const authHeader = req.headers.authorization
  const token =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : ''
  if (!token) {
    res.status(401).json({ ok: false, error: 'Not signed in.' })
    return
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  const user = userData?.user
  if (userErr || !user) {
    res.status(401).json({ ok: false, error: 'Session expired. Sign in again.' })
    return
  }

  const stripe = new Stripe(stripeKey)

  try {
    // Reuse an existing Stripe customer for this profile if we have one.
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, is_pro')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.is_pro) {
      res.status(400).json({ ok: false, error: 'You are already Pro.' })
      return
    }

    let customerId = profile?.stripe_customer_id as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const origin =
      (typeof req.headers.origin === 'string' && req.headers.origin) ||
      process.env.APP_URL ||
      'https://www.tintomi.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // Redundant identity signals so the webhook can always map back to the user.
      client_reference_id: user.id,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: `${origin}/learn?pro=success`,
      cancel_url: `${origin}/learn?pro=cancelled`,
      allow_promotion_codes: true,
    })

    res.status(200).json({ ok: true, url: session.url })
  } catch (err) {
    console.error('create-checkout failed:', err)
    res.status(502).json({
      ok: false,
      error: 'Could not start checkout. Try again shortly.',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
