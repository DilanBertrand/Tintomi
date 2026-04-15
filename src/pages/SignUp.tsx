import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MeshBackdrop } from '../components/MeshBackdrop'
import { profileExistsForEmail } from '../lib/profiles'
import { supabase } from '../lib/supabase'

const head = "font-['Space_Grotesk',system-ui,sans-serif] font-bold uppercase tracking-tight"

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
    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(id)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [info, canResend])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    const { exists: profileAlready, skipped: profileCheckSkipped } = await profileExistsForEmail(email)
    if (!profileCheckSkipped && profileAlready) {
      setSubmitting(false)
      setError(ALREADY_REGISTERED_MESSAGE)
      return
    }

    const result = await signUp(email, password)
    setSubmitting(false)
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
  }

  async function handleResendEmail() {
    if (!canResend || !resendEmail) return
    setError(null)
    setResendSending(true)
    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: resendEmail,
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
    <div className="relative min-h-dvh text-neutral-100">
      <MeshBackdrop />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-16">
        <button
          type="button"
          onClick={onBack}
          className={`${head} mb-8 flex items-center gap-2 text-sm text-white/70 transition hover:text-[#00FF88]`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-white/10 bg-black/55 p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
        >
          <p className="tm-chrome-wordmark text-[10px] tracking-[0.28em] text-white/50">TINTOMI</p>
          <h1 className={`${head} mt-4 text-2xl font-black tracking-tight text-white`}>Sign up</h1>
          <p className="mt-2 text-sm text-neutral-400">Create your account and get started.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-[#00FF88]/50 focus:ring-2 focus:ring-[#00FF88]/30"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
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
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[#00FF88]/50 focus:ring-2 focus:ring-[#00FF88]/30"
                placeholder="At least 6 characters"
              />
            </div>

            {error ? (
              <p
                className="text-center text-sm font-semibold text-[#ff4d6a] drop-shadow-[0_0_14px_rgba(255,77,106,0.85)]"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            {info ? (
              <div className="space-y-3">
                <p className="text-center text-sm font-semibold text-[#00FF88] drop-shadow-[0_0_12px_rgba(0,255,136,0.5)]" role="status">
                  {info}
                </p>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={!canResend || resendSending}
                  className="mx-auto block rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-neutral-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendSending ? 'Sending...' : canResend ? 'Resend Email' : `Resend in ${timer}s`}
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !!info}
              className={`${head} flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00FF88] py-4 text-sm font-black tracking-wide text-black shadow-[0_0_40px_rgba(0,255,136,0.4)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                  Loading...
                </>
              ) : (
                'START GRINDING'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Already have an account?{' '}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault()
                onSwitchToLogin()
              }}
              className="font-medium text-gray-400 underline-offset-2 transition hover:text-cyan-400 hover:underline"
            >
              Log in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
