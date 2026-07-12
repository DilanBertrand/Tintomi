import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { MeshBackdrop } from './components/MeshBackdrop'
import { Navbar, type TabId } from './components/Navbar'
import { stocks } from './data/stocks'
import { Community } from './pages/Community'
import { Home } from './pages/Home'
import { Invest, type LivePrices, type Portfolio, type PriceHistory } from './pages/Invest'
import { LandingPage } from './pages/LandingPage'
import { Learn } from './pages/Learn'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { SignUp } from './pages/SignUp'
import { fetchCandleCloses } from './lib/finnhub'
import { localProgressKeys } from './lib/localProgress'
import { fetchProfile } from './lib/profiles'
import { saveProgress } from './lib/progressSync'
import {
  bumpLearnStreak,
  displayLearnStreak,
  mergeLearnStreak,
  type LearnStreak,
} from './lib/streak'
import { getDisplayName, truncateForNav } from './lib/displayName'
import { pathToTab, tabToPath } from './lib/routes'

function initLive(): LivePrices {
  const o: LivePrices = {}
  for (const s of stocks) {
    o[s.id] = { price: s.basePrice, changePct: s.changePercent }
  }
  return o
}

function initHistory(live: LivePrices): PriceHistory {
  const h: PriceHistory = {}
  for (const s of stocks) {
    const p = live[s.id]?.price ?? s.basePrice
    h[s.id] = [p, p]
  }
  return h
}

type WalletState = { balance: number; portfolio: Portfolio }

type WalletAction =
  | { type: 'buy'; stockId: string; price: number }
  | { type: 'sell'; stockId: string; price: number }
  | { type: 'hydrate'; state: WalletState }

const INITIAL_BALANCE = 1000

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  if (action.type === 'hydrate') return action.state
  if (action.type === 'buy') {
    const { stockId, price } = action
    if (state.balance < price) return state
    return {
      balance: Math.round((state.balance - price) * 100) / 100,
      portfolio: { ...state.portfolio, [stockId]: (state.portfolio[stockId] ?? 0) + 1 },
    }
  }
  if (action.type === 'sell') {
    const { stockId, price } = action
    const shares = state.portfolio[stockId] ?? 0
    if (shares <= 0) return state
    const next = shares - 1
    const portfolio = { ...state.portfolio }
    if (next === 0) delete portfolio[stockId]
    else portfolio[stockId] = next
    return {
      balance: Math.round((state.balance + price) * 100) / 100,
      portfolio,
    }
  }
  return state
}

function readStringArray(raw: string | null): string[] {
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    /* corrupt */
  }
  return []
}

function readStreak(raw: string | null): LearnStreak {
  if (raw === null) return { streak: 0, lastStreakDate: null }
  try {
    const parsed = JSON.parse(raw) as Partial<LearnStreak>
    if (parsed && typeof parsed.streak === 'number' && Number.isFinite(parsed.streak)) {
      return {
        streak: Math.max(0, Math.floor(parsed.streak)),
        lastStreakDate: typeof parsed.lastStreakDate === 'string' ? parsed.lastStreakDate : null,
      }
    }
  } catch {
    /* corrupt */
  }
  return { streak: 0, lastStreakDate: null }
}

function readWallet(raw: string | null): WalletState | null {
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw) as Partial<WalletState>
    if (
      parsed &&
      typeof parsed.balance === 'number' &&
      Number.isFinite(parsed.balance) &&
      parsed.portfolio &&
      typeof parsed.portfolio === 'object'
    ) {
      const portfolio: Portfolio = {}
      for (const [id, shares] of Object.entries(parsed.portfolio)) {
        if (typeof shares === 'number' && Number.isFinite(shares) && shares > 0) {
          portfolio[id] = Math.floor(shares)
        }
      }
      return { balance: Math.max(0, parsed.balance), portfolio }
    }
  } catch {
    /* corrupt */
  }
  return null
}

type AuthGateView = 'landing' | 'login' | 'signup'

function initialAuthGateView(): AuthGateView {
  if (typeof window === 'undefined') return 'landing'
  const p = window.location.pathname.replace(/\/+$/, '') || '/'
  if (p === '/signup') return 'signup'
  if (p === '/login') return 'login'
  return 'landing'
}

export default function App() {
  const { user, profile, loading: authLoading, authLinkError, clearAuthLinkError } = useAuth()
  const [authGateView, setAuthGateView] = useState<AuthGateView>(initialAuthGateView)
  const [tab, setTab] = useState<TabId>('home')
  const [xp, setXp] = useState(0)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
  const [completedStoryIds, setCompletedStoryIds] = useState<string[]>([])
  const [learnStreak, setLearnStreak] = useState<LearnStreak>({ streak: 0, lastStreakDate: null })
  const [learnPersistReady, setLearnPersistReady] = useState(false)
  const [walletReady, setWalletReady] = useState(false)
  /** True once this user's progress has been merged from the DB — gates DB writes. */
  const [progressSynced, setProgressSynced] = useState(false)
  const [{ balance, portfolio }, dispatchWallet] = useReducer(walletReducer, {
    balance: INITIAL_BALANCE,
    portfolio: {},
  })
  const [livePrices, setLivePrices] = useState<LivePrices>(initLive)
  const [priceHistory, setPriceHistory] = useState<PriceHistory>(() => initHistory(initLive()))
  const [finnhubHistory, setFinnhubHistory] = useState<PriceHistory>({})

  const isLoggedIn = !!user

  const displayName = useMemo(() => getDisplayName(profile, user), [profile, user])
  const navProfileLabel = useMemo(() => truncateForNav(displayName), [displayName])

  useEffect(() => {
    if (isLoggedIn) document.body.classList.add('tm-dashboard')
    else document.body.classList.remove('tm-dashboard')
    return () => document.body.classList.remove('tm-dashboard')
  }, [isLoggedIn])

  /**
   * Hydrate all progress (XP, lessons, stories, wallet, lesson streak) once auth
   * settles: merge localStorage with the DB profile so nothing is lost and
   * progress follows the account across devices. XP and completed lists escalate
   * (max / union — never lose an achievement); wallet and streak take the DB copy
   * when present (last-write-wins across devices). progressSynced then unlocks
   * DB write-through.
   */
  useEffect(() => {
    if (authLoading) return
    let cancelled = false

    void (async () => {
      setLearnPersistReady(false)
      setWalletReady(false)
      setProgressSynced(false)
      if (!user?.id) {
        if (!cancelled) {
          setXp(0)
          setCompletedLessonIds([])
          setCompletedStoryIds([])
          setLearnStreak({ streak: 0, lastStreakDate: null })
          dispatchWallet({ type: 'hydrate', state: { balance: INITIAL_BALANCE, portfolio: {} } })
        }
        return
      }

      // --- local cache ---
      let localXp = 0
      let localLessons: string[] = []
      let localStories: string[] = []
      let localStreak: LearnStreak = { streak: 0, lastStreakDate: null }
      let localWallet: WalletState | null = null
      try {
        const xpRaw = localStorage.getItem(localProgressKeys.learnXp(user.id))
        if (xpRaw !== null) {
          const n = Number(xpRaw)
          if (Number.isFinite(n) && n >= 0) localXp = Math.floor(n)
        }
        localLessons = readStringArray(localStorage.getItem(localProgressKeys.learnCompletedLessons(user.id)))
        localStories = readStringArray(localStorage.getItem(localProgressKeys.learnCompletedStories(user.id)))
        localStreak = readStreak(localStorage.getItem(localProgressKeys.learnStreak(user.id)))
        localWallet = readWallet(localStorage.getItem(localProgressKeys.investWallet(user.id)))
      } catch {
        /* private mode / corrupt: treat as empty */
      }

      // --- DB profile (source of truth across devices) ---
      const db = await fetchProfile(user.id)
      if (cancelled) return

      const mergedXp = Math.max(localXp, db?.xp ?? 0)
      const mergedLessons = Array.from(new Set([...localLessons, ...(db?.completed_lessons ?? [])]))
      const mergedStories = Array.from(new Set([...localStories, ...(db?.completed_stories ?? [])]))
      const mergedStreak = mergeLearnStreak(localStreak, db?.learn_streak ?? null)
      const mergedWallet: WalletState = db?.wallet ?? localWallet ?? { balance: INITIAL_BALANCE, portfolio: {} }

      setXp(mergedXp)
      setCompletedLessonIds(mergedLessons)
      setCompletedStoryIds(mergedStories)
      setLearnStreak(mergedStreak)
      dispatchWallet({ type: 'hydrate', state: mergedWallet })
      setLearnPersistReady(true)
      setWalletReady(true)
      setProgressSynced(true)
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, authLoading])

  // Persist XP: localStorage cache always, DB once merged.
  useEffect(() => {
    if (!user?.id || !learnPersistReady) return
    try {
      localStorage.setItem(localProgressKeys.learnXp(user.id), String(xp))
    } catch {
      /* quota / private mode */
    }
    if (progressSynced) void saveProgress(user.id, { xp })
  }, [user?.id, xp, learnPersistReady, progressSynced])

  // Persist completed lessons.
  useEffect(() => {
    if (!user?.id || !learnPersistReady) return
    try {
      localStorage.setItem(localProgressKeys.learnCompletedLessons(user.id), JSON.stringify(completedLessonIds))
    } catch {
      /* quota / private mode */
    }
    if (progressSynced) void saveProgress(user.id, { completed_lessons: completedLessonIds })
  }, [user?.id, completedLessonIds, learnPersistReady, progressSynced])

  // Persist completed story lessons.
  useEffect(() => {
    if (!user?.id || !learnPersistReady) return
    try {
      localStorage.setItem(localProgressKeys.learnCompletedStories(user.id), JSON.stringify(completedStoryIds))
    } catch {
      /* quota / private mode */
    }
    if (progressSynced) void saveProgress(user.id, { completed_stories: completedStoryIds })
  }, [user?.id, completedStoryIds, learnPersistReady, progressSynced])

  // Persist lesson streak.
  useEffect(() => {
    if (!user?.id || !learnPersistReady) return
    try {
      localStorage.setItem(localProgressKeys.learnStreak(user.id), JSON.stringify(learnStreak))
    } catch {
      /* quota / private mode */
    }
    if (progressSynced) void saveProgress(user.id, { learn_streak: learnStreak })
  }, [user?.id, learnStreak, learnPersistReady, progressSynced])

  // Persist the paper-trading wallet.
  useEffect(() => {
    if (!user?.id || !walletReady) return
    try {
      localStorage.setItem(localProgressKeys.investWallet(user.id), JSON.stringify({ balance, portfolio }))
    } catch {
      /* quota / private mode */
    }
    if (progressSynced) void saveProgress(user.id, { wallet: { balance, portfolio } })
  }, [user?.id, balance, portfolio, walletReady, progressSynced])

  useEffect(() => {
    if (!isLoggedIn) return
    void Promise.resolve().then(() => setAuthGateView('landing'))
  }, [isLoggedIn])

  /** Keep / /login /signup in sync with auth gate when logged out. */
  useEffect(() => {
    if (isLoggedIn || authLoading) return
    const path =
      authGateView === 'signup' ? '/signup' : authGateView === 'login' ? '/login' : '/'
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path)
    }
  }, [authGateView, isLoggedIn, authLoading])

  useEffect(() => {
    if (isLoggedIn || authLoading) return
    const onPop = () => {
      const p = window.location.pathname.replace(/\/+$/, '') || '/'
      if (p === '/signup') setAuthGateView('signup')
      else if (p === '/login') setAuthGateView('login')
      else setAuthGateView('landing')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isLoggedIn, authLoading])

  useEffect(() => {
    if (!isLoggedIn) return
    const token = import.meta.env.VITE_FINNHUB_TOKEN as string | undefined
    if (!token) return

    let cancelled = false

    async function loadFinnhub() {
      const next: PriceHistory = {}
      for (const s of stocks) {
        if (cancelled) return
        const c = await fetchCandleCloses(s.symbol)
        if (c && c.length >= 2) next[s.id] = c
        await new Promise((r) => window.setTimeout(r, 260))
      }
      if (!cancelled) setFinnhubHistory(next)
    }

    loadFinnhub()
    const id = window.setInterval(loadFinnhub, 90_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [isLoggedIn])

  const chartSeries = useMemo(() => {
    const out: PriceHistory = { ...priceHistory }
    for (const s of stocks) {
      const fh = finnhubHistory[s.id]
      if (fh?.length) out[s.id] = fh
    }
    return out
  }, [priceHistory, finnhubHistory])

  useEffect(() => {
    if (!isLoggedIn) return
    const id = window.setInterval(() => {
      setLivePrices((prev) => {
        const next: LivePrices = { ...prev }
        for (const s of stocks) {
          const cur = next[s.id]
          const wiggle = (Math.random() - 0.5) * 0.18
          const price = Math.max(0.5, Math.round((cur.price + wiggle) * 100) / 100)
          const drift = (Math.random() - 0.5) * 0.08
          const changePct = Math.round((cur.changePct * 0.96 + drift) * 100) / 100
          next[s.id] = { price, changePct }
        }
        setPriceHistory((hist) => {
          const nh: PriceHistory = { ...hist }
          for (const s of stocks) {
            const p = next[s.id].price
            nh[s.id] = [...(nh[s.id] ?? [p]), p].slice(-56)
          }
          return nh
        })
        return next
      })
    }, 2200)
    return () => window.clearInterval(id)
  }, [isLoggedIn])

  const portfolioValue = useMemo(() => {
    let sum = balance
    for (const s of stocks) {
      const shares = portfolio[s.id] ?? 0
      sum += shares * (livePrices[s.id]?.price ?? s.basePrice)
    }
    return sum
  }, [balance, portfolio, livePrices])

  const addXp = useCallback((n: number) => setXp((v) => v + n), [])

  const completeLesson = (lessonId: string) => {
    setCompletedLessonIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]))
    setLearnStreak((prev) => bumpLearnStreak(prev))
  }

  const completeStory = (storyId: string) => {
    setCompletedStoryIds((prev) => (prev.includes(storyId) ? prev : [...prev, storyId]))
    setLearnStreak((prev) => bumpLearnStreak(prev))
  }

  const buy = useCallback((stockId: string, price: number) => {
    dispatchWallet({ type: 'buy', stockId, price })
  }, [])

  const sell = useCallback((stockId: string, price: number) => {
    dispatchWallet({ type: 'sell', stockId, price })
  }, [])

  const goToTab = useCallback((next: TabId) => {
    setTab(next)
    window.history.pushState(null, '', tabToPath(next))
  }, [])

  /** Sync dashboard tab with URL on load and after auth resolves. */
  useEffect(() => {
    if (!isLoggedIn || authLoading) return
    const t = pathToTab(window.location.pathname)
    const canonical = tabToPath(t)
    void Promise.resolve().then(() => {
      setTab(t)
      if (window.location.pathname !== canonical) {
        window.history.replaceState(null, '', canonical)
      }
    })
  }, [isLoggedIn, authLoading])

  useEffect(() => {
    if (!isLoggedIn) return
    const onPop = () => {
      setTab(pathToTab(window.location.pathname))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isLoggedIn])

  /** Logged out: leave dashboard URLs so a refresh opens the marketing shell. */
  useEffect(() => {
    if (isLoggedIn || authLoading) return
    const p = window.location.pathname
    if (/^\/(home|learn|invest|community|profile)(\/|$)/.test(p)) {
      window.history.replaceState(null, '', '/')
    }
  }, [isLoggedIn, authLoading])

  useEffect(() => {
    if (!isLoggedIn) return
    window.scrollTo(0, 0)
  }, [tab, isLoggedIn])

  if (authLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#0f1412] text-[#2979ff]">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <p className="text-sm font-semibold uppercase tracking-wide text-[#a7b0a8]">Loading...</p>
      </div>
    )
  }

  if (authLinkError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#0f1412] px-6 text-center text-gray-100">
        <p className="max-w-md text-sm font-medium text-[#e9ece8]" role="alert">
          {authLinkError}
        </p>
        <button
          type="button"
          onClick={clearAuthLinkError}
          className="rounded-full bg-[#e9ece8] px-5 py-2 text-sm font-semibold text-[#0f1412] transition hover:brightness-95"
          >
        Continue
        </button>
        </div>
      )
  }

  if (!isLoggedIn) {
    if (authGateView === 'login') {
      return (
        <Login
          onBack={() => setAuthGateView('landing')}
          onSwitchToSignUp={() => setAuthGateView('signup')}
        />
      )
    }
    if (authGateView === 'signup') {
      return (
        <SignUp
          onBack={() => setAuthGateView('landing')}
          onSwitchToLogin={() => setAuthGateView('login')}
        />
      )
    }
    return (
      <div className="min-h-dvh bg-[#0f1412] text-gray-100">
        <LandingPage onGoToSignUp={() => setAuthGateView('signup')} />
      </div>
    )
  }

  const tabEase = [0.16, 1, 0.3, 1] as const

  return (
    <div className="relative flex min-h-dvh flex-col text-gray-100">
      <MeshBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-10">
        <header className="relative mb-4 flex min-h-[2.75rem] w-full items-center justify-center pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:min-h-[3rem]">
          <p className="tm-chrome-wordmark-app max-w-[calc(100%-2rem)] text-center sm:max-w-none">TINTOMI</p>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            role="tabpanel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: tabEase }}
          >
            {tab === 'home' ? <Home onNavigate={goToTab} /> : null}
            {tab === 'learn' ? (
              <Learn
                userId={user.id}
                xp={xp}
                onAddXp={addXp}
                completedLessonIds={completedLessonIds}
                onCompleteLesson={completeLesson}
                completedStoryIds={completedStoryIds}
                onCompleteStory={completeStory}
                streakDays={displayLearnStreak(learnStreak)}
              />
            ) : null}
            {tab === 'invest' ? (
              <Invest
                balance={balance}
                portfolio={portfolio}
                live={livePrices}
                chartSeries={chartSeries}
                onBuy={buy}
                onSell={sell}
              />
            ) : null}
            {tab === 'community' ? (
              <Community userId={user.id} userXp={xp} youDisplayName={displayName} onAddXp={addXp} />
            ) : null}
            {tab === 'profile' ? <Profile xp={xp} portfolioValue={portfolioValue} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
      <Navbar active={tab} onChange={goToTab} profileTabLabel={navProfileLabel} />
    </div>
  )
}
