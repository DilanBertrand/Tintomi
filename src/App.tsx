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

type WalletAction = { type: 'buy'; stockId: string; price: number } | { type: 'sell'; stockId: string; price: number }

function walletReducer(state: WalletState, action: WalletAction): WalletState {
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

type AuthGateView = 'landing' | 'login' | 'signup'

function initialAuthGateView(): AuthGateView {
  if (typeof window === 'undefined') return 'landing'
  const p = window.location.pathname.replace(/\/+$/, '') || '/'
  if (p === '/signup') return 'signup'
  if (p === '/login') return 'login'
  return 'landing'
}

export default function App() {
  const { user, profile, loading: authLoading } = useAuth()
  const [authGateView, setAuthGateView] = useState<AuthGateView>(initialAuthGateView)
  const [tab, setTab] = useState<TabId>('home')
  const [xp, setXp] = useState(0)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
  const [learnPersistReady, setLearnPersistReady] = useState(false)
  const [{ balance, portfolio }, dispatchWallet] = useReducer(walletReducer, {
    balance: 1000,
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

  /** Load Learn XP + completed lessons from localStorage after auth settles; reset when logged out */
  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setXp(0)
      setCompletedLessonIds([])
      setLearnPersistReady(false)
      return
    }
    try {
      const xpRaw = localStorage.getItem(localProgressKeys.learnXp(user.id))
      if (xpRaw !== null) {
        const n = Number(xpRaw)
        if (Number.isFinite(n) && n >= 0) setXp(Math.floor(n))
      } else {
        setXp(0)
      }
      const lessonsRaw = localStorage.getItem(localProgressKeys.learnCompletedLessons(user.id))
      if (lessonsRaw !== null) {
        const parsed: unknown = JSON.parse(lessonsRaw)
        if (Array.isArray(parsed) && parsed.every((x): x is string => typeof x === 'string')) {
          setCompletedLessonIds(parsed)
        } else {
          setCompletedLessonIds([])
        }
      } else {
        setCompletedLessonIds([])
      }
    } catch {
      setXp(0)
      setCompletedLessonIds([])
    }
    setLearnPersistReady(true)
  }, [user?.id, authLoading])

  useEffect(() => {
    if (!user?.id || !learnPersistReady) return
    try {
      localStorage.setItem(localProgressKeys.learnXp(user.id), String(xp))
    } catch {
      /* quota / private mode */
    }
  }, [user?.id, xp, learnPersistReady])

  useEffect(() => {
    if (!user?.id || !learnPersistReady) return
    try {
      localStorage.setItem(localProgressKeys.learnCompletedLessons(user.id), JSON.stringify(completedLessonIds))
    } catch {
      /* quota / private mode */
    }
  }, [user?.id, completedLessonIds, learnPersistReady])

  useEffect(() => {
    if (isLoggedIn) setAuthGateView('landing')
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
    if (!token) {
      setFinnhubHistory({})
      return
    }

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
    setTab(t)
    const canonical = tabToPath(t)
    if (window.location.pathname !== canonical) {
      window.history.replaceState(null, '', canonical)
    }
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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#030712] text-[#00FF88]">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Loading...</p>
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
      <div className="min-h-dvh bg-[#030712] text-gray-100">
        <LandingPage onGoToSignUp={() => setAuthGateView('signup')} />
      </div>
    )
  }

  const tabEase = [0.16, 1, 0.3, 1] as const

  return (
    <div className="relative flex min-h-dvh flex-col text-gray-100">
      <MeshBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10">
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
                xp={xp}
                onAddXp={addXp}
                completedLessonIds={completedLessonIds}
                onCompleteLesson={completeLesson}
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
            {tab === 'community' ? <Community userId={user.id} userXp={xp} youDisplayName={displayName} /> : null}
            {tab === 'profile' ? <Profile xp={xp} portfolioValue={portfolioValue} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
      <Navbar active={tab} onChange={goToTab} profileTabLabel={navProfileLabel} />
    </div>
  )
}
