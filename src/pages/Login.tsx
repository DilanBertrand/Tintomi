import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MeshBackdrop } from '../components/MeshBackdrop'

const head = 'font-bold tracking-tight'

const FRIENDLY_LOGIN_HINT =
  "Hmm, that email or password doesn't look right. Please try again."

type LoginProps = {
  onBack: () => void
  onSwitchToSignUp: () => void
}

export function Login({ onBack, onSwitchToSignUp }: LoginProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: err } = await signIn(email, password)
    setSubmitting(false)
    if (err) {
      const lower = err.toLowerCase()
      const looksLikeBadCredentials =
        lower.includes('invalid login') ||
        lower.includes('invalid email or password') ||
        err === 'Invalid login credentials.'
      setError(looksLikeBadCredentials ? FRIENDLY_LOGIN_HINT : err)
      return
    }
    window.history.replaceState(null, '', '/home')
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
          <h1 className="tm-serif mt-4 text-2xl text-[#e9ece8]">Log in</h1>
          <p className="mt-2 text-sm text-[#a7b0a8]">The market moved while you were gone. Come see.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a7b0a8]">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[#232b25] bg-[#0f1412] px-4 py-3 text-[#e9ece8] outline-none ring-[#2979ff]/0 transition placeholder:text-[#6b756c] focus:border-[#2979ff]/50 focus:ring-2 focus:ring-[#2979ff]/30"
                placeholder="the one you signed up with"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a7b0a8]">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-[#232b25] bg-[#0f1412] px-4 py-3 text-[#e9ece8] outline-none transition focus:border-[#2979ff]/50 focus:ring-2 focus:ring-[#2979ff]/30"
                placeholder="••••••••"
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

            <button
              type="submit"
              disabled={submitting}
              className={`${head} flex w-full items-center justify-center gap-2 rounded-full bg-[#e9ece8] py-4 text-sm tracking-tight text-[#0f1412] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                  Checking...
                </>
              ) : (
                'Back to the floor'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#a7b0a8]">
            Don&apos;t have an account?{' '}
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault()
                onSwitchToSignUp()
              }}
              className="font-medium text-[#a7b0a8] underline-offset-2 transition hover:text-[#e9ece8] hover:underline"
            >
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
