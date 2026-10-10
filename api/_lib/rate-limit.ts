/**
 * Rate limiting for the serverless API.
 *
 * Serverless instances share no memory, so an in-process counter is bypassed
 * simply by spreading requests across cold starts. The durable limiter keeps
 * the counter in Postgres via an atomic upsert (public.check_rate_limit).
 *
 * Fail-open is deliberate: if the limiter itself is unreachable we would rather
 * serve traffic than take the site down. The endpoints behind it are not
 * security boundaries on their own — they each still validate their input.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Best-effort caller identity. Vercel sets x-forwarded-for; the left-most entry
 * is the client. Header order is controlled by the platform, not the caller.
 */
export function clientIp(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers['x-forwarded-for'] ?? headers['x-real-ip']
  const value = Array.isArray(raw) ? raw[0] : raw
  const first = value?.split(',')[0]?.trim()
  return first && first.length > 0 ? first : 'unknown'
}

export type RateLimitOptions = {
  bucket: string
  identifier: string
  limit: number
  windowSeconds: number
}

/** True when the request may proceed. */
export async function allowRequest(opts: RateLimitOptions): Promise<boolean> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return true

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_bucket: opts.bucket,
      p_identifier: opts.identifier,
      p_limit: opts.limit,
      p_window_seconds: opts.windowSeconds,
    })
    if (error) {
      console.warn('[rate-limit] check failed, allowing:', error.message)
      return true
    }
    return data !== false
  } catch (err) {
    console.warn('[rate-limit] threw, allowing:', err)
    return true
  }
}

/**
 * Per-instance limiter for cheap read-only endpoints where a database round
 * trip per request would cost more than the abuse it prevents. Weaker than the
 * durable limiter by design — it only blunts a burst against one instance.
 */
const memory = new Map<string, { count: number; resetAt: number }>()

export function allowRequestInMemory(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now()
  const entry = memory.get(key)
  if (!entry || now > entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    if (memory.size > 5000) {
      for (const [k, v] of memory) if (now > v.resetAt) memory.delete(k)
    }
    return true
  }
  entry.count += 1
  return entry.count <= limit
}
