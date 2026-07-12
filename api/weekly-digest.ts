/**
 * Vercel Cron endpoint: emails each user a weekly progress digest.
 *
 * SECURITY: protected by CRON_SECRET — Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` on scheduled invocations when that env
 * var is set, and we reject anything else. Uses the Supabase service-role key
 * (admin) to read emails + progress, and Resend to send.
 *
 * DELIVERABILITY: until a domain is verified on Resend, onboarding@resend.dev
 * can only deliver to the Resend account's own address — so in practice only
 * the founder receives the digest until a domain is added. Verify a domain on
 * Resend and swap the `from` address to enable it for everyone.
 */
import { createClient } from '@supabase/supabase-js'

type VercelRequest = { method?: string; headers: Record<string, string | string[] | undefined> }
type VercelResponse = { status: (c: number) => { json: (b: unknown) => void } }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

type ProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  xp: number | null
  completed_lessons: unknown
  completed_stories: unknown
  learn_streak: { streak?: number; lastStreakDate?: string } | null
}

function len(v: unknown): number {
  return Array.isArray(v) ? v.length : 0
}

function digestHtml(name: string, xp: number, streak: number, lessons: number, quizzes: number): string {
  const level = Math.floor(xp / 100) + 1
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="margin:0 0 4px">Your week on Tintomi</h2>
      <p style="color:#555;margin:0 0 16px">Hey ${name}, here's where you stand.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee">Total XP</td><td style="text-align:right;font-weight:600">${xp}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee">Level</td><td style="text-align:right;font-weight:600">${level}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee">Day streak</td><td style="text-align:right;font-weight:600">${streak}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee">Quizzes done</td><td style="text-align:right;font-weight:600">${quizzes}</td></tr>
        <tr><td style="padding:8px 0">Lessons read</td><td style="text-align:right;font-weight:600">${lessons}</td></tr>
      </table>
      <p style="margin:20px 0 0"><a href="https://www.tintomi.com/learn" style="color:#2979ff">Keep your streak alive →</a></p>
    </div>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    res.status(503).json({ ok: false, error: 'Digest not configured.' })
    return
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, username, full_name, xp, completed_lessons, completed_stories, learn_streak')
  if (error) {
    res.status(502).json({ ok: false, error: error.message })
    return
  }

  // Map user id -> email via the admin auth API (paginated).
  const emailById = new Map<string, string>()
  for (let page = 1; page <= 20; page += 1) {
    const { data, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (listErr) break
    for (const u of data.users) if (u.email) emailById.set(u.id, u.email)
    if (data.users.length < 1000) break
  }

  let sent = 0
  let failed = 0
  for (const p of (profiles ?? []) as ProfileRow[]) {
    const email = emailById.get(p.id)
    if (!email) continue
    const name = p.username || p.full_name || 'there'
    const xp = typeof p.xp === 'number' ? p.xp : 0
    const streak = typeof p.learn_streak?.streak === 'number' ? p.learn_streak.streak : 0
    const html = digestHtml(name, xp, streak, len(p.completed_stories), len(p.completed_lessons))
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'Tintomi <onboarding@resend.dev>',
          to: [email],
          subject: 'Your week on Tintomi',
          html,
        }),
      })
      if (r.ok) sent += 1
      else failed += 1
    } catch {
      failed += 1
    }
  }

  res.status(200).json({ ok: true, sent, failed })
}
