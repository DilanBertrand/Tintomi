/**
 * GET /api/unsubscribe?u=<user id>&t=<hmac>
 *
 * Turns off the weekly recap for one account and shows a plain confirmation
 * page. Deliberately works without a login: an unsubscribe link that demands
 * a sign-in is not a valid opt-out.
 */
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribe } from './_lib/unsubscribe.js'

type VercelRequest = { method?: string; query?: Record<string, string | string[] | undefined> }
type VercelResponse = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => { send: (body: string) => void }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | Tintomi</title></head>
<body style="margin:0;background:#0f1412;color:#e9ece8;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:32rem;margin:0 auto;padding:4rem 1.5rem">
<h1 style="font-size:1.5rem;margin:0 0 .75rem">${title}</h1>
<p style="color:#c3cbc4;line-height:1.6;margin:0 0 1.5rem">${body}</p>
<a href="https://www.tintomi.com/" style="color:#5b9bff">Back to Tintomi</a>
</div></body></html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (req.method !== 'GET') {
    res.status(405).send(page('Not allowed', 'Use the link from the email.'))
    return
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    res.status(503).send(page('Not available', 'Unsubscribe is not configured. Please email us instead.'))
    return
  }

  const userId = first(req.query?.u)
  const token = first(req.query?.t)
  if (!userId || !verifyUnsubscribe(userId, token)) {
    res
      .status(400)
      .send(page('That link did not work', 'It may be incomplete. Email us and we will turn the emails off for you.'))
    return
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await admin.from('profiles').update({ email_opt_out: true }).eq('id', userId)
  if (error) {
    res.status(502).send(page('Something went wrong', 'Please email us and we will turn the emails off for you.'))
    return
  }

  res
    .status(200)
    .send(
      page(
        'You are unsubscribed',
        'You will not get the weekly recap again. Account emails like password resets still work, because they are needed to run your account.',
      ),
    )
}
