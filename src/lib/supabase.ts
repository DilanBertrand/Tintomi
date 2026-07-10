import { createClient } from '@supabase/supabase-js'

function requireEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[name]?.trim()
  if (!value) {
    throw new Error(
      `[supabase] Missing ${name}. Copy .env.example to .env, add your Supabase project credentials, then restart the dev server.`,
    )
  }
  return value
}

const supabaseUrl = requireEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error(
    '[supabase] VITE_SUPABASE_URL must be your project URL (https://<ref>.supabase.co). Check .env and restart the dev server.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * Base URL Supabase should redirect back to after an email confirmation link
 * is clicked. Set VITE_SITE_URL in production (e.g. https://www.tintomi.com)
 * so confirmation links never point at localhost. Falls back to the current
 * origin for local dev.
 *
 * NOTE: this value must also be added to the Supabase dashboard under
 * Authentication -> URL Configuration (Site URL + Redirect URLs allow-list).
 * If it isn't allow-listed there, Supabase ignores emailRedirectTo and uses
 * the dashboard's Site URL instead.
 */
export function getEmailRedirectUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return supabaseUrl
}
