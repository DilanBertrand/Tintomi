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
