import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Card } from './Card'

type Status = 'idle' | 'open' | 'sending' | 'sent' | 'error'

const MAX_IDEA_LENGTH = 2000

type IdeaSubmissionProps = {
  className?: string
  /** Compact mode: small trigger button, no title/subtitle chrome. */
  bare?: boolean
}

/**
 * Idea box: lets learners pitch new lessons/projects. Submissions go to
 * POST /api/submit-idea — the destination inbox lives server-side only.
 */
export function IdeaSubmission({ className = '', bare = false }: IdeaSubmissionProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [idea, setIdea] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')

  const open = status === 'open' || status === 'sending' || status === 'error'

  async function send() {
    if (idea.trim().length < 3) {
      setError('Give the idea a few more words first.')
      setStatus('error')
      return
    }
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/submit-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim(), website: honeypot }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Something went wrong. Try again.')
        setStatus('error')
        return
      }
      setIdea('')
      setStatus('sent')
    } catch {
      setError('Could not reach the server. Try again.')
      setStatus('error')
    }
  }

  const content = (
    <AnimatePresence mode="wait" initial={false}>
      {status === 'sent' ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-sm font-medium text-[#e9ece8]">
            Thank you! Your idea has been sent to the Founder.
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="mt-4 min-h-12 rounded-lg border border-[#232b25] bg-transparent px-4 py-3 text-sm font-medium text-[#e9ece8] transition-colors hover:bg-[#1a221c]"
          >
            Send another
          </button>
        </motion.div>
      ) : !open ? (
        <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button
            type="button"
            onClick={() => setStatus('open')}
            className={
              bare
                ? 'min-h-10 w-full rounded-full bg-[#e9ece8] px-4 py-2 text-xs font-semibold text-[#0f1412] transition-opacity duration-200 hover:opacity-90'
                : 'min-h-12 w-full rounded-full bg-[#e9ece8] px-5 py-3 text-sm font-semibold text-[#0f1412] transition-opacity duration-200 hover:opacity-90 sm:w-auto'
            }
          >
            {bare ? 'Suggest an idea' : 'Give us ideas for new lessons/projects'}
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="open"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, MAX_IDEA_LENGTH))}
            placeholder="A lesson on options greeks, a project that builds a budget app…"
            rows={4}
            autoFocus
            className="w-full resize-y rounded-lg border border-[#232b25] bg-[#0f1412] p-3 text-sm text-[#e9ece8] placeholder-[#5c665e] outline-none transition-colors focus:border-[#2979ff]"
          />
          {/* Honeypot: hidden from humans, bots fill it and get silently dropped */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-[#5c665e]">{idea.length} / {MAX_IDEA_LENGTH}</p>
            {status === 'error' ? <p className="text-xs text-[#ff6b5e]">{error}</p> : null}
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void send()}
              disabled={status === 'sending'}
              className="min-h-12 flex-1 rounded-full bg-[#e9ece8] py-3 text-sm font-semibold text-[#0f1412] transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 sm:flex-none sm:px-6"
            >
              {status === 'sending' ? 'Sending…' : 'Send idea to Founder'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus('idle')
                setError('')
              }}
              className="min-h-12 rounded-lg border border-[#232b25] bg-transparent px-4 py-3 text-sm font-medium text-[#e9ece8] transition-colors hover:bg-[#1a221c]"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (bare) {
    return (
      <div className={`rounded-2xl border border-[#232b25] bg-[#121a15] p-3 ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <Card title="Idea box" subtitle="Shape what we build next" className={className}>
      {content}
    </Card>
  )
}
