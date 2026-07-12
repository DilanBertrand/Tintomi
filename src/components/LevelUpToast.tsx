import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

const CONFETTI = Array.from({ length: 28 })
const COLORS = ['#2979ff', '#00d18f', '#e5c76b', '#ff5e8a', '#e9ece8']

/**
 * Brief celebration shown when the user crosses into a new level. Confetti +
 * a toast; auto-dismisses. `level` is the new level reached; null hides it.
 */
export function LevelUpToast({ level, onDone }: { level: number | null; onDone: () => void }) {
  useEffect(() => {
    if (level === null) return
    const t = window.setTimeout(onDone, 3200)
    return () => window.clearTimeout(t)
  }, [level, onDone])

  return (
    <AnimatePresence>
      {level !== null ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[130] flex items-start justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti */}
          {CONFETTI.map((_, i) => {
            const left = (i / CONFETTI.length) * 100
            const delay = (i % 6) * 0.05
            const color = COLORS[i % COLORS.length]
            return (
              <motion.span
                key={i}
                className="absolute top-0 h-2.5 w-1.5 rounded-sm"
                style={{ left: `${left}%`, backgroundColor: color }}
                initial={{ y: -20, opacity: 0, rotate: 0 }}
                animate={{ y: '60vh', opacity: [0, 1, 1, 0], rotate: 360 }}
                transition={{ duration: 2.2, delay, ease: 'easeIn' }}
              />
            )
          })}

          <motion.div
            className="mt-24 rounded-2xl border border-[#2979ff]/40 bg-[#121a15] px-6 py-4 text-center shadow-xl shadow-black/50"
            initial={{ scale: 0.8, y: -12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2979ff]">Level up</p>
            <p className="mt-1 text-2xl font-bold text-[#e9ece8]">Level {level}</p>
            <p className="mt-1 text-sm text-[#a7b0a8]">Nice. Keep the momentum going.</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
