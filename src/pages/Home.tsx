import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CreditCard, Flame, Newspaper, PiggyBank, TrendingUp, Zap } from 'lucide-react'
import { useRef } from 'react'
import type { TabId } from '../components/Navbar'

const learnSnippets = [
  {
    id: '1',
    title: 'Inflation in 60 seconds',
    tag: 'Macro',
    tagClass: 'text-[#2979ff] bg-[#1a221c] ring-1 ring-[#232b25]',
    Icon: Flame,
    iconClass: 'bg-[#1a221c]',
  },
  {
    id: '2',
    title: 'ETFs vs single stocks',
    tag: 'Invest',
    tagClass: 'text-[#2979ff] bg-[#1a221c] ring-1 ring-[#232b25]',
    Icon: TrendingUp,
    iconClass: 'bg-[#1a221c]',
  },
  {
    id: '3',
    title: 'Emergency fund basics',
    tag: 'Save',
    tagClass: 'text-[#2979ff] bg-[#1a221c] ring-1 ring-[#232b25]',
    Icon: PiggyBank,
    iconClass: 'bg-[#1a221c]',
  },
  {
    id: '4',
    title: 'Credit scores, decoded',
    tag: 'Credit',
    tagClass: 'text-[#2979ff] bg-[#1a221c] ring-1 ring-[#232b25]',
    Icon: CreditCard,
    iconClass: 'bg-[#1a221c]',
  },
  {
    id: '5',
    title: 'Side income and taxes',
    tag: 'Income',
    tagClass: 'text-[#2979ff] bg-[#1a221c] ring-1 ring-[#232b25]',
    Icon: Zap,
    iconClass: 'bg-[#1a221c]',
  },
] as const

const trending = [
  { id: 't1', title: 'Apple pricing power', sub: 'Hardware margins in focus.', hot: true },
  { id: 't2', title: 'Tesla volatility', sub: 'Range-bound after earnings.', hot: true },
  { id: 't3', title: 'Nike retail reset', sub: 'Inventory normalization continues.', hot: false },
]

/** Narrow: one readable card width; sm+: three-across strip (gap-4 = 1rem) */
const storyCardBase =
  'data-learn-card flex min-h-[220px] w-[min(100%,17.5rem)] min-w-[min(100%,17.5rem)] max-w-[17.5rem] flex-none snap-start snap-always flex-col rounded-3xl border border-[#232b25] bg-transparent p-4 text-left transition-all duration-300 hover:border-[#232b25]  sm:min-h-[240px] sm:w-[calc((100%-2rem)/3)] sm:min-w-[calc((100%-2rem)/3)] sm:max-w-[calc((100%-2rem)/3)] sm:p-5'

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
        <h1 className="tm-headline text-[clamp(1.75rem,6.5vw,3.25rem)] leading-[1.1] sm:text-5xl">
          Your money is losing power
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[1.1rem] leading-relaxed text-[#a7b0a8] sm:text-[1.15rem]">
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
        <h2 className="tm-headline mb-4 px-1 text-left text-sm sm:text-base">
          Trending
        </h2>
        <div className="space-y-2">
          {trending.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onNavigate('invest')}
              className={`w-full rounded-2xl border border-[#232b25] bg-transparent p-4 text-left transition-all duration-300 hover:border-[#232b25] hover:bg-white/[0.07] ${
                t.hot ? 'ring-1 ring-[#2979ff]/30' : ''
              }`}
            >
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-tight text-[#e9ece8]">{t.title}</p>
                  <p className="mt-1 text-[1.05rem] leading-relaxed text-[#a7b0a8]">{t.sub}</p>
                </div>
                {t.hot ? (
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
          <h2 className="tm-headline min-w-0 text-sm sm:text-base">Learn in 60s</h2>
          <button
            type="button"
            onClick={goLearnTab}
            className="group flex w-fit shrink-0 items-center gap-1 self-start rounded-full border border-[#232b25] bg-transparent py-2 pl-3 pr-2 text-xs font-bold uppercase tracking-wide text-[#2979ff] transition hover:border-[#2979ff]/35 hover:bg-white/[0.08] sm:self-auto sm:text-sm"
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
            className="absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#232b25] bg-[#121a15] text-[#a7b0a8] transition hover:border-[#2979ff]/55 hover:text-[#2979ff]  sm:flex sm:left-0 md:left-[-8px]"
            aria-label="Scroll learn cards left"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            onClick={scrollLearnStripRight}
            className="absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#232b25] bg-[#121a15] text-[#a7b0a8] transition hover:border-[#2979ff]/55 hover:text-[#2979ff]  sm:flex sm:right-0 md:right-[-8px]"
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
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${c.iconClass} ring-1 ring-[#232b25]`}
                    >
                      <SnippetIcon className="text-[#e9ece8]" strokeWidth={2.1} size={24} />
                    </div>
                    <span
                      className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${c.tagClass}`}
                    >
                      {c.tag}
                    </span>
                  </div>
                  <p className="mt-auto pt-6 text-left text-base font-bold uppercase leading-snug tracking-tight text-[#e9ece8]">
                    {c.title}
                  </p>
                  <p className="mt-3 text-left text-[1.05rem] text-[#a7b0a8]">Swipe for more</p>
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
        <div className="relative overflow-hidden rounded-3xl border border-[#232b25] bg-transparent p-6 sm:p-7">          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1a221c] ring-1 ring-[#232b25]">
              <Newspaper className="text-[#e9ece8]" strokeWidth={2} size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2979ff]">Featured news</p>
              <p className="tm-headline mt-2 text-xl leading-tight text-[#e9ece8] sm:text-2xl">
                Your future iPhone just got more expensive
              </p>
              <p className="mt-3 text-[1.1rem] leading-relaxed text-[#a7b0a8]">
                Apple raised prices. Here is the short version of what that means for your wallet—and why big brands can
                move markets you will trade in your practice portfolio.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={goInvestTab}
            className="relative mt-6 w-full rounded-full bg-[#e9ece8] py-4 text-sm font-black uppercase tracking-tight text-[#0f1412] transition hover:brightness-105 active:translate-y-px"
          >
            Open trading
          </button>
        </div>
      </motion.section>
    </div>
  )
}
