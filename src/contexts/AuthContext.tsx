import type { AuthError, Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadProfileWithStreakSync } from '../lib/profiles'
import { getEmailRedirectUrl, supabase } from '../lib/supabase'
import type { ProfileRow } from '../types/profile'

function isNetworkAuthError(error: AuthError | Error): boolean {
  const msg = (error.message ?? '').toLowerCase()
  return (
    msg === 'failed to fetch' ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  )
}

function formatAuthError(error: AuthError): string {
  if (isNetworkAuthError(error)) {
    const envConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
    if (!envConfigured) {
      return 'Cannot reach Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file, then restart the dev server.'
    }
    return 'Cannot reach Supabase. Check your internet connection, Supabase project URL, and that the project is not paused.'
  }

  const msg = (error.message ?? '').toLowerCase()
  if (
    msg.includes('invalid login') ||
    msg.includes('invalid email or password') ||
    error.message === 'Invalid login credentials'
  ) {
    return 'Invalid login credentials.'
  }
  return error.message || 'Something went wrong. Try again.'
}

function logAuthError(scope: string, error: AuthError | Error): void {
  console.error(`[auth] ${scope}`, {
    message: error.message,
    name: 'name' in error ? error.name : undefined,
    status: 'status' in error ? error.status : undefined,
    code: 'code' in error ? error.code : undefined,
    cause: 'cause' in error ? error.cause : undefined,
  })
}

export type SignUpResult =
  | { error: string; code?: string; needsEmailConfirmation?: undefined }
  | { error: null; needsEmailConfirmation?: boolean }

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: ProfileRow | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    let cancelled = false
    void (async () => {
      const row = await loadProfileWithStreakSync(user)
      if (cancelled) return
      setProfile(row)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when user id changes
  }, [user?.id])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const row = await loadProfileWithStreakSync(user)
    setProfile(row)
  }, [user])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        logAuthError('signIn', error)
        return { error: formatAuthError(error) }
      }
      return { error: null }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Could not sign in.')
      logAuthError('signIn (unexpected)', error)
      return { error: formatAuthError(error as AuthError) }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: getEmailRedirectUrl() },
      })
      if (error) {
        logAuthError('signUp', error)
        return { error: formatAuthError(error), code: error.code }
      }
      if (!data.session) return { error: null, needsEmailConfirmation: true }
      return { error: null }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Could not create account.')
      logAuthError('signUp (unexpected)', error)
      return { error: formatAuthError(error as AuthError) }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, loading, signIn, signUp, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider in this app
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
