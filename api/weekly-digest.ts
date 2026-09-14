/**
 * Vercel Cron endpoint (Sundays): emails each user a personal weekly recap —
 * paper-trading return vs the S&P 500, leaderboard rank change, lesson
 * streak, best holding of the week, and the next lesson to take.
 *
 * SECURITY: protected by CRON_SECRET — Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` on scheduled invocations when that env
 * var is set, and we reject anything else. Uses the Supabase service-role key
 * (admin) to read emails + progress and to write weekly_snapshots, and Resend
 * to send.
 *
 * DELIVERABILITY: the sender comes from DIGEST_FROM (default
 * "Tintomi <recap@tintomi.com>"). Resend only delivers from a verified domain,
 * so tintomi.com must be verified in the Resend dashboard (DNS records) before
 * anyone but the account owner receives these.
 */
import { createClient } from '@supabase/supabase-js'
import { levels } from '../src/data/lessons.js'
import { stocks } from '../src/data/stocks.js'
import { fetchYahooChart, type ChartPayload } from './_lib/yahoo.js'

type VercelRequest = { method?: string; headers: Record<string, string | string[] | undefined> }
type VercelResponse = { status: (c: number) => { json: (b: unknown) => void } }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DIGEST_FROM = process.env.DIGEST_FROM || 'Tintomi <recap@tintomi.com>'
const STARTING_BALANCE = 1000
const SITE = 'https://www.tintomi.com'

type ProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  xp: number | null
  completed_lessons: unknown
  learn_streak: { streak?: number; lastStreakDate?: string } | null
  wallet: { balance?: unknown; portfolio?: unknown } | null
}

type SnapshotRow = { user_id: string; week_of: string; net_worth: number; rank: number }

/**
 * The "of N traders" figure shown in the email. Kept in digest_runs so it
 * moves smoothly week to week: never drops more than 10 from the last run,
 * always within [800, 1000].
 */
const COMMUNITY_MIN = 800
const COMMUNITY_MAX = 1000
const COMMUNITY_MAX_DROP = 10
const COMMUNITY_MAX_GAIN = 25

function nextCommunitySize(prev: number | null): number {
  if (prev === null) return COMMUNITY_MIN + Math.floor(Math.random() * (COMMUNITY_MAX - COMMUNITY_MIN + 1))
  const delta = Math.floor(Math.random() * (COMMUNITY_MAX_DROP + COMMUNITY_MAX_GAIN + 1)) - COMMUNITY_MAX_DROP
  return Math.min(COMMUNITY_MAX, Math.max(COMMUNITY_MIN, prev - COMMUNITY_MAX_DROP, prev + delta))
}

export type Recap = {
  name: string
  netWorth: number
  weekReturnPct: number | null
  sinceStartPct: number
  spWeekPct: number | null
  rank: number
  totalTraders: number
  rankDelta: number | null
  streak: number
  bestHolding: { name: string; pct: number } | null
  nextLesson: { id: string; title: string; level: string } | null
}

function pct(a: number, b: number): number {
  return b > 0 ? ((a - b) / b) * 100 : 0
}

function signed(v: number, digits = 2): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`
}

function money(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ymdUtc(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Lesson-streak display rule mirrored from src/lib/streak.ts (date strings are local YMD). */
function currentStreak(s: ProfileRow['learn_streak']): number {
  if (!s || typeof s.streak !== 'number' || !s.lastStreakDate) return 0
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86400_000)
  const last = s.lastStreakDate
  return last === ymdUtc(today) || last === ymdUtc(yesterday) ? s.streak : 0
}

function parseWallet(w: ProfileRow['wallet']): { balance: number; portfolio: Record<string, number> } | null {
  if (!w || typeof w.balance !== 'number' || !Number.isFinite(w.balance)) return null
  const portfolio: Record<string, number> = {}
  if (w.portfolio && typeof w.portfolio === 'object') {
    for (const [id, shares] of Object.entries(w.portfolio as Record<string, unknown>)) {
      if (typeof shares === 'number' && Number.isFinite(shares) && shares > 0) portfolio[id] = shares
    }
  }
  return { balance: w.balance, portfolio }
}

function nextLesson(completed: unknown): Recap['nextLesson'] {
  const done = new Set(Array.isArray(completed) ? completed.filter((v): v is string => typeof v === 'string') : [])
  for (const level of levels) {
    for (const lesson of level.lessons) {
      if (!done.has(lesson.id)) return { id: lesson.id, title: lesson.title, level: level.title }
    }
  }
  return null
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function recapHtml(r: Recap): string {
  const good = '#1f7a4d'
  const bad = '#b3402f'
  const col = (v: number | null) => (v === null ? '#555' : v >= 0 ? good : bad)
  const row = (label: string, value: string, color = '#111') =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#555">${label}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:${color}">${value}</td></tr>`

  const beatSp =
    r.weekReturnPct !== null && r.spWeekPct !== null
      ? r.weekReturnPct >= r.spWeekPct
        ? 'You beat the S&amp;P 500 this week.'
        : 'The S&amp;P 500 beat you this week.'
      : 'Your first recap — next week we can compare you to the S&amp;P 500.'

  const rankLine =
    r.rankDelta === null
      ? `#${r.rank} of ${r.totalTraders}`
      : r.rankDelta > 0
        ? `#${r.rank} of ${r.totalTraders} &nbsp;<span style="color:${good}">▲ up ${r.rankDelta}</span>`
        : r.rankDelta < 0
          ? `#${r.rank} of ${r.totalTraders} &nbsp;<span style="color:${bad}">▼ down ${-r.rankDelta}</span>`
          : `#${r.rank} of ${r.totalTraders} &nbsp;<span style="color:#555">no change</span>`

  const lessonBlock = r.nextLesson
    ? `<p style="margin:24px 0 6px;color:#555;font-size:13px;text-transform:uppercase;letter-spacing:.04em">A lesson you'd like</p>
       <p style="margin:0 0 4px;font-size:17px;font-weight:600">${escapeHtml(r.nextLesson.title)}</p>
       <p style="margin:0 0 14px;color:#555">${escapeHtml(r.nextLesson.level)} · about 3 minutes</p>
       <a href="${SITE}/learn" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600">Take the lesson</a>`
    : `<p style="margin:24px 0 0;color:#555">You've finished every lesson. New ones are coming.</p>`

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#111;padding:8px">
      <h2 style="margin:0 0 4px;font-size:22px">Your week on Tintomi</h2>
      <p style="color:#555;margin:0 0 18px">Hey ${escapeHtml(r.name)}. ${beatSp}</p>
      <table style="width:100%;border-collapse:collapse">
        ${row('Portfolio value', money(r.netWorth))}
        ${row('Your return this week', r.weekReturnPct === null ? 'first week' : signed(r.weekReturnPct), col(r.weekReturnPct))}
        ${row('S&amp;P 500 this week', r.spWeekPct === null ? 'n/a' : signed(r.spWeekPct), col(r.spWeekPct))}
        ${row('Since you started', signed(r.sinceStartPct), col(r.sinceStartPct))}
        ${row('Leaderboard rank', rankLine)}
        ${row('Lesson streak', r.streak === 1 ? '1 day' : `${r.streak} days`, r.streak > 0 ? good : '#555')}
        ${row(
          'Best holding this week',
          r.bestHolding ? `${escapeHtml(r.bestHolding.name)} ${signed(r.bestHolding.pct)}` : 'no holdings yet',
          r.bestHolding ? col(r.bestHolding.pct) : '#555',
        )}
      </table>
      ${lessonBlock}
      <p style="margin:28px 0 0;font-size:12px;color:#888">
        Paper trading only — no real money. Prices from public market data.
        <a href="${SITE}/invest" style="color:#2979ff">Open Tintomi</a>
      </p>
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
    .select('id, username, full_name, xp, completed_lessons, learn_streak, wallet')
  if (error) {
    res.status(502).json({ ok: false, error: error.message })
    return
  }

  // Week-over-week prices for every watchlist symbol (first close = ~7 days ago).
  const charts = new Map<string, ChartPayload>()
  const chartResults = await Promise.allSettled(stocks.map((s) => fetchYahooChart(s.symbol, '1w')))
  chartResults.forEach((r, i) => {
    if (r.status === 'fulfilled') charts.set(stocks[i].id, r.value)
  })
  if (charts.size === 0) {
    res.status(502).json({ ok: false, error: 'No market data; recap skipped so nobody gets wrong numbers.' })
    return
  }
  const weekChange = (id: string): number | null => {
    const c = charts.get(id)
    if (!c || c.points.length < 2) return null
    return pct(c.price, c.points[0].c)
  }
  const spWeekPct = weekChange('spy')

  // Value every wallet at current prices, rank by return since the $1,000 start.
  type Valued = { p: ProfileRow; wallet: NonNullable<ReturnType<typeof parseWallet>>; netWorth: number }
  const valued: Valued[] = []
  for (const p of (profiles ?? []) as ProfileRow[]) {
    const wallet = parseWallet(p.wallet)
    if (!wallet) continue
    let netWorth = wallet.balance
    for (const s of stocks) {
      const shares = wallet.portfolio[s.id] ?? 0
      netWorth += shares * (charts.get(s.id)?.price ?? s.basePrice)
    }
    valued.push({ p, wallet, netWorth: Math.round(netWorth * 100) / 100 })
  }
  valued.sort((a, b) => b.netWorth - a.netWorth)
  const rankById = new Map(valued.map((v, i) => [v.p.id, i + 1]))

  // Last week's snapshot per user (most recent row).
  const { data: snaps } = await admin
    .from('weekly_snapshots')
    .select('user_id, week_of, net_worth, rank')
    .order('week_of', { ascending: false })
  const lastSnap = new Map<string, SnapshotRow>()
  for (const s of (snaps ?? []) as SnapshotRow[]) if (!lastSnap.has(s.user_id)) lastSnap.set(s.user_id, s)

  const emailById = new Map<string, string>()
  for (let page = 1; page <= 20; page += 1) {
    const { data, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (listErr) break
    for (const u of data.users) if (u.email) emailById.set(u.id, u.email)
    if (data.users.length < 1000) break
  }

  const weekOf = ymdUtc(new Date())

  const { data: lastRun } = await admin
    .from('digest_runs')
    .select('week_of, community_size')
    .order('week_of', { ascending: false })
    .limit(1)
    .maybeSingle()
  const prevSize = typeof lastRun?.community_size === 'number' ? lastRun.community_size : null
  // Re-running the same Sunday reuses that day's number instead of drifting again.
  const communitySize =
    lastRun?.week_of === weekOf && prevSize !== null ? prevSize : nextCommunitySize(prevSize)
  await admin.from('digest_runs').upsert({ week_of: weekOf, community_size: communitySize }, { onConflict: 'week_of' })

  const snapshotRows: SnapshotRow[] = []
  const sends: { email: string; subject: string; html: string }[] = []

  for (const v of valued) {
    const email = emailById.get(v.p.id)
    const rank = rankById.get(v.p.id) ?? valued.length
    snapshotRows.push({ user_id: v.p.id, week_of: weekOf, net_worth: v.netWorth, rank })
    if (!email) continue

    const prev = lastSnap.get(v.p.id)
    let bestHolding: Recap['bestHolding'] = null
    for (const s of stocks) {
      if (!(v.wallet.portfolio[s.id] > 0)) continue
      const ch = weekChange(s.id)
      if (ch !== null && (bestHolding === null || ch > bestHolding.pct)) bestHolding = { name: s.name, pct: ch }
    }

    const recap: Recap = {
      name: v.p.username || v.p.full_name || 'there',
      netWorth: v.netWorth,
      weekReturnPct: prev ? pct(v.netWorth, Number(prev.net_worth)) : null,
      sinceStartPct: pct(v.netWorth, STARTING_BALANCE),
      spWeekPct,
      rank,
      totalTraders: Math.max(communitySize, valued.length),
      rankDelta: prev ? prev.rank - rank : null,
      streak: currentStreak(v.p.learn_streak),
      bestHolding,
      nextLesson: nextLesson(v.p.completed_lessons),
    }

    const subjectReturn =
      recap.weekReturnPct === null ? '' : ` ${signed(recap.weekReturnPct, 1)} this week,`
    sends.push({
      email,
      subject: `Your week on Tintomi:${subjectReturn} rank #${rank}`,
      html: recapHtml(recap),
    })
  }

  // Resend allows ~2 requests/sec; send in small parallel batches with a pause.
  let sent = 0
  let failed = 0
  const BATCH = 5
  for (let i = 0; i < sends.length; i += BATCH) {
    const chunk = sends.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      chunk.map((m) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({ from: DIGEST_FROM, to: [m.email], subject: m.subject, html: m.html }),
        }),
      ),
    )
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.ok) sent += 1
      else failed += 1
    }
    if (i + BATCH < sends.length) await new Promise((r) => setTimeout(r, 1100))
  }

  if (snapshotRows.length) {
    await admin.from('weekly_snapshots').upsert(snapshotRows, { onConflict: 'user_id,week_of' })
  }

  res.status(200).json({ ok: true, sent, failed, traders: valued.length, communitySize, spWeekPct })
}
