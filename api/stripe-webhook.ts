/**
 * Vercel serverless function: Stripe webhook — the ONLY place is_pro is set.
 *
 * SECURITY: every request is verified against STRIPE_WEBHOOK_SECRET using the
 * raw request body, so a forged POST cannot grant Pro. Supabase writes use the
 * service-role key (bypasses RLS) and only ever touch the profile mapped from
 * the Stripe customer/metadata — never a user-supplied id.
 *
 * Vercel's Node runtime would JSON-parse req.body and destroy the exact bytes
 * Stripe signs, so we disable the body parser and read the raw stream instead.
 */
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { IncomingMessage } from 'node:http'

export const config = { api: { bodyParser: false } }

type VercelResponse = {
  status: (code: number) => { json: (body: unknown) => void; send: (body: string) => void }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer))
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: IncomingMessage & { method?: string }, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    res.status(503).json({ ok: false, error: 'Webhook not configured.' })
    return
  }

  const stripe = new Stripe(stripeKey)
  const sig = req.headers['stripe-signature']

  let event: Stripe.Event
  try {
    const raw = await readRawBody(req)
    event = stripe.webhooks.constructEvent(raw, sig as string, webhookSecret)
  } catch (err) {
    console.error('webhook signature verification failed:', err)
    res.status(400).json({ ok: false, error: 'Invalid signature' })
    return
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  async function setProByCustomer(customerId: string, isPro: boolean, subscriptionId?: string) {
    const patch: Record<string, unknown> = { is_pro: isPro }
    if (isPro) {
      patch.pro_since = new Date().toISOString()
      if (subscriptionId) patch.stripe_subscription_id = subscriptionId
    } else {
      patch.stripe_subscription_id = null
    }
    const { error } = await admin.from('profiles').update(patch).eq('stripe_customer_id', customerId)
    if (error) console.error('failed to update profile pro state:', error.message)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (customerId) await setProByCustomer(customerId, true, subscriptionId ?? undefined)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const active = sub.status === 'active' || sub.status === 'trialing'
        await setProByCustomer(customerId, active, sub.id)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        await setProByCustomer(customerId, false)
        break
      }
      default:
        break
    }
    res.status(200).json({ received: true })
  } catch (err) {
    console.error('webhook handler error:', err)
    res.status(500).json({ ok: false, error: 'Handler error' })
  }
}
