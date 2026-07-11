import { supabase } from './supabase'

/**
 * Kicks off Stripe Checkout for Tintomi Pro. Sends the user's Supabase access
 * token so the server can identify them securely, then redirects to Stripe.
 * Returns an error string on failure (caller shows it); never resolves on
 * success because the tab navigates away.
 */
export async function startProCheckout(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return 'Please sign in again to upgrade.'

  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    const body = (await res.json()) as { ok?: boolean; url?: string; error?: string }
    if (!res.ok || !body.ok || !body.url) {
      return body.error ?? 'Could not start checkout. Try again shortly.'
    }
    window.location.href = body.url
    return null
  } catch {
    return 'Could not reach checkout. Check your connection and try again.'
  }
}
