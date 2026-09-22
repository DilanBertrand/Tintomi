import { motion } from 'framer-motion'
import {
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Globe,
  Newspaper,
  PiggyBank,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TabId } from '../components/Navbar'
import { levels } from '../data/lessons'
import { stocks, type Stock } from '../data/stocks'
import { storyLessons } from '../data/stories'
import { rotateDaily } from '../lib/daily'
import { fetchNews, type NewsItem } from '../lib/market'
import type { LivePrices } from './Invest'

/** Narrow: one readable card width; sm+: three-across strip (gap-4 = 1rem) */
const storyCardBase =
  'data-learn-card flex min-h-[220px] w-[min(100%,17.5rem)] min-w-[min(100%,17.5rem)] max-w-[17.5rem] flex-none snap-start snap-always flex-col rounded-3xl border border-[#232b25] bg-transparent p-4 text-left transition-all duration-300 hover:border-[#232b25]  sm:min-h-[240px] sm:w-[calc((100%-2rem)/3)] sm:min-w-[calc((100%-2rem)/3)] sm:max-w-[calc((100%-2rem)/3)] sm:p-5'

const levelIcons: Record<string, LucideIcon> = {
  'money-basics': PiggyBank,
  saving: PiggyBank,
  investing: TrendingUp,
  business: Briefcase,
  economy: Globe,
}

type LearnCard = { key: string; kind: 'lesson' | 'story'; id: string; title: string; tag: string; Icon: LucideIcon }

function buildLearnCards(completedLessonIds: string[], completedStoryIds: string[]): LearnCard[] {
  const doneL = new Set(completedLessonIds)
  const doneS = new Set(completedStoryIds)
  const pool: LearnCard[] = []
  for (const level of levels) {
    const Icon = levelIcons[level.id] ?? BookOpen
    for (const lesson of level.lessons) {
      if (!doneL.has(lesson.id)) {
        pool.push({ key: `l:${lesson.id}`, kind: 'lesson', id: lesson.id, title: lesson.title, tag: level.title, Icon })
      }
    }
  }
  for (const story of storyLessons) {
    if (!doneS.has(story.id)) {
      pool.push({ key: `s:${story.id}`, kind: 'story', id: story.id, title: story.title, tag: 'Story', Icon: BookOpen })
    }
  }
  // Everything finished: rotate through all of it as a review.
  if (pool.length === 0) {
    for (const level of levels) {
      const Icon = levelIcons[level.id] ?? BookOpen
      for (const lesson of level.lessons) {
        pool.push({ key: `l:${lesson.id}`, kind: 'lesson', id: lesson.id, title: lesson.title, tag: level.title, Icon })
      }
    }
  }
  return rotateDaily(pool, 5)
}

function timeAgo(unixSeconds: number): string {
  if (!unixSeconds) return ''
  const mins = Math.max(1, Math.round((Date.now() / 1000 - unixSeconds) / 60))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

type HomeProps = {
  onNavigate: (tab: TabId) => void
  live: LivePrices
  completedLessonIds: string[]
  completedStoryIds: string[]
  /** Open the Invest tab with this stock selected */
  onOpenStock: (stockId: string) => void
  /** Open the Learn tab straight into this lesson or story */
  onOpenLearnItem: (kind: 'lesson' | 'story', id: string) => void
}

export function Home({
  onNavigate,
  live,
  completedLessonIds,
  completedStoryIds,
  onOpenStock,
  onOpenLearnItem,
}: HomeProps) {
  const learnStripRef = useRef<HTMLDivElement>(null)

  const goLearnTab = () => {
    onNavigate('learn')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const scrollLearnStripLeft = () => {
    learnStripRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const scrollLearnStripRight = () => {
    learnStripRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  // Trending = today's biggest movers in the watchlist, by absolute % change.
  const movers = useMemo(() => {
    const rows = stocks.map((s) => ({ stock: s, pct: live[s.id]?.changePct ?? s.changePercent }))
    rows.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    return rows.slice(0, 3)
  }, [live])

  const learnCards = useMemo(
    () => buildLearnCards(completedLessonIds, completedStoryIds),
    [completedLessonIds, completedStoryIds],
  )

  // Featured news follows the top mover; falls back to the S&P 500.
  const newsStock: Stock = movers[0]?.stock ?? stocks[0]
  const [news, setNews] = useState<{ symbol: string; item: NewsItem | null } | null>(null)
  useEffect(() => {
    const ctrl = new AbortController()
    void fetchNews(newsStock.symbol, ctrl.signal).then((items) => {
      if (!ctrl.signal.aborted) setNews({ symbol: newsStock.symbol, item: items[0] ?? null })
    })
    return () => ctrl.abort()
  }, [newsStock.symbol])
  const headline = news?.symbol === newsStock.symbol ? news.item : null

  return (
    <div className="overflow-x-hidden pb-28">
      {/* Top hero */}
      <motion.header
        className="px-2 text-center sm:px-0"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="tm-headline text-[clamp(1.75rem,6.5vw,3.25rem)] leading-[1.1] sm:text-5xl">
          Your money is losing power
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[1.1rem] leading-relaxed text-[#a7b0a8] sm:text-[1.15rem]">
          Inflation does not ask permission. Learn why prices climb, how markets react, and what you can do about it—
          before your first real paycheck.
        </p>
      </motion.header>

      {/* Section 1: Trending — real movers */}
      <motion.section
        className="mt-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-5%' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="tm-headline text-left text-sm sm:text-base">Trending</h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d968e]">Biggest moves today</p>
        </div>
        <div className="space-y-2">
          {movers.map(({ stock, pct }, i) => {
            const up = pct >= 0
            const hot = Math.abs(pct) >= 2 || i === 0
            const sub =
              Math.abs(pct) >= 4
                ? `${up ? 'Big jump' : 'Big drop'} since yesterday's close. Tap to see the chart.`
                : Math.abs(pct) >= 1.5
                  ? `${up ? 'Climbing' : 'Sliding'} today. Worth a look before you trade.`
                  : 'Quiet day so far. Tap to see the chart.'
            return (
              <button
                key={stock.id}
                type="button"
                onClick={() => onOpenStock(stock.id)}
                className={`w-full rounded-2xl border border-[#232b25] bg-transparent p-4 text-left transition-all duration-300 hover:border-[#232b25] hover:bg-white/[0.07] ${
                  hot ? 'ring-1 ring-[#2979ff]/30' : ''
                }`}
              >
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold uppercase tracking-tight text-[#e9ece8]">
                      {stock.name}{' '}
                      <span className={`font-mono ${up ? 'text-[#5b9bff]' : 'text-[#e06a55]'}`}>
                        {up ? '+' : ''}
                        {pct.toFixed(2)}%
                      </span>
                    </p>
                    <p className="mt-1 text-[1.05rem] leading-relaxed text-[#a7b0a8]">{sub}</p>
                  </div>
                  {hot ? (
                    <span className="w-fit shrink-0 self-start rounded-full border border-[#232b25] bg-[#1a221c] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#e9ece8] sm:self-auto">
                      Hot
                    </span>
                  ) : (
                    <span className="w-fit shrink-0 self-start rounded-full border border-[#232b25] bg-[#0f1412] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#a7b0a8] sm:self-auto">
                      Watch
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </motion.section>

      {/* Section 2: Learn in 60s — today's picks from what you haven't finished */}
      <motion.section
        className="mt-10 overflow-visible"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-5%' }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-4 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <h2 className="tm-headline min-w-0 text-sm sm:text-base">Learn in 60s</h2>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8d968e]">Today's picks, new every day</p>
          </div>
          <button
            type="button"
            onClick={goLearnTab}
            className="group flex w-fit shrink-0 items-center gap-1 self-start rounded-full border border-[#232b25] bg-transparent py-2 pl-3 pr-2 text-xs font-bold uppercase tracking-wide text-[#5b9bff] transition hover:border-[#2979ff]/35 hover:bg-white/[0.08] sm:self-auto sm:text-sm"
          >
            View all
            <ChevronRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.5}
              aria-hidden
            />
          </button>
        </div>

        <div className="relative z-10 overflow-visible px-3 sm:px-6">
          <button
            type="button"
            onClick={scrollLearnStripLeft}
            className="absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#232b25] bg-[#121a15] text-[#a7b0a8] transition hover:border-[#2979ff]/55 hover:text-[#5b9bff]  sm:flex sm:left-0 md:left-[-8px]"
            aria-label="Scroll learn cards left"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            onClick={scrollLearnStripRight}
            className="absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#232b25] bg-[#121a15] text-[#a7b0a8] transition hover:border-[#2979ff]/55 hover:text-[#5b9bff]  sm:flex sm:right-0 md:right-[-8px]"
            aria-label="Scroll learn cards right"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>

          <div
            ref={learnStripRef}
            className="tm-strip-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {learnCards.map((c) => {
              const SnippetIcon = c.Icon
              return (
                <button
                  key={c.key}
                  type="button"
                  data-learn-card
                  onClick={() => onOpenLearnItem(c.kind, c.id)}
                  className={storyCardBase}
                >
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a221c] ring-1 ring-[#232b25]">
                      <SnippetIcon className="text-[#e9ece8]" strokeWidth={2.1} size={24} />
                    </div>
                    <span className="inline-block rounded-md bg-[#1a221c] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#5b9bff] ring-1 ring-[#232b25]">
                      {c.tag}
                    </span>
                  </div>
                  <p className="mt-auto pt-6 text-left text-base font-bold uppercase leading-snug tracking-tight text-[#e9ece8]">
                    {c.title}
                  </p>
                  <p className="mt-3 text-left text-[1.05rem] text-[#a7b0a8]">
                    {c.kind === 'story' ? 'Read the story' : 'Read + 3-question quiz'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* Section 3: Featured news — live headline for the top mover */}
      <motion.section
        className="mt-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-5%' }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-[#232b25] bg-transparent p-6 sm:p-7">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1a221c] ring-1 ring-[#232b25]">
              <Newspaper className="text-[#e9ece8]" strokeWidth={2} size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5b9bff]">
                In the news · {newsStock.name}
              </p>
              {headline ? (
                <>
                  <p className="tm-headline mt-2 text-xl leading-tight text-[#e9ece8] sm:text-2xl">{headline.title}</p>
                  <p className="mt-3 text-sm text-[#8d968e]">
                    {headline.publisher}
                    {headline.publishedAt ? ` · ${timeAgo(headline.publishedAt)}` : ''}
                  </p>
                </>
              ) : news && news.symbol === newsStock.symbol ? (
                <p className="tm-headline mt-2 text-xl leading-tight text-[#e9ece8] sm:text-2xl">
                  No fresh headlines for {newsStock.name} right now.
                </p>
              ) : (
                <p className="mt-2 text-sm text-[#8d968e]">Loading headline…</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenStock(newsStock.id)}
            className="relative mt-6 w-full rounded-full bg-[#e9ece8] py-4 text-sm font-black uppercase tracking-tight text-[#0f1412] transition hover:brightness-105 active:translate-y-px"
          >
            Trade {newsStock.name}
          </button>
        </div>
      </motion.section>
    </div>
  )
}
