import { AnimatePresence, motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import { useState } from 'react'

type Status = 'closed' | 'open' | 'sending' | 'sent' | 'error'

const MAX_IDEA_LENGTH = 2000

/**
 * Floating idea button: lets learners pitch new lessons/projects from
 * anywhere on the page without competing with page content. Submissions go
 * to POST /api/submit-idea — the destination inbox lives server-side only.
 */
export function IdeaSubmission() {
  const [status, setStatus] = useState<Status>('closed')
  const [idea, setIdea] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')

  const open = status !== 'closed'

  function close() {
    setStatus('closed')
    setError('')
  }

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

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setStatus('open')}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex min-h-14 items-center gap-2.5 rounded-full bg-[#e9ece8] px-6 py-4 text-base font-semibold text-[#0f1412] shadow-lg shadow-black/40 transition-opacity hover:opacity-90 sm:bottom-6"
        aria-label="Suggest an idea"
      >
        <Lightbulb className="h-6 w-6" strokeWidth={2} aria-hidden />
        Suggest an idea
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="idea-overlay"
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            role="presentation"
          >
            <motion.div
              className="w-full max-w-md cursor-default rounded-xl border-x border-b border-[#232b25] border-t border-t-white/25 bg-[#1a221c] p-4"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {status === 'sent' ? (
                <>
                  <p className="text-sm font-medium text-[#e9ece8]">
                    Thank you! Your idea has been sent to the Founder.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-4 min-h-12 w-full rounded-full bg-[#e9ece8] py-3 text-sm font-semibold text-[#0f1412] transition-opacity hover:opacity-90"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a7b0a8]">
                        Idea box
                      </p>
                      <h3 className="text-xl font-semibold text-[#e9ece8]">Shape what we build next</h3>
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      className="min-h-12 rounded-lg border border-[#232b25] bg-transparent px-3 py-2 text-sm font-medium text-[#e9ece8] transition-colors hover:bg-[#1a221c]"
                    >
                      Close
                    </button>
                  </div>

                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value.slice(0, MAX_IDEA_LENGTH))}
                    placeholder="A lesson on options greeks, a project that builds a budget app…"
                    rows={4}
                    autoFocus
                    className="mt-4 w-full resize-y rounded-lg border border-[#232b25] bg-[#0f1412] p-3 text-sm text-[#e9ece8] placeholder-[#5c665e] outline-none transition-colors focus:border-[#2979ff]"
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
                    <p className="text-xs text-[#5c665e]">
                      {idea.length} / {MAX_IDEA_LENGTH}
                    </p>
                    {status === 'error' ? <p className="text-xs text-[#ff6b5e]">{error}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={status === 'sending'}
                    className="mt-3 min-h-12 w-full rounded-full bg-[#e9ece8] py-3 text-sm font-semibold text-[#0f1412] transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                  >
                    {status === 'sending' ? 'Sending…' : 'Send idea to Founder'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
