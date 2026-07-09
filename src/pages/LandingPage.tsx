import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, ChevronDown, Flame, TrendingUp, Users, Zap } from 'lucide-react'
import { MeshBackdrop } from '../components/MeshBackdrop'
import { Sparkline } from '../components/Sparkline'

type LandingPageProps = {
  onGoToSignUp: () => void
}

const head = 'font-bold tracking-tight'
const body = 'text-[1.125rem] leading-relaxed text-[#e9ece8] sm:text-[1.15rem]'
const sectionTitle = 'tm-serif text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.1] text-[#e9ece8]'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function PulsingGlow(_props: { accent: 'green' | 'blue' | 'violet' | 'amber'; className?: string }) {
  return null
}

function GlowCard({
  children,
  accent,
  className = '',
}: {
  children: ReactNode
  accent: 'green' | 'blue' | 'violet'
  className?: string
}) {
  void accent
  return (
    <div className={`relative h-full min-h-0 overflow-hidden rounded-2xl ${className}`}>
      <div className="relative flex h-full min-h-0 flex-col rounded-2xl border border-[#232b25] bg-[#121a15] p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}

function LiveSparkPreview() {
  const [pts, setPts] = useState<number[]>(() => {
    let v = 100
    return Array.from({ length: 20 }, () => {
      v += (Math.random() - 0.48) * 2.2
      return Math.max(92, v)
    })
  })

  useEffect(() => {
    const id = window.setInterval(() => {
      setPts((prev) => {
        const last = prev[prev.length - 1] ?? 100
        const n = Math.max(92, last + (Math.random() - 0.48) * 2.8)
        return [...prev, n].slice(-20)
      })
    }, 1600)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="rounded-2xl border border-[#232b25] bg-[#0f1412] p-4">
      <Sparkline values={pts} width={320} height={72} positive prominent fluid className="mx-auto block w-full max-w-md" />
    </div>
  )
}

const easeOut = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-8% 0px' },
  transition: { duration: 0.55, ease: easeOut },
}

const featureIconClass = 'h-10 w-10 shrink-0'
const featureIconStroke = 1.75
const featureCardHeadline = 'tm-serif text-2xl text-[#e9ece8]'

export function LandingPage({ onGoToSignUp }: LandingPageProps) {
  const go = useCallback((id: string) => () => scrollToId(id), [])
  const [showHeroScrollCue, setShowHeroScrollCue] = useState(true)

  useEffect(() => {
    const onScroll = () => setShowHeroScrollCue(window.scrollY <= 100)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="relative min-h-dvh overflow-x-hidden text-[#e9ece8]">
      <MeshBackdrop />

      {/* Top nav */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#232b25] bg-[#121a15] px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:pb-3 sm:pt-3">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 sm:gap-x-4 sm:gap-y-2">
          <div className="flex min-w-0 items-center justify-start">
            <nav
              className="hidden items-center gap-5 text-sm font-semibold text-[#a7b0a8] lg:gap-6 md:flex"
              aria-label="Primary"
            >
              <button type="button" onClick={go('mission')} className="transition hover:text-[#2979ff]">
                Our Mission
              </button>
              <button type="button" onClick={go('how')} className="transition hover:text-[#2979ff]">
                How it Works
              </button>
              <button type="button" onClick={go('features')} className="transition hover:text-[#2979ff]">
                Features
              </button>
            </nav>
          </div>
          <button
            type="button"
            onClick={() => scrollToId('top')}
            className="tm-chrome-wordmark tm-chrome-wordmark-nav min-w-0 max-w-full justify-self-center truncate px-1 text-center"
          >
            TINTOMI
          </button>
          <div className="flex min-w-0 justify-end justify-self-end">
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault()
                onGoToSignUp()
              }}
              className={`${head} inline-flex shrink-0 items-center justify-center rounded-full border border-[#39423b] bg-transparent px-2.5 py-2 text-[10px] tracking-wide text-[#e9ece8] transition hover:bg-[#1a221c] min-[400px]:px-3 min-[400px]:text-xs sm:px-5 sm:py-2.5 sm:text-sm`}
            >
              <span className="hidden min-[400px]:inline">Login / Sign Up</span>
              <span className="min-[400px]:hidden">Sign up</span>
            </a>
          </div>
        </div>
        <nav
          className="mx-auto mt-2 flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-1.5 px-1 text-[11px] font-semibold text-[#a7b0a8] sm:mt-3 sm:gap-x-5 sm:text-xs md:hidden"
          aria-label="Primary mobile"
        >
          <button type="button" onClick={go('mission')} className="hover:text-[#2979ff]">
            Mission
          </button>
          <button type="button" onClick={go('how')} className="hover:text-[#2979ff]">
            How it Works
          </button>
          <button type="button" onClick={go('features')} className="hover:text-[#2979ff]">
            Features
          </button>
        </nav>
      </header>

      <main className="relative z-10 scroll-smooth pt-[6.75rem] sm:pt-[6.5rem] md:pt-20">
        {/* Hero */}
        <section
          id="top"
          className="relative flex min-h-[min(100dvh,920px)] flex-col items-center justify-center overflow-x-hidden px-4 pb-12 pt-4 text-center sm:min-h-[100dvh] sm:px-5 sm:pt-6 md:px-8"
        >
          <motion.div
            className="relative z-20 mx-auto w-full max-w-5xl pointer-events-none"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <PulsingGlow accent="green" className="opacity-50" />
            <p className="relative z-10 tm-chrome-wordmark-hero">TINTOMI</p>
            <h1
              className="tm-serif relative z-10 mx-auto mt-6 max-w-full px-3 text-center text-[clamp(1rem,calc((100dvw-2.5rem)/11.2),7rem)] leading-[1.1] text-[#e9ece8] max-md:whitespace-normal max-md:text-balance md:whitespace-nowrap sm:mt-8 sm:px-6"
            >
              Grow your money.
            </h1>
            <p className="relative z-10 mx-auto mt-6 max-w-2xl px-1 text-base leading-relaxed text-[#e9ece8] sm:mt-8 sm:px-0 sm:text-[1.125rem] md:text-[1.15rem]">
              You get a fake $1,000 and real market prices. Blow it all on a meme stock, learn why that hurt, try
              again. It costs you nothing but pride.
            </p>
            <motion.a
              href="/signup"
              onClick={(e) => {
                e.preventDefault()
                onGoToSignUp()
              }}
              className={`${head} relative z-30 mx-auto mt-8 flex w-full max-w-[min(100%,20rem)] cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full bg-[#e9ece8] px-8 py-4 text-base tracking-tight text-[#0f1412] transition-transform hover:scale-[1.03] active:scale-[0.99] sm:mt-10 sm:inline-flex sm:w-auto sm:max-w-none sm:px-12 sm:py-5 sm:text-lg md:px-16 md:text-xl pointer-events-auto`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              Start grinding
              <ArrowRight className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.5} aria-hidden />
            </motion.a>
            <p className="relative z-10 mt-8 text-sm text-[#a7b0a8]">Educational only. Not financial advice.</p>
          </motion.div>
        </section>

        {/* Our Mission — overlaps hero */}
        <section id="mission" className="relative z-20 -mt-10 scroll-mt-28 px-4 pb-10 md:-mt-16 md:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-5xl">
            <GlowCard accent="blue" className="border border-[#232b25]">
              <p className={`${head} mb-4 text-sm font-black tracking-widest text-[#2979ff]`}>Why this exists</p>
              <h2 className={`${sectionTitle} max-w-4xl text-balance`}>
                School covered the mitochondria. It skipped the money.
              </h2>
              <p className={`${body} mt-8 max-w-3xl text-pretty text-[#e9ece8]`}>
                Most people take their first real financial hit with their first real paycheck: taxes they did not
                expect, a card balance that grows on its own, a friend who swears some coin is going up. Tintomi is
                the practice round that should have happened first.
              </p>
              <p className={`${body} mt-5 max-w-2xl text-pretty text-[#a7b0a8]`}>
                It is built for teens, it is free, and none of the money is real. The habits are.
              </p>
            </GlowCard>
          </motion.div>
        </section>

        {/* How it Works */}
        <section id="how" className="relative z-10 -mt-6 scroll-mt-28 px-4 py-10 md:-mt-8 md:px-8 md:py-12">
          <motion.div {...fadeUp} className="mx-auto max-w-6xl">
            <h2 className={`${sectionTitle} mb-2 text-center`}>How it works</h2>
            <p className={`${body} mx-auto mb-10 max-w-2xl text-center text-[#a7b0a8]`}>
              You read a little, you trade a lot, and eventually someone in your group chat starts losing to you.
            </p>
            <div className="grid gap-5 md:grid-cols-3 md:items-stretch md:gap-4">
              {[
                {
                  step: '01',
                  title: 'Learn',
                  icon: BookOpen,
                  copy: 'Short lessons on inflation, compounding, and why "buy low, sell high" is harder than it sounds. Each one ends before you reach for your phone.',
                  accent: 'blue' as const,
                },
                {
                  step: '02',
                  title: 'Practice',
                  icon: TrendingUp,
                  copy: 'Take your fake $1,000 to a live-moving watchlist. Panic-sell. Regret it. That regret is the curriculum.',
                  accent: 'green' as const,
                },
                {
                  step: '03',
                  title: 'Compete',
                  icon: Users,
                  copy: 'Leaderboards track XP and levels. Losing to your little cousin is a stronger motivator than any teacher.',
                  accent: 'violet' as const,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-5%' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full min-h-0"
                >
                  <GlowCard accent={item.accent} className="h-full">
                    <div className="flex min-h-0 flex-1 flex-col gap-4">
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <span className="font-mono text-4xl font-semibold text-[#39423b] sm:text-5xl">{item.step}</span>
                        <item.icon className="h-10 w-10 shrink-0 text-[#a7b0a8]" strokeWidth={1.75} aria-hidden />
                      </div>
                      <h3 className="tm-serif text-2xl text-[#e9ece8] sm:text-3xl">{item.title}</h3>
                      <p className={`${body} min-h-0 flex-1 text-[#e9ece8]`}>{item.copy}</p>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="relative z-20 -mt-4 scroll-mt-28 px-4 py-10 md:px-8 md:py-12">
          <motion.div {...fadeUp} className="mx-auto max-w-6xl">
            <h2 className={`${sectionTitle} mb-2 text-center`}>Features</h2>
            <p className={`${body} mx-auto mb-10 max-w-2xl text-center text-[#a7b0a8]`}>
              Three things, honestly. But each one earns its spot.
            </p>
            <div className="grid items-stretch gap-5 lg:grid-cols-3">
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 }}
                className="relative h-full min-h-0 lg:col-span-2"
              >
                <GlowCard accent="green" className="h-full">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Zap className={`${featureIconClass} text-[#2979ff]`} strokeWidth={featureIconStroke} aria-hidden />
                      <h3 className={featureCardHeadline}>The practice floor</h3>
                    </div>
                    <p className={`${body} min-h-0 flex-1 text-pretty text-[#e9ece8]`}>
                      This is the main event: live-moving prices, a watchlist, and your fake $1,000. That green line
                      below is the actual chart component, doing its thing right now. Imagine it with your bad
                      decisions attached.
                    </p>
                    <div className="shrink-0">
                      <LiveSparkPreview />
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="relative h-full min-h-0">
                <GlowCard accent="blue" className="h-full">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Flame className={`${featureIconClass} text-[#2979ff]`} strokeWidth={featureIconStroke} aria-hidden />
                      <h3 className={featureCardHeadline}>Brain gains</h3>
                    </div>
                    <p className={`${body} min-h-0 flex-1 text-pretty text-[#e9ece8]`}>
                      Lessons pay out XP. XP unlocks the next track. It is the same loop your favorite game uses,
                      pointed at inflation and budgeting instead of loot.
                    </p>
                  </div>
                </GlowCard>
              </motion.div>
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.18 }}
                className="relative min-h-0 lg:col-span-3"
              >
                <GlowCard accent="violet">
                  <div className="flex min-h-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                    <div className="flex shrink-0 items-center gap-3">
                      <Users className={`${featureIconClass} text-[#2979ff]`} strokeWidth={featureIconStroke} aria-hidden />
                      <h3 className={featureCardHeadline}>The squad</h3>
                    </div>
                    <p className={`${body} min-h-0 text-pretty text-[#e9ece8]`}>
                      Leaderboards and a feed. Nobody studies compound interest for fun, but plenty of people will do
                      it to stop being ranked below someone they know personally.
                    </p>
                  </div>
                </GlowCard>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Why Tintomi */}
        <section id="why" className="relative z-10 -mt-2 scroll-mt-28 px-4 py-10 md:px-8 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-4xl"
          >
            <PulsingGlow accent="amber" className="-inset-6 opacity-40" />
            <div className="relative rounded-2xl border border-[#232b25] bg-[#121a15] p-8 sm:p-12">
              <h2 className={`${sectionTitle} text-[clamp(2.25rem,5vw,3.5rem)]`}>Why Tintomi?</h2>
              <ul className={`${body} mt-8 space-y-5 text-[#e9ece8]`}>
                <li className="flex gap-4">
                  <span className="mt-1 font-mono text-[#2979ff]">01</span>
                  <span>
                    <strong className="text-[#e9ece8]">Because the tuition here is zero.</strong> The market charges real money
                    for the same lessons. Learn to hold through a dip when the dip cannot touch your lunch money.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mt-1 font-mono text-[#2979ff]">02</span>
                  <span>
                    <strong className="text-[#e9ece8]">Because nobody here talks down to you.</strong> No suits, no jargon walls,
                    no &quot;ask your parents.&quot; Just the mechanics, explained once, plainly.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mt-1 font-mono text-[#2979ff]">03</span>
                  <span>
                    <strong className="text-[#e9ece8]">Because your friends are on the leaderboard.</strong> Financial literacy
                    as a solo chore fails. As a competition, it sticks.
                  </span>
                </li>
              </ul>
            </div>
          </motion.div>
        </section>

        {/* Closing CTA */}
        <section className="relative z-10 px-4 pb-24 pt-8 md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="tm-serif text-[clamp(2rem,4vw,3rem)] text-[#e9ece8]">Ready to run it up?</p>
            <p className={`${body} mx-auto mt-4 max-w-xl text-[#a7b0a8]`}>
              Signup takes about a minute. The fake $1,000 is already sitting there.
            </p>
            <motion.a
              href="/signup"
              onClick={(e) => {
                e.preventDefault()
                onGoToSignUp()
              }}
              className={`${head} mx-auto mt-8 flex w-full max-w-[min(100%,18rem)] touch-manipulation items-center justify-center gap-2 rounded-full bg-[#e9ece8] px-8 py-3.5 text-sm text-[#0f1412] sm:inline-flex sm:w-auto sm:max-w-none sm:px-10 sm:py-4 sm:text-base md:text-lg`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Collect your fake $1,000
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </motion.a>
          </motion.div>
        </section>
      </main>

      <motion.button
        type="button"
        onClick={() => scrollToId('mission')}
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full p-3 text-[#2979ff] outline-none transition hover:scale-105 hover:text-[#e9ece8] focus-visible:ring-2 focus-visible:ring-[#2979ff]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1412] sm:bottom-12 md:bottom-16"
        aria-label="Scroll to next section"
        aria-hidden={!showHeroScrollCue}
        tabIndex={showHeroScrollCue ? 0 : -1}
        style={{ pointerEvents: showHeroScrollCue ? 'auto' : 'none' }}
        animate={{ opacity: showHeroScrollCue ? 1 : 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
      >
        <motion.span
          aria-hidden
          className="flex origin-center items-center justify-center will-change-transform"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.75, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={32} strokeWidth={1.35} className="shrink-0" />
        </motion.span>
      </motion.button>
    </div>
  )
}
