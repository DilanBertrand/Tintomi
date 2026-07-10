import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MeshBackdrop } from '../components/MeshBackdrop'
import { profileExistsForEmail } from '../lib/profiles'
import { getEmailRedirectUrl, supabase } from '../lib/supabase'

const head = 'font-bold tracking-tight'

const ALREADY_REGISTERED_MESSAGE = 'You already have an account! Please log in.'

function looksLikeDuplicateSignupError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('already registered') ||
    m.includes('already been registered') ||
    m.includes('user already exists') ||
    m.includes('email address is already') ||
    m.includes('address is already registered') ||
    m.includes('user already registered') ||
    (m.includes('duplicate') && (m.includes('user') || m.includes('email') || m.includes('key')))
  )
}

type SignUpProps = {
  onBack: () => void
  onSwitchToLogin: () => void
}

export function SignUp({ onBack, onSwitchToLogin }: SignUpProps) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resendSending, setResendSending] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [canResend, setCanResend] = useState(false)
  const [timer, setTimer] = useState(30)

  useEffect(() => {
    if (!info || canResend) return

    let cancelled = false
    const id = window.setInterval(() => {
      setTimer((prev) => {
        const next = prev - 1
        if (next <= 0) {
          window.clearInterval(id)
          void Promise.resolve().then(() => {
            if (!cancelled) setCanResend(true)
          })
          return 0
        }
        return next
      })
    }, 1000)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [info, canResend])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    try {
      const { exists: profileAlready, skipped: profileCheckSkipped } = await profileExistsForEmail(email)
      if (!profileCheckSkipped && profileAlready) {
        setError(ALREADY_REGISTERED_MESSAGE)
        return
      }

      const result = await signUp(email, password)
      if (result.error) {
        const duplicate =
          looksLikeDuplicateSignupError(result.error) ||
          result.code === 'user_already_exists' ||
          result.code === 'identity_already_exists'
        setError(duplicate ? ALREADY_REGISTERED_MESSAGE : result.error)
        return
      }
      if (result.needsEmailConfirmation) {
        const trimmedEmail = email.trim()
        setInfo('Check your inbox to confirm your email, then log in.')
        setResendEmail(trimmedEmail)
        setCanResend(false)
        setTimer(30)
        return
      }
      window.history.replaceState(null, '', '/home')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.'
      console.error('[signup] unexpected error', err)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendEmail() {
    if (!canResend || !resendEmail) return
    setError(null)
    setResendSending(true)
    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: resendEmail,
      options: { emailRedirectTo: getEmailRedirectUrl() },
    })
    setResendSending(false)
    if (resendErr) {
      setError(resendErr.message || 'Could not resend verification email.')
      return
    }
    setCanResend(false)
    setTimer(30)
  }

  return (
    <div className="relative min-h-dvh text-[#e9ece8]">
      <MeshBackdrop />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-16">
        <button
          type="button"
          onClick={onBack}
          className={`${head} mb-8 flex items-center gap-2 text-sm text-[#a7b0a8] transition hover:text-[#2979ff]`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-[#232b25] bg-[#121a15] p-8"
        >
          <p className="tm-chrome-wordmark text-[10px] tracking-[0.28em] text-[#a7b0a8]">TINTOMI</p>
          <h1 className="tm-serif mt-4 text-2xl text-[#e9ece8]">Sign up</h1>
          <p className="mt-2 text-sm text-[#a7b0a8]">Free. Takes a minute. Fake $1,000 waiting on the other side.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a7b0a8]">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[#232b25] bg-[#0f1412] px-4 py-3 text-[#e9ece8] outline-none transition placeholder:text-[#6b756c] focus:border-[#2979ff]/50 focus:ring-2 focus:ring-[#2979ff]/30"
                placeholder="one you actually check"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a7b0a8]">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-[#232b25] bg-[#0f1412] px-4 py-3 text-[#e9ece8] outline-none transition focus:border-[#2979ff]/50 focus:ring-2 focus:ring-[#2979ff]/30"
                placeholder="6+ characters, not your birthday"
              />
            </div>

            {error ? (
              <p
                className="text-center text-sm font-semibold text-[#e06a55]"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            {info ? (
              <div className="space-y-3">
                <p className="text-center text-sm font-semibold text-[#2979ff]" role="status">
                  {info}
                </p>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={!canResend || resendSending}
                  className="mx-auto block rounded-xl border border-[#232b25] bg-transparent px-4 py-2 text-xs font-semibold tracking-wide text-[#a7b0a8] transition hover:bg-[#1a221c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendSending ? 'Sending...' : canResend ? 'Resend Email' : `Resend in ${timer}s`}
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !!info}
              className={`${head} flex w-full items-center justify-center gap-2 rounded-full bg-[#e9ece8] py-4 text-sm tracking-tight text-[#0f1412] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                  Setting you up...
                </>
              ) : (
                'Start grinding'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#a7b0a8]">
            Already have an account?{' '}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault()
                onSwitchToLogin()
              }}
              className="font-medium text-[#a7b0a8] underline-offset-2 transition hover:text-[#e9ece8] hover:underline"
            >
              Log in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
