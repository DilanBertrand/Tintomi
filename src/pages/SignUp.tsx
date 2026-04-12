import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MeshBackdrop } from '../components/MeshBackdrop'

const head = "font-['Space_Grotesk',system-ui,sans-serif] font-bold uppercase tracking-tight"

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    const result = await signUp(email, password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.needsEmailConfirmation) {
      setInfo('Check your inbox to confirm your email, then log in.')
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
          <h1 className={`${head} mt-4 text-2xl font-black tracking-tight text-white`}>Sign up</h1>
          <p className="mt-2 text-sm text-neutral-400">Create your account and jump into the sim.</p>

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
              <p className="text-center text-sm font-semibold text-[#00FF88] drop-shadow-[0_0_12px_rgba(0,255,136,0.5)]" role="status">
                {info}
              </p>
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

          <p className="mt-6 text-center text-xs text-neutral-600 sm:text-sm">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-neutral-400 underline-offset-2 transition hover:text-[#00FF88] hover:underline"
            >
              Log in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
