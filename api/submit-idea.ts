/**
 * Vercel serverless function: forwards lesson/project ideas to the founder.
 *
 * SECURITY: the founder's inbox is never present in this repo or in any
 * client-delivered code. The function sends through Resend's API (auth via
 * the RESEND_API_KEY environment variable in the Vercel dashboard), which
 * is a server-to-server API — not a Cloudflare-fronted form widget — so it
 * doesn't hit bot-challenge pages from serverless IPs. The browser only
 * ever sees POST /api/submit-idea.
 *
 * Until a custom domain is verified on Resend, mail can only be sent from
 * onboarding@resend.dev to the Resend account's own signup address, which
 * is exactly the founder's inbox here.
 */

type VercelRequest = {
  method?: string
  body?: unknown
}

type VercelResponse = {
  status: (code: number) => { json: (body: unknown) => void }
}

const MAX_IDEA_LENGTH = 2000
const FOUNDER_EMAIL = 'bertranddilan32@gmail.com'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  let parsedBody: unknown = req.body
  if (typeof parsedBody === 'string') {
    try {
      parsedBody = JSON.parse(parsedBody)
    } catch {
      parsedBody = {}
    }
  }
  const body = (typeof parsedBody === 'object' && parsedBody !== null ? parsedBody : {}) as Record<
    string,
    unknown
  >

  // Honeypot: real users never fill this hidden field; bots do.
  if (typeof body.website === 'string' && body.website.length > 0) {
    res.status(200).json({ ok: true })
    return
  }

  const idea = typeof body.idea === 'string' ? body.idea.trim() : ''
  if (idea.length < 3) {
    res.status(400).json({ ok: false, error: 'Idea is too short.' })
    return
  }
  if (idea.length > MAX_IDEA_LENGTH) {
    res.status(400).json({ ok: false, error: `Idea must be under ${MAX_IDEA_LENGTH} characters.` })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    res.status(503).json({
      ok: false,
      error: 'Idea inbox is not configured yet. Please try again later.',
    })
    return
  }

  const escapedIdea = idea.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  try {
    const forward = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Tintomi Idea Box <onboarding@resend.dev>',
        to: [FOUNDER_EMAIL],
        subject: 'New lesson/project idea from Tintomi',
        text: idea,
        html: `<p>${escapedIdea.replace(/\n/g, '<br>')}</p>`,
      }),
    })
    const rawBody = await forward.text()
    let result: { id?: string; message?: string } = {}
    try {
      result = JSON.parse(rawBody) as { id?: string; message?: string }
    } catch {
      // Upstream returned non-JSON (HTML error page, gateway block, etc).
    }
    if (!forward.ok || !result.id) {
      console.error('resend rejected:', forward.status, rawBody.slice(0, 300))
      res.status(502).json({
        ok: false,
        error: 'Could not deliver the idea. Try again shortly.',
        detail: result.message ?? `upstream status ${forward.status}: ${rawBody.slice(0, 200)}`,
      })
      return
    }
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('submit-idea crashed:', err)
    res.status(502).json({
      ok: false,
      error: 'Could not deliver the idea. Try again shortly.',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
