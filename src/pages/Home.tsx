import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CreditCard, Flame, Newspaper, PiggyBank, TrendingUp, Zap } from 'lucide-react'
import { useRef } from 'react'
import type { TabId } from '../components/Navbar'

const learnSnippets = [
  {
    id: '1',
    title: 'Inflation in 60 seconds',
    tag: 'Macro',
    tagClass: 'text-sky-300 bg-sky-400/20 ring-1 ring-sky-400/30',
    Icon: Flame,
    iconClass: 'from-amber-300 via-orange-500 to-rose-600',
  },
  {
    id: '2',
    title: 'ETFs vs single stocks',
    tag: 'Invest',
    tagClass: 'text-[#00FF88] bg-[#00FF88]/15 ring-1 ring-[#00FF88]/35',
    Icon: TrendingUp,
    iconClass: 'from-cyan-400 via-blue-500 to-indigo-700',
  },
  {
    id: '3',
    title: 'Emergency fund basics',
    tag: 'Save',
    tagClass: 'text-amber-300 bg-amber-400/20 ring-1 ring-amber-400/30',
    Icon: PiggyBank,
    iconClass: 'from-amber-400 to-yellow-500',
  },
  {
    id: '4',
    title: 'Credit scores, decoded',
    tag: 'Credit',
    tagClass: 'text-violet-300 bg-violet-400/15 ring-1 ring-violet-400/25',
    Icon: CreditCard,
    iconClass: 'from-violet-400 to-fuchsia-700',
  },
  {
    id: '5',
    title: 'Side income and taxes',
    tag: 'Income',
    tagClass: 'text-cyan-300 bg-cyan-400/15 ring-1 ring-cyan-400/25',
    Icon: Zap,
    iconClass: 'from-emerald-400 to-cyan-600',
  },
] as const

const trending = [
  { id: 't1', title: 'Apple pricing power', sub: 'Hardware margins in focus.', hot: true },
  { id: 't2', title: 'Tesla volatility', sub: 'Range-bound after earnings.', hot: true },
  { id: 't3', title: 'Nike retail reset', sub: 'Inventory normalization continues.', hot: false },
]

/** Narrow: one readable card width; sm+: three-across strip (gap-4 = 1rem) */
const storyCardBase =
  'data-learn-card flex min-h-[220px] w-[min(100%,17.5rem)] min-w-[min(100%,17.5rem)] max-w-[17.5rem] flex-none snap-start snap-always flex-col rounded-3xl border border-white/10 bg-white/5 p-4 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_36px_rgba(0,255,136,0.08)] backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_0_48px_rgba(0,255,136,0.15)] sm:min-h-[240px] sm:w-[calc((100%-2rem)/3)] sm:min-w-[calc((100%-2rem)/3)] sm:max-w-[calc((100%-2rem)/3)] sm:p-5'

type HomeProps = {
  onNavigate: (tab: TabId) => void
}

export function Home({ onNavigate }: HomeProps) {
  const learnStripRef = useRef<HTMLDivElement>(null)

  const goLearnTab = () => {
    onNavigate('learn')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const goInvestTab = () => {
    onNavigate('invest')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const scrollLearnStripLeft = () => {
    learnStripRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const scrollLearnStripRight = () => {
    learnStripRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  return (
    <div className="overflow-x-hidden pb-28">
      {/* Top hero */}
      <motion.header
        className="px-2 text-center sm:px-0"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="tm-headline text-[clamp(1.75rem,6.5vw,3.25rem)] font-black uppercase leading-[1.08] tracking-tighter sm:text-5xl">
          YOUR MONEY IS LOSING POWER
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[1.1rem] leading-relaxed text-neutral-200 sm:text-[1.15rem]">
          Inflation does not ask permission. Learn why prices climb, how markets react, and what you can do about it—
          before your first real paycheck.
        </p>
      </motion.header>

      {/* Section 1: Trending */}
      <motion.section
        className="mt-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-5%' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="tm-headline mb-4 px-1 text-left text-sm font-black uppercase tracking-tight sm:text-base">
          Trending
        </h2>
        <div className="space-y-2">
          {trending.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onNavigate('invest')}
              className={`w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 hover:border-white/15 hover:bg-white/[0.07] ${
                t.hot ? 'ring-1 ring-[#00FF88]/30 shadow-[0_0_32px_rgba(0,255,136,0.12)]' : ''
              }`}
            >
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-tight text-white">{t.title}</p>
                  <p className="mt-1 text-[1.05rem] leading-relaxed text-neutral-300">{t.sub}</p>
                </div>
                {t.hot ? (
                  <span className="w-fit shrink-0 self-start rounded-full bg-gradient-to-r from-orange-500/90 to-rose-600/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_20px_rgba(251,146,60,0.45)] sm:self-auto">
                    Hot
                  </span>
                ) : (
                  <span className="w-fit shrink-0 self-start rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400 backdrop-blur-sm sm:self-auto">
                    Watch
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Section 2: Learn in 60s — three-across snap strip */}
      <motion.section
        className="mt-10 overflow-visible"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-5%' }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-4 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="tm-headline min-w-0 text-sm font-black uppercase tracking-tight sm:text-base">Learn in 60s</h2>
          <button
            type="button"
            onClick={goLearnTab}
            className="group flex w-fit shrink-0 items-center gap-1 self-start rounded-full border border-white/10 bg-white/5 py-2 pl-3 pr-2 text-xs font-bold uppercase tracking-wide text-[#00FF88] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md transition hover:border-[#00FF88]/35 hover:bg-white/[0.08] sm:self-auto sm:text-sm"
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
            className="absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-neutral-200 shadow-md backdrop-blur-md transition hover:border-[#00FF88]/55 hover:text-[#00FF88] hover:shadow-[0_0_22px_rgba(0,255,136,0.45),0_0_40px_rgba(0,255,136,0.15)] sm:flex sm:left-0 md:left-[-8px]"
            aria-label="Scroll learn cards left"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            onClick={scrollLearnStripRight}
            className="absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-neutral-200 shadow-md backdrop-blur-md transition hover:border-[#00FF88]/55 hover:text-[#00FF88] hover:shadow-[0_0_22px_rgba(0,255,136,0.45),0_0_40px_rgba(0,255,136,0.15)] sm:flex sm:right-0 md:right-[-8px]"
            aria-label="Scroll learn cards right"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>

          <div
            ref={learnStripRef}
            className="tm-strip-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {learnSnippets.map((c) => {
              const SnippetIcon = c.Icon
              return (
                <button
                  key={c.id}
                  type="button"
                  data-learn-card
                  onClick={goLearnTab}
                  className={storyCardBase}
                >
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${c.iconClass} shadow-[inset_0_2px_0_0_rgba(255,255,255,0.25)] ring-1 ring-white/15`}
                    >
                      <SnippetIcon className="text-white" strokeWidth={2.1} size={24} />
                    </div>
                    <span
                      className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${c.tagClass}`}
                    >
                      {c.tag}
                    </span>
                  </div>
                  <p className="mt-auto pt-6 text-left text-base font-bold uppercase leading-snug tracking-tight text-white">
                    {c.title}
                  </p>
                  <p className="mt-3 text-left text-[1.05rem] text-neutral-400">Swipe for more</p>
                </button>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* Section 3: Featured news */}
      <motion.section
        className="mt-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-5%' }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_48px_rgba(56,189,248,0.14)] backdrop-blur-xl sm:p-7">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.25)] ring-1 ring-white/15">
              <Newspaper className="text-white" strokeWidth={2} size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="tm-headline text-xs font-black uppercase tracking-widest text-sky-200/90">Featured news</p>
              <p className="tm-headline mt-2 text-xl font-black uppercase leading-tight tracking-tighter text-white sm:text-2xl">
                Your future iPhone just got more expensive
              </p>
              <p className="mt-3 text-[1.1rem] leading-relaxed text-neutral-200">
                Apple raised prices. Here is the short version of what that means for your wallet—and why big brands can
                move markets you will trade in the sim.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={goInvestTab}
            className="relative mt-6 w-full rounded-2xl bg-[#00FF88] py-4 text-sm font-black uppercase tracking-tight text-black shadow-[0_0_32px_rgba(0,255,136,0.45),inset_0_1px_0_0_rgba(255,255,255,0.35)] transition hover:brightness-105 active:translate-y-px"
          >
            Peek the Sim
          </button>
        </div>
      </motion.section>
    </div>
  )
}
