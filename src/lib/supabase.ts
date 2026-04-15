import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const fallbackUrl = 'https://jwgweqbzmlrqevcdgepq.supabase.co'
const fallbackAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3Z3dlcWJ6bWxycWV2Y2RnZXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTkyMzYsImV4cCI6MjA5MTQ5NTIzNn0.6rFaSYLyIn1N5A90DwIpZ1ftkmSbVX0bCiWaFhA7F2o'

const supabaseUrl = envUrl || fallbackUrl
const supabaseAnonKey = envAnonKey || fallbackAnonKey

if (!envUrl || !envAnonKey) {
  console.warn(
    '[supabase] Using fallback client config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to target your own database.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
