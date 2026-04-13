import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components/Card'
import { LevelGlyph } from '../components/LevelGlyph'
import { ProgressBar } from '../components/ProgressBar'
import { StaggerPage } from '../components/StaggerPage'
import { levels, XP_PER_LESSON, type Lesson } from '../data/lessons'
import { themeForLevel } from '../learn-themes'
import { fadeSlideUp } from '../motion/variants'

type LearnProps = {
  xp: number
  onAddXp: (amount: number) => void
  completedLessonIds: string[]
  onCompleteLesson: (lessonId: string) => void
}

function isLevelComplete(levelIndex: number, done: Set<string>) {
  const lvl = levels[levelIndex]
  return lvl.lessons.every((l) => done.has(l.id))
}

function isLevelUnlocked(levelIndex: number, done: Set<string>, userXp: number) {
  if (levelIndex === 0) return true
  const prevComplete = isLevelComplete(levelIndex - 1, done)
  if (!prevComplete) return false
  return userXp >= levels[levelIndex].xpToUnlock
}

type QuizPhase = 'read' | 'quiz' | 'result'

type ShuffledOption = { text: string; originalIndex: number }

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Randomizes option order while preserving which original index (0–3) is correct. */
function shuffledOptionsForQuestion(q: { options: readonly string[] }): ShuffledOption[] {
  const paired = q.options.map((text, originalIndex) => ({ text, originalIndex }))
  return shuffle(paired)
}

const levelShell =
  'rounded-xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_0_28px_rgba(0,255,136,0.1)]'

export function Learn({ xp, onAddXp, completedLessonIds, onCompleteLesson }: LearnProps) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const done = useMemo(() => new Set(completedLessonIds), [completedLessonIds])
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [phase, setPhase] = useState<QuizPhase>('read')
  const [qIndex, setQIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const scoreRef = useRef(0)

  const xpIntoLevel = xp % 100
  const nextLevelXp = 100

  const closeLesson = () => {
    setActiveLesson(null)
    setPhase('read')
    setQIndex(0)
    setPicked(null)
    setCorrectCount(0)
    scoreRef.current = 0
  }

  const startQuiz = () => {
    setShuffleSeed((n) => n + 1)
    setPhase('quiz')
    setQIndex(0)
    setPicked(null)
    setCorrectCount(0)
    scoreRef.current = 0
  }

  const currentQ = activeLesson?.questions[qIndex]

  const shuffledOptions = useMemo(() => {
    if (!currentQ) return []
    return shuffledOptionsForQuestion(currentQ)
  }, [currentQ?.id, shuffleSeed])

  const onPickOption = (displayIndex: number) => {
    if (!activeLesson || !currentQ || picked !== null) return
    const row = shuffledOptions[displayIndex]
    if (!row) return
    setPicked(displayIndex)
    const ok = row.originalIndex === currentQ.correctIndex
    const advance = () => {
      if (ok) scoreRef.current += 1
      const next = scoreRef.current
      setCorrectCount(next)
      if (qIndex >= 2) {
        setPhase('result')
        return
      }
      setQIndex((v) => v + 1)
      setPicked(null)
    }
    const delayMs = ok ? 650 : 1500
    window.setTimeout(advance, delayMs)
  }

  const finishLesson = () => {
    if (!activeLesson) return
    const finalScore = scoreRef.current
    if (finalScore < 3) {
      setShuffleSeed((n) => n + 1)
      setPhase('quiz')
      setQIndex(0)
      setPicked(null)
      setCorrectCount(0)
      scoreRef.current = 0
      return
    }
    if (!done.has(activeLesson.id)) {
      onAddXp(XP_PER_LESSON)
      onCompleteLesson(activeLesson.id)
    }
    closeLesson()
  }

  return (
    <div className="pb-28">
      <motion.header
        className="px-1"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-[11px] font-bold uppercase tracking-tighter text-[#3B82F6]">Academy</p>
        <h1 className="tm-premium-title mt-1 text-3xl font-black uppercase tracking-tighter sm:text-4xl">BRAIN GAINS</h1>
        <p className="mt-1 max-w-md text-sm text-gray-500">
          Structured lessons with quizzes. Complete levels to unlock the next track.
        </p>
      </motion.header>

      <StaggerPage className="mt-8 space-y-6">
        <Card title="Progress" subtitle="Experience points">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-3xl font-semibold text-[#00FF88]">{xp}</p>
              <p className="text-xs text-gray-500">Total XP</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Next bracket</p>
              <p className="font-mono text-sm font-semibold text-white">
                {xpIntoLevel} / {nextLevelXp}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={xpIntoLevel} max={nextLevelXp} label="Progress to next 100 XP" />
          </div>
        </Card>

        <div className="space-y-4">
          {levels.map((level, idx) => {
            const unlocked = isLevelUnlocked(idx, done, xp)
            const complete = isLevelComplete(idx, done)
            const theme = themeForLevel(level.id)
            return (
              <motion.div
                key={level.id}
                variants={fadeSlideUp}
                className={levelShell}
                style={{
                  boxShadow: [
                    complete || unlocked ? theme.glow : '',
                    '0 12px 40px rgba(0,0,0,0.5)',
                    'inset 0 1px 0 0 rgba(255,255,255,0.1)',
                  ]
                    .filter(Boolean)
                    .join(', '),
                }}
              >
                <div className="flex gap-4">
                  <div className="shrink-0" style={{ color: theme.accent }}>
                    <LevelGlyph levelId={level.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Track {idx + 1}
                        </p>
                        <h2 className="text-lg font-semibold text-white sm:text-xl">{level.title}</h2>
                        <p className="mt-1 text-xs text-gray-500">
                          Unlock XP: {level.xpToUnlock}
                          {!unlocked ? ' · locked' : complete ? ' · complete' : ' · in progress'}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          background: complete ? theme.accentSoft : unlocked ? theme.accentSoft : undefined,
                          color: complete || unlocked ? theme.accent : undefined,
                          border: !complete && !unlocked ? '1px solid rgba(255,255,255,0.08)' : undefined,
                        }}
                      >
                        {complete ? 'Done' : unlocked ? 'Open' : 'Locked'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {level.lessons.map((lesson) => {
                        const lessonDone = done.has(lesson.id)
                        const disabled = !unlocked
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              if (disabled) return
                              scoreRef.current = 0
                              setActiveLesson(lesson)
                              setPhase('read')
                              setQIndex(0)
                              setPicked(null)
                              setCorrectCount(0)
                            }}
                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors duration-200 ${
                              disabled
                                ? 'cursor-not-allowed border-white/5 bg-black/30 opacity-45'
                                : 'border-white/10 bg-white/5 hover:bg-white/[0.09]'
                            }`}
                            style={
                              !disabled
                                ? { borderLeftWidth: 3, borderLeftColor: theme.accent }
                                : undefined
                            }
                          >
                            <div>
                              <p className="text-sm font-semibold text-white">{lesson.title}</p>
                              <p className="text-xs text-gray-500">3 questions, +{XP_PER_LESSON} XP</p>
                            </div>
                            <span className="text-xs font-semibold" style={{ color: theme.accent }}>
                              {lessonDone ? 'Replay' : 'Start'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </StaggerPage>

      <AnimatePresence>
        {activeLesson ? (
          <motion.div
            key="lesson-overlay"
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 backdrop-blur-md sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLesson}
            role="presentation"
          >
            <motion.div
              className="max-h-[85dvh] w-full max-w-lg cursor-default overflow-y-auto rounded-xl border-x border-b border-white/10 border-t border-t-white/25 bg-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-xl"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {phase === 'read' ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Lesson
                      </p>
                      <h3 className="text-xl font-semibold text-white sm:text-2xl">{activeLesson.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={closeLesson}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-gray-300">{activeLesson.explanation}</p>
                  <button
                    type="button"
                    onClick={startQuiz}
                    className="mt-6 w-full rounded-lg bg-[#00FF88] py-3 text-sm font-semibold text-black transition-opacity duration-200 hover:opacity-90"
                  >
                    Start quiz
                  </button>
                </>
              ) : null}

              {phase === 'quiz' && currentQ ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-gray-500">
                      Q {qIndex + 1} / 3
                    </p>
                    <button
                      type="button"
                      onClick={closeLesson}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white"
                    >
                      Exit
                    </button>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white sm:text-lg">{currentQ.question}</h3>
                  <div className="mt-4 space-y-2">
                    {shuffledOptions.map((opt, idx) => {
                      const show = picked !== null
                      const isThisCorrect = opt.originalIndex === currentQ.correctIndex
                      const isPicked = picked === idx
                      const userMissed = show && isPicked && !isThisCorrect

                      const tone = !show
                        ? 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/[0.09]'
                        : isThisCorrect
                          ? 'border-[#00FF88]/80 bg-[#00FF88]/12 text-white ring-1 ring-[#00FF88]/25'
                          : userMissed
                            ? 'border-red-500/50 bg-red-500/15 text-red-50'
                            : 'border-white/5 bg-white/[0.03] text-gray-500'

                      return (
                        <motion.button
                          key={`${currentQ.id}-${idx}-${opt.originalIndex}`}
                          type="button"
                          disabled={show}
                          onClick={() => onPickOption(idx)}
                          animate={
                            userMissed
                              ? { x: [0, -6, 6, -5, 5, -3, 3, 0] }
                              : { x: 0 }
                          }
                          transition={{ duration: 0.42, ease: 'easeInOut' }}
                          className={`w-full rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors duration-200 ${tone}`}
                        >
                          {opt.text}
                        </motion.button>
                      )
                    })}
                  </div>
                </>
              ) : null}

              {phase === 'result' ? (
                <>
                  <h3 className="text-xl font-semibold text-white">Score check</h3>
                  <p className="mt-2 text-sm text-gray-300">
                    You got <span className="font-mono font-semibold text-[#00FF88]">{correctCount}</span> / 3
                    correct.
                  </p>
                  {correctCount >= 3 ? (
                    <p className="mt-2 text-sm text-white">+{XP_PER_LESSON} XP unlocked.</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Try again to earn XP.</p>
                  )}
                  <div className="mt-6 flex gap-2">
                    <button
                      type="button"
                      onClick={finishLesson}
                      className="flex-1 rounded-lg bg-[#00FF88] py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                    >
                      {correctCount >= 3 ? 'Claim XP' : 'Retry quiz'}
                    </button>
                    <button
                      type="button"
                      onClick={closeLesson}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
