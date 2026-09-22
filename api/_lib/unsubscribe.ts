/**
 * One-click unsubscribe links for the weekly recap.
 *
 * The link carries the user id plus an HMAC of it, so the endpoint can honour
 * the request without the recipient signing in (a sign-in wall on an
 * unsubscribe link is exactly what CAN-SPAM and PECR are aimed at) while still
 * making the link impossible to forge for another user.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Falls back to the cron secret so there is one less env var to forget. */
function secret(): string | null {
  return process.env.EMAIL_TOKEN_SECRET || process.env.CRON_SECRET || null
}

export function signUnsubscribe(userId: string): string | null {
  const key = secret()
  if (!key) return null
  return createHmac('sha256', key).update(`unsub:${userId}`).digest('hex')
}

export function verifyUnsubscribe(userId: string, token: string): boolean {
  const expected = signUnsubscribe(userId)
  if (!expected || !token || expected.length !== token.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
}

export function unsubscribeUrl(baseUrl: string, userId: string): string | null {
  const token = signUnsubscribe(userId)
  if (!token) return null
  return `${baseUrl}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${token}`
}
