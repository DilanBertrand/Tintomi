import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MeshBackdrop } from '../components/MeshBackdrop'

const head = "font-['Space_Grotesk',system-ui,sans-serif] font-bold uppercase tracking-tight"

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
          <h1 className={`${head} mt-4 text-2xl font-black tracking-tight text-white`}>Log in</h1>
          <p className="mt-2 text-sm text-neutral-400">Welcome back. Enter your credentials.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none ring-[#00FF88]/0 transition placeholder:text-neutral-600 focus:border-[#00FF88]/50 focus:ring-2 focus:ring-[#00FF88]/30"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[#00FF88]/50 focus:ring-2 focus:ring-[#00FF88]/30"
                placeholder="••••••••"
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

            <button
              type="submit"
              disabled={submitting}
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
            Don&apos;t have an account?{' '}
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault()
                onSwitchToSignUp()
              }}
              className="font-medium text-gray-400 underline-offset-2 transition hover:text-cyan-400 hover:underline"
            >
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
