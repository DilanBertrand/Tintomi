import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://jwgweqbzmlrqevcdgepq.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3Z3dlcWJ6bWxycWV2Y2RnZXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTkyMzYsImV4cCI6MjA5MTQ5NTIzNn0.6rFaSYLyIn1N5A90DwIpZ1ftkmSbVX0bCiWaFhA7F2o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
