import { AnimatePresence, motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components/Card'
import { IdeaSubmission } from '../components/IdeaSubmission'
import { LevelGlyph } from '../components/LevelGlyph'
import { ProgressBar } from '../components/ProgressBar'
import { StaggerPage } from '../components/StaggerPage'
import {
  levels,
  XP_PER_LESSON,
  XP_PERFECT_BONUS,
  XP_SPEED_BONUS,
  type Lesson,
  type QuizQuestion,
} from '../data/lessons'
import { themeForLevel } from '../learn-themes'
import { localProgressKeys } from '../lib/localProgress'
import { addLocalDays, toLocalYmd } from '../lib/streak'
import { updateUserXP } from '../lib/updateUserXP'
import { fadeSlideUp } from '../motion/variants'

/** Total XP and completed lesson IDs persist in the browser via `App` and `lib/localProgress.ts`. */

type LearnProps = {
  userId: string
  xp: number
  onAddXp: (amount: number) => Promise<void> | void
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

type QuizPhase = 'read' | 'quiz' | 'result' | 'trackdone'

type ShuffledOption = { text: string; originalIndex: number }

/** Active quiz session: a real lesson, or a synthetic weak-spots review. */
type QuizSession = {
  id: string
  title: string
  explanation: string
  questions: QuizQuestion[]
  review: boolean
}

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

const allQuestionsById = new Map<string, QuizQuestion>(
  levels.flatMap((lvl) => lvl.lessons.flatMap((l) => l.questions.map((q) => [q.id, q] as const))),
)

const totalLessonCount = levels.reduce((n, lvl) => n + lvl.lessons.length, 0)

function readWeakSpots(userId: string): string[] {
  try {
    const raw = localStorage.getItem(localProgressKeys.learnWeakSpots(userId))
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && allQuestionsById.has(id))
  } catch {
    return []
  }
}

type LearnStreak = { streak: number; lastStreakDate: string | null }

function readLearnStreak(userId: string): LearnStreak {
  try {
    const raw = localStorage.getItem(localProgressKeys.learnStreak(userId))
    const parsed = raw ? (JSON.parse(raw) as Partial<LearnStreak>) : null
    if (parsed && typeof parsed.streak === 'number') {
      return { streak: parsed.streak, lastStreakDate: parsed.lastStreakDate ?? null }
    }
  } catch {
    // fall through
  }
  return { streak: 0, lastStreakDate: null }
}

/** Streak counts consecutive days with at least one completed lesson. */
function bumpLearnStreak(prev: LearnStreak, now: Date = new Date()): LearnStreak {
  const today = toLocalYmd(now)
  const yesterday = toLocalYmd(addLocalDays(now, -1))
  if (prev.lastStreakDate === today) return prev
  if (prev.lastStreakDate === yesterday) return { streak: prev.streak + 1, lastStreakDate: today }
  return { streak: 1, lastStreakDate: today }
}

/** Days-with-a-lesson streak, showing 0 if the chain is already broken. */
function displayStreak(s: LearnStreak, now: Date = new Date()): number {
  if (!s.lastStreakDate) return 0
  const today = toLocalYmd(now)
  const yesterday = toLocalYmd(addLocalDays(now, -1))
  if (s.lastStreakDate === today || s.lastStreakDate === yesterday) return s.streak
  return 0
}

const SPEED_BONUS_WINDOW_MS = 5000
const REVIEW_SESSION_SIZE = 3

const levelShell =
  'rounded-xl border border-[#232b25] bg-transparent p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#232b25] '

export function Learn({ userId, xp, onAddXp, completedLessonIds, onCompleteLesson }: LearnProps) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const done = useMemo(() => new Set(completedLessonIds), [completedLessonIds])
  const [session, setSession] = useState<QuizSession | null>(null)
  const [phase, setPhase] = useState<QuizPhase>('read')
  const [qIndex, setQIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [completedTrackTitle, setCompletedTrackTitle] = useState('')
  const [weakSpots, setWeakSpots] = useState<string[]>(() => readWeakSpots(userId))
  const [learnStreak, setLearnStreak] = useState<LearnStreak>(() => readLearnStreak(userId))
  const [speedBonus, setSpeedBonus] = useState(0)
  const questionShownAtRef = useRef(0)

  useEffect(() => {
    setWeakSpots(readWeakSpots(userId))
    setLearnStreak(readLearnStreak(userId))
  }, [userId])

  const persistWeakSpots = (ids: string[]) => {
    setWeakSpots(ids)
    try {
      localStorage.setItem(localProgressKeys.learnWeakSpots(userId), JSON.stringify(ids))
    } catch {
      // storage full/blocked: state still updates for this session
    }
  }

  const xpIntoLevel = xp % 100
  const nextLevelXp = 100
  const streakDays = displayStreak(learnStreak)

  const closeLesson = () => {
    setSession(null)
    setPhase('read')
    setQIndex(0)
    setPicked(null)
    setCorrectCount(0)
    setCompletedTrackTitle('')
    setSpeedBonus(0)
  }

  const startQuiz = (startedAt: number) => {
    setShuffleSeed((n) => n + 1)
    setPhase('quiz')
    setQIndex(0)
    setPicked(null)
    setCorrectCount(0)
    setSpeedBonus(0)
    questionShownAtRef.current = startedAt
  }

  const openLesson = (lesson: Lesson) => {
    setSpeedBonus(0)
    setSession({
      id: lesson.id,
      title: lesson.title,
      explanation: lesson.explanation,
      questions: [...lesson.questions],
      review: false,
    })
    setPhase('read')
    setQIndex(0)
    setPicked(null)
    setCorrectCount(0)
  }

  const openReview = (startedAt: number) => {
    const questions = shuffle(weakSpots)
      .slice(0, REVIEW_SESSION_SIZE)
      .map((id) => allQuestionsById.get(id))
      .filter((q): q is QuizQuestion => Boolean(q))
    if (questions.length === 0) return
    setSpeedBonus(0)
    setSession({
      id: 'weak-spots-review',
      title: 'Weak spots review',
      explanation: '',
      questions,
      review: true,
    })
    setShuffleSeed((n) => n + 1)
    setPhase('quiz')
    setQIndex(0)
    setPicked(null)
    setCorrectCount(0)
    questionShownAtRef.current = startedAt
  }

  const questionCount = session?.questions.length ?? 0
  const currentQ = session?.questions[qIndex]
  const isLastQuestion = qIndex >= questionCount - 1

  const shuffledOptions = useMemo(() => {
    if (!currentQ) return []
    void shuffleSeed
    return shuffledOptionsForQuestion(currentQ)
  }, [currentQ, shuffleSeed])

  const onPickOption = (displayIndex: number, answeredAt: number) => {
    if (!session || !currentQ || picked !== null) return
    const row = shuffledOptions[displayIndex]
    if (!row) return
    setPicked(displayIndex)
    const ok = row.originalIndex === currentQ.correctIndex
    if (ok) {
      setCorrectCount((c) => c + 1)
      if (answeredAt - questionShownAtRef.current <= SPEED_BONUS_WINDOW_MS) {
        setSpeedBonus((b) => b + XP_SPEED_BONUS)
      }
      // Per-answer XP only counts the first time through a lesson; replays
      // and weak-spot reviews pay nothing (no infinite XP farming).
      if (!session.review && !done.has(session.id)) {
        void updateUserXP(10)
      }
      // Answered right: this question is no longer a weak spot.
      if (weakSpots.includes(currentQ.id)) {
        persistWeakSpots(weakSpots.filter((id) => id !== currentQ.id))
      }
    } else if (!weakSpots.includes(currentQ.id)) {
      persistWeakSpots([...weakSpots, currentQ.id])
    }
  }

  const goNext = (advancedAt: number) => {
    if (picked === null) return
    if (isLastQuestion) {
      setPhase('result')
      return
    }
    setQIndex((v) => v + 1)
    setPicked(null)
    questionShownAtRef.current = advancedAt
  }

  const passed = session?.review ? true : correctCount >= 2
  const perfect = !session?.review && questionCount > 0 && correctCount >= questionCount

  const finishLesson = async (clickedAt: number) => {
    if (!session) return
    if (session.review) {
      closeLesson()
      return
    }
    if (!passed) {
      setShuffleSeed((n) => n + 1)
      setPhase('quiz')
      setQIndex(0)
      setPicked(null)
      setCorrectCount(0)
      setSpeedBonus(0)
      questionShownAtRef.current = clickedAt
      return
    }
    if (!done.has(session.id)) {
      const bonus = (perfect ? XP_PERFECT_BONUS : 0) + speedBonus
      await updateUserXP(10)
      await onAddXp(XP_PER_LESSON + bonus)
      onCompleteLesson(session.id)

      const nextStreak = bumpLearnStreak(learnStreak)
      setLearnStreak(nextStreak)
      try {
        localStorage.setItem(localProgressKeys.learnStreak(userId), JSON.stringify(nextStreak))
      } catch {
        // storage blocked: streak still shown this session
      }

      // Completing this lesson may finish its whole track — celebrate that.
      const owningLevel = levels.find((lvl) => lvl.lessons.some((l) => l.id === session.id))
      if (owningLevel) {
        const nowDone = new Set(done)
        nowDone.add(session.id)
        if (owningLevel.lessons.every((l) => nowDone.has(l.id))) {
          setCompletedTrackTitle(owningLevel.title)
          setPhase('trackdone')
          return
        }
      }
    }
    closeLesson()
  }

  const earnedBonus = (perfect ? XP_PERFECT_BONUS : 0) + speedBonus

  return (
    <div className="overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <motion.header
        className="px-1"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-[11px] font-bold uppercase tracking-tighter text-[#3B82F6]">Academy</p>
        <h1 className="tm-premium-title mt-1 text-3xl sm:text-4xl">Brain gains</h1>
        <p className="mt-1 max-w-md text-sm text-[#a7b0a8]">
          Structured lessons with quizzes. Complete levels to unlock the next track.
        </p>
      </motion.header>

      <StaggerPage className="mt-8 space-y-6">
        <Card title="Progress" subtitle="Experience points">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-3xl font-semibold text-[#2979ff]">{xp}</p>
              <p className="text-xs text-[#a7b0a8]">Total XP</p>
            </div>
            <div>
              <p className="font-mono text-3xl font-semibold text-[#e9ece8]">
                {done.size}
                <span className="text-base text-[#a7b0a8]"> / {totalLessonCount}</span>
              </p>
              <p className="text-xs text-[#a7b0a8]">Lessons done</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-mono text-3xl font-semibold text-[#e9ece8]">
                <Flame
                  className={`h-6 w-6 ${streakDays > 0 ? 'text-[#2979ff]' : 'text-[#39423b]'}`}
                  strokeWidth={2}
                  aria-hidden
                />
                {streakDays}
              </p>
              <p className="text-xs text-[#a7b0a8]">Day streak</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#a7b0a8]">Next bracket</p>
              <p className="font-mono text-sm font-semibold text-[#e9ece8]">
                {xpIntoLevel} / {nextLevelXp}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={xpIntoLevel} max={nextLevelXp} label="Progress to next 100 XP" />
          </div>
        </Card>

        {weakSpots.length > 0 ? (
          <Card title="Weak spots" subtitle="Questions you missed">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-sm text-sm text-[#a7b0a8]">
                {weakSpots.length} question{weakSpots.length === 1 ? '' : 's'} to revisit. Answer them
                right and they clear from this list.
              </p>
              <button
                type="button"
                onClick={(e) => openReview(e.timeStamp)}
                className="min-h-12 shrink-0 rounded-full bg-[#e9ece8] px-6 py-3 text-sm font-semibold text-[#0f1412] transition-opacity hover:opacity-90"
              >
                Review {Math.min(weakSpots.length, REVIEW_SESSION_SIZE)} now
              </button>
            </div>
          </Card>
        ) : null}

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
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="shrink-0" style={{ color: theme.accent }}>
                    <LevelGlyph levelId={level.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a7b0a8]">
                          Track {idx + 1}
                        </p>
                        <h2 className="text-lg font-semibold text-[#e9ece8] sm:text-xl">{level.title}</h2>
                        <p className="mt-1 text-xs text-[#a7b0a8]">
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
                              openLesson(lesson)
                            }}
                            className={`flex min-h-12 w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors duration-200 ${
                              disabled
                                ? 'cursor-not-allowed border-[#232b25] bg-[#0f1412] opacity-45'
                                : 'border-[#232b25] bg-transparent hover:bg-white/[0.09]'
                            }`}
                            style={
                              !disabled
                                ? { borderLeftWidth: 3, borderLeftColor: theme.accent }
                                : undefined
                            }
                          >
                            <div>
                              <p className="text-sm font-semibold text-[#e9ece8]">{lesson.title}</p>
                              <p className="text-xs text-[#a7b0a8]">3 questions, +{XP_PER_LESSON} XP</p>
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

      <IdeaSubmission />

      <AnimatePresence>
        {session ? (
          <motion.div
            key="lesson-overlay"
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLesson}
            role="presentation"
          >
            <motion.div
              className="max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom))] w-full max-w-lg cursor-default overflow-y-auto rounded-xl border-x border-b border-[#232b25] border-t border-t-white/25 bg-[#1a221c] p-4 sm:max-h-[85dvh]"
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
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a7b0a8]">
                        Lesson
                      </p>
                      <h3 className="text-xl font-semibold text-[#e9ece8] sm:text-2xl">{session.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={closeLesson}
                      className="min-h-12 rounded-lg border border-[#232b25] bg-transparent px-3 py-2 text-sm font-medium text-[#e9ece8] transition-colors hover:bg-[#1a221c]"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#a7b0a8]">{session.explanation}</p>
                  <button
                    type="button"
                    onClick={(e) => startQuiz(e.timeStamp)}
                    className="mt-6 min-h-12 w-full rounded-full bg-[#e9ece8] py-3 text-sm font-semibold text-[#0f1412] transition-opacity duration-200 hover:opacity-90"
                  >
                    Start quiz
                  </button>
                </>
              ) : null}

              {phase === 'quiz' && currentQ ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-[#a7b0a8]">
                      {session.review ? 'Review · ' : ''}Q {qIndex + 1} / {questionCount}
                    </p>
                    <button
                      type="button"
                      onClick={closeLesson}
                      className="min-h-12 rounded-lg border border-[#232b25] bg-transparent px-3 py-2 text-xs font-medium text-[#e9ece8]"
                    >
                      Exit
                    </button>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#e9ece8] sm:text-lg">{currentQ.question}</h3>
                  <div className="mt-4 space-y-2">
                    {shuffledOptions.map((opt, idx) => {
                      const show = picked !== null
                      const isThisCorrect = opt.originalIndex === currentQ.correctIndex
                      const isPicked = picked === idx
                      const userMissed = show && isPicked && !isThisCorrect

                      const tone = !show
                        ? 'border-[#232b25] bg-transparent text-gray-200 hover:bg-white/[0.09]'
                        : isThisCorrect
                          ? 'border-[#2979ff]/80 bg-[#2979ff]/12 text-[#e9ece8] ring-1 ring-[#2979ff]/25'
                          : userMissed
                            ? 'border-red-500/50 bg-red-500/15 text-red-50'
                            : 'border-[#232b25] bg-white/[0.03] text-[#a7b0a8]'

                      return (
                        <motion.button
                          key={`${currentQ.id}-${idx}-${opt.originalIndex}`}
                          type="button"
                          disabled={show}
                          onClick={(e) => onPickOption(idx, e.timeStamp)}
                          animate={
                            userMissed
                              ? { x: [0, -6, 6, -5, 5, -3, 3, 0] }
                              : { x: 0 }
                          }
                          transition={{ duration: 0.42, ease: 'easeInOut' }}
                          className={`min-h-12 w-full rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors duration-200 ${tone}`}
                        >
                          {opt.text}
                        </motion.button>
                      )
                    })}
                  </div>
                  <AnimatePresence>
                    {picked !== null ? (
                      <motion.div
                        key={`why-${currentQ.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="mt-4 rounded-lg border-l-[3px] border-[#2979ff] bg-[#2979ff]/8 px-3 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2979ff]">
                            Why
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-[#e9ece8]">{currentQ.why}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => goNext(e.timeStamp)}
                          className="mt-4 min-h-12 w-full rounded-full bg-[#e9ece8] py-3 text-sm font-semibold text-[#0f1412] transition-opacity hover:opacity-90"
                        >
                          {isLastQuestion ? 'See results' : 'Next question'}
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </>
              ) : null}

              {phase === 'result' ? (
                <>
                  <h3 className="text-xl font-semibold text-[#e9ece8]">
                    {session.review ? 'Review done' : 'Score check'}
                  </h3>
                  <p className="mt-2 text-sm text-[#a7b0a8]">
                    You got <span className="font-mono font-semibold text-[#2979ff]">{correctCount}</span> /{' '}
                    {questionCount} correct.
                  </p>
                  {session.review ? (
                    <p className="mt-2 text-sm text-[#a7b0a8]">
                      Cleared questions are off your weak spots list. Missed ones stay for next time.
                    </p>
                  ) : passed ? (
                    <>
                      {done.has(session.id) ? (
                        <p className="mt-2 text-sm text-[#a7b0a8]">Already completed — no repeat XP, but reps count.</p>
                      ) : (
                        <>
                          <p className="mt-2 text-sm text-[#e9ece8]">+{XP_PER_LESSON} XP unlocked.</p>
                          {earnedBonus > 0 ? (
                            <p className="mt-1 text-sm text-[#2979ff]">
                              +{earnedBonus} bonus XP
                              {perfect ? ' (perfect score' : ' ('}
                              {perfect && speedBonus > 0 ? ' + ' : ''}
                              {speedBonus > 0 ? 'fast answers' : ''})
                            </p>
                          ) : null}
                        </>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-[#a7b0a8]">
                      You need 2 of {questionCount} to pass. Run it back.
                    </p>
                  )}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={(e) => void finishLesson(e.timeStamp)}
                      className="min-h-12 flex-1 rounded-full bg-[#e9ece8] py-3 text-sm font-semibold text-[#0f1412] transition-opacity hover:opacity-90"
                    >
                      {session.review ? 'Done' : passed ? 'Claim XP' : 'Retry quiz'}
                    </button>
                    <button
                      type="button"
                      onClick={closeLesson}
                      className="min-h-12 rounded-lg border border-[#232b25] bg-transparent px-4 py-3 text-sm font-medium text-[#e9ece8] hover:bg-[#1a221c]"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : null}

              {phase === 'trackdone' ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2979ff]">
                    Track complete
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-[#e9ece8]">{completedTrackTitle}: done.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#a7b0a8]">
                    Every lesson in this track is finished. The next track is unlocked — keep the streak
                    alive.
                  </p>
                  <button
                    type="button"
                    onClick={closeLesson}
                    className="mt-6 min-h-12 w-full rounded-full bg-[#e9ece8] py-3 text-sm font-semibold text-[#0f1412] transition-opacity hover:opacity-90"
                  >
                    Keep going
                  </button>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
