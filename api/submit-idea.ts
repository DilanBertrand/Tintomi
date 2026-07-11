/**
 * Vercel serverless function: forwards lesson/project ideas to the founder.
 *
 * SECURITY: the founder's inbox is never present in this repo or in any
 * client-delivered code. The function forwards through Web3Forms, whose
 * access key (set as the WEB3FORMS_ACCESS_KEY environment variable in the
 * Vercel dashboard) is bound to the destination email on their side. The
 * browser only ever sees POST /api/submit-idea.
 */

type VercelRequest = {
  method?: string
  body?: unknown
}

type VercelResponse = {
  status: (code: number) => { json: (body: unknown) => void }
}

const MAX_IDEA_LENGTH = 2000

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

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY
  if (!accessKey) {
    res.status(503).json({
      ok: false,
      error: 'Idea inbox is not configured yet. Please try again later.',
    })
    return
  }

  try {
    const forward = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: 'New lesson/project idea from Tintomi',
        from_name: 'Tintomi Idea Box',
        message: idea,
      }),
    })
    const result = (await forward.json()) as { success?: boolean; message?: string }
    if (!forward.ok || !result.success) {
      // Surface the forwarding service's reason in logs to make failures
      // (unverified key, key typo, quota) diagnosable from Vercel logs.
      console.error('web3forms rejected:', forward.status, result.message)
      res.status(502).json({
        ok: false,
        error: 'Could not deliver the idea. Try again shortly.',
        detail: result.message ?? `upstream status ${forward.status}`,
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
