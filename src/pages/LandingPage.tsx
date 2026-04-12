import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, ChevronDown, Flame, TrendingUp, Users, Zap } from 'lucide-react'
import { MeshBackdrop } from '../components/MeshBackdrop'
import { Sparkline } from '../components/Sparkline'

type LandingPageProps = {
  onGoToSignUp: () => void
}

const head = "font-['Space_Grotesk',system-ui,sans-serif] font-bold uppercase tracking-tight"
const body = 'text-[1.125rem] leading-relaxed text-neutral-100 sm:text-[1.15rem]'
const sectionTitle =
  "font-['Space_Grotesk',system-ui,sans-serif] text-[clamp(2.5rem,6vw,4.25rem)] font-black uppercase leading-[1.05] tracking-tighter text-white"

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function PulsingGlow({
  accent,
  className = '',
}: {
  accent: 'green' | 'blue' | 'violet' | 'amber'
  className?: string
}) {
  const bg =
    accent === 'green'
      ? 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,255,136,0.45), transparent 65%)'
      : accent === 'blue'
        ? 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(96,165,250,0.42), transparent 65%)'
        : accent === 'violet'
          ? 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(167,139,250,0.42), transparent 65%)'
          : 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(251,191,36,0.35), transparent 65%)'

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute -inset-8 rounded-[2rem] blur-3xl ${className}`}
      style={{ background: bg }}
      animate={{ opacity: [0.28, 0.62, 0.28], scale: [0.96, 1.04, 0.96] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
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
  const blurStyle: CSSProperties = { WebkitBackdropFilter: 'blur(28px)' }
  return (
    <div className={`relative h-full min-h-0 overflow-hidden rounded-3xl ${className}`}>
      <PulsingGlow accent={accent} />
      <div
        className="relative flex h-full min-h-0 flex-col rounded-3xl border border-white/15 bg-black/55 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-8"
        style={blurStyle}
      >
        {children}
      </div>
    </div>
  )
}

function SimPreviewLine() {
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
    <div className="rounded-2xl border border-[#00FF88]/30 bg-black/40 p-4 shadow-[0_0_40px_rgba(0,255,136,0.2)] backdrop-blur-md">
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
const featureCardHeadline = `${head} text-2xl font-black leading-tight tracking-tight text-white`

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
    <div className="relative min-h-dvh overflow-x-hidden text-neutral-100">
      <MeshBackdrop />

      {/* Top nav */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/55 px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-lg sm:px-4 sm:pb-3 sm:pt-3">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 sm:gap-x-4 sm:gap-y-2">
          <div className="flex min-w-0 items-center justify-start">
            <nav
              className="hidden items-center gap-5 text-sm font-semibold text-white/90 lg:gap-6 md:flex"
              aria-label="Primary"
            >
              <button type="button" onClick={go('mission')} className="transition hover:text-[#00FF88]">
                Our Mission
              </button>
              <button type="button" onClick={go('how')} className="transition hover:text-[#00FF88]">
                How it Works
              </button>
              <button type="button" onClick={go('features')} className="transition hover:text-[#00FF88]">
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
              className={`${head} inline-flex shrink-0 items-center justify-center rounded-xl border border-[#00FF88]/50 bg-[#00FF88]/15 px-2.5 py-2 text-[10px] font-black tracking-wide text-[#00FF88] shadow-[0_0_24px_rgba(0,255,136,0.25)] transition hover:bg-[#00FF88]/25 min-[400px]:px-3 min-[400px]:text-xs sm:px-5 sm:py-2.5 sm:text-sm`}
            >
              <span className="hidden min-[400px]:inline">Login / Sign Up</span>
              <span className="min-[400px]:hidden">Sign up</span>
            </a>
          </div>
        </div>
        <nav
          className="mx-auto mt-2 flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-1.5 px-1 text-[11px] font-semibold text-white/85 sm:mt-3 sm:gap-x-5 sm:text-xs md:hidden"
          aria-label="Primary mobile"
        >
          <button type="button" onClick={go('mission')} className="hover:text-[#00FF88]">
            Mission
          </button>
          <button type="button" onClick={go('how')} className="hover:text-[#00FF88]">
            How it Works
          </button>
          <button type="button" onClick={go('features')} className="hover:text-[#00FF88]">
            Features
          </button>
        </nav>
      </header>

      <main className="relative z-10 scroll-smooth pt-[6.75rem] sm:pt-[6.5rem] md:pt-20">
        {/* Hero */}
        <section
          id="top"
          className="relative flex min-h-[min(100dvh,920px)] flex-col items-center justify-center overflow-x-hidden px-4 pb-12 pt-4 text-center sm:min-h-screen sm:px-5 sm:pt-6 md:px-8"
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
              className={`${head} relative z-10 mx-auto mt-6 max-w-full whitespace-nowrap px-3 text-center text-[clamp(1rem,calc((100dvw-2.5rem)/11.2),7rem)] font-black leading-[0.95] tracking-tighter text-white sm:mt-8 sm:px-6 sm:leading-[0.92]`}
              style={{
                textShadow:
                  '0 0 48px rgba(0,255,136,0.4), 0 0 100px rgba(0,255,136,0.2), 0 2px 0 rgba(0,0,0,0.5)',
              }}
            >
              Grow your money.
            </h1>
            <p className="relative z-10 mx-auto mt-6 max-w-2xl px-1 text-base leading-relaxed text-neutral-100 sm:mt-8 sm:px-0 sm:text-[1.125rem] md:text-[1.15rem]">
              Learn the money game. Trade fake cash. Flex on your friends. No gatekeeping—just real skills for the real
              world.
            </p>
            <motion.a
              href="/signup"
              onClick={(e) => {
                e.preventDefault()
                onGoToSignUp()
              }}
              className={`${head} relative z-30 mx-auto mt-8 flex w-full max-w-[min(100%,20rem)] cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[#00FF88] px-8 py-4 text-base font-black tracking-wide text-black shadow-[0_0_56px_rgba(0,255,136,0.55),inset_0_1px_0_0_rgba(255,255,255,0.45)] ring-2 ring-[#00FF88]/80 transition-transform hover:scale-[1.03] active:scale-[0.99] sm:mt-10 sm:inline-flex sm:w-auto sm:max-w-none sm:px-12 sm:py-5 sm:text-lg md:px-16 md:text-xl pointer-events-auto`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              START GRINDING
              <ArrowRight className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.5} aria-hidden />
            </motion.a>
            <p className="relative z-10 mt-8 text-sm text-neutral-400">Simulator. Not financial advice.</p>
          </motion.div>
        </section>

        {/* Our Mission — overlaps hero */}
        <section id="mission" className="relative z-20 -mt-10 scroll-mt-28 px-4 pb-10 md:-mt-16 md:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-5xl">
            <GlowCard accent="blue" className="border border-white/10 shadow-2xl shadow-blue-500/5">
              <p className={`${head} mb-4 text-sm font-black tracking-widest text-sky-300`}>Our Mission</p>
              <h2 className={`${sectionTitle} max-w-4xl text-balance`}>OUR MISSION: FINANCIAL FREEDOM FOR ALL.</h2>
              <p className={`${body} mt-8 max-w-3xl text-pretty text-neutral-100`}>
                Tintomi exists to bridge the gap between what school teaches and what life actually demands. We give
                teens the tools, language, and reps to own their future—budgeting, markets, inflation, and confidence—
                before adulthood hits the gas.
              </p>
              <p className={`${body} mt-5 max-w-3xl text-pretty text-neutral-200`}>
                Your first paycheck should not be your first lesson in money. Start here, grind in the sim, and walk into
                the real world already fluent in how wealth is built (and protected).
              </p>
            </GlowCard>
          </motion.div>
        </section>

        {/* How it Works */}
        <section id="how" className="relative z-10 -mt-6 scroll-mt-28 px-4 py-10 md:-mt-8 md:px-8 md:py-12">
          <motion.div {...fadeUp} className="mx-auto max-w-6xl">
            <h2 className={`${sectionTitle} mb-2 text-center`}>HOW IT WORKS</h2>
            <p className={`${body} mx-auto mb-10 max-w-2xl text-center text-neutral-200`}>Three beats. One upgrade path.</p>
            <div className="grid gap-5 md:grid-cols-3 md:items-stretch md:gap-4">
              {[
                {
                  step: '01',
                  title: 'LEARN',
                  icon: BookOpen,
                  copy: 'Quick, punchy lessons on inflation, markets, and money habits—built for short attention spans and long-term wins.',
                  accent: 'blue' as const,
                },
                {
                  step: '02',
                  title: 'PRACTICE',
                  icon: TrendingUp,
                  copy: 'Trade with fake cash on a watchlist that moves in real time. See the neon line, feel the volatility, zero real risk.',
                  accent: 'green' as const,
                },
                {
                  step: '03',
                  title: 'COMPETE',
                  icon: Users,
                  copy: 'See how you stack up against the squad. XP, levels, and bragging rights for who actually gets it.',
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
                        <span className={`${head} text-4xl font-black text-white/20 sm:text-5xl`}>{item.step}</span>
                        <item.icon className="h-10 w-10 shrink-0 text-white/90" strokeWidth={1.75} aria-hidden />
                      </div>
                      <h3 className={`${head} text-2xl font-black tracking-tight text-white sm:text-3xl`}>{item.title}</h3>
                      <p className={`${body} min-h-0 flex-1 text-neutral-100`}>{item.copy}</p>
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
            <h2 className={`${sectionTitle} mb-2 text-center`}>FEATURES</h2>
            <p className={`${body} mx-auto mb-10 max-w-2xl text-center text-neutral-200`}>High-energy tools. Zero fluff.</p>
            <div className="grid items-stretch gap-5 lg:grid-cols-3">
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="relative h-full min-h-0">
                <GlowCard accent="green" className="h-full">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Zap className={`${featureIconClass} text-[#00FF88]`} strokeWidth={featureIconStroke} aria-hidden />
                      <h3 className={featureCardHeadline}>THE SIM</h3>
                    </div>
                    <p className={`${body} min-h-0 flex-1 text-pretty text-neutral-100`}>
                      Real-time stock tracking with that neon line. Tap, zoom, buy and sell fake shares—feel the market
                      without funding it.
                    </p>
                    <div className="shrink-0">
                      <SimPreviewLine />
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="relative h-full min-h-0">
                <GlowCard accent="blue" className="h-full">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Flame className={`${featureIconClass} text-sky-300`} strokeWidth={featureIconStroke} aria-hidden />
                      <h3 className={featureCardHeadline}>BRAIN GAINS</h3>
                    </div>
                    <p className={`${body} min-h-0 flex-1 text-pretty text-neutral-100`}>
                      Learning modules with XP and levels. Inflation, investing, budgeting—short lessons, instant feedback,
                      unlock the next track.
                    </p>
                  </div>
                </GlowCard>
              </motion.div>
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.18 }} className="relative h-full min-h-0">
                <GlowCard accent="violet" className="h-full">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Users className={`${featureIconClass} text-violet-300`} strokeWidth={featureIconStroke} aria-hidden />
                      <h3 className={featureCardHeadline}>THE SQUAD</h3>
                    </div>
                    <p className={`${body} min-h-0 flex-1 text-pretty text-neutral-100`}>
                      Community leaderboards and a social feed built for hype. Flex progress, compare XP, and push your
                      crew to level up together.
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
            <div className="relative rounded-3xl border-2 border-[#00FF88] bg-black/80 p-8 shadow-[0_0_60px_rgba(0,255,136,0.15),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-12">
              <h2 className={`${sectionTitle} text-[clamp(2.25rem,5vw,3.5rem)]`}>WHY TINTOMI?</h2>
              <ul className={`${body} mt-8 space-y-5 text-neutral-100`}>
                <li className="flex gap-4">
                  <span className="mt-1 font-mono text-[#00FF88]">01</span>
                  <span>
                    <strong className="text-white">No risk.</strong> Simulated cash and delayed market data—you learn the
                    mechanics before your first real trade.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mt-1 font-mono text-sky-300">02</span>
                  <span>
                    <strong className="text-white">Real-world skills.</strong> Inflation, portfolios, and decision-making
                    framed the way Gen Z actually consumes content.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mt-1 font-mono text-violet-300">03</span>
                  <span>
                    <strong className="text-white">A community of grinders.</strong> Compete, compare, and grow with people
                    who treat financial literacy like a sport—not a chore.
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
            <p className={`${head} text-[clamp(2rem,4vw,3rem)] font-black text-white`}>READY TO RUN IT UP?</p>
            <p className={`${body} mx-auto mt-4 max-w-xl text-neutral-200`}>Jump in. The sim is live. Your squad is waiting.</p>
            <motion.a
              href="/signup"
              onClick={(e) => {
                e.preventDefault()
                onGoToSignUp()
              }}
              className={`${head} mx-auto mt-8 flex w-full max-w-[min(100%,18rem)] touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[#00FF88] px-8 py-3.5 text-sm font-black text-black shadow-[0_0_48px_rgba(0,255,136,0.45)] sm:inline-flex sm:w-auto sm:max-w-none sm:px-10 sm:py-4 sm:text-base md:text-lg`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              START GRINDING
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </motion.a>
          </motion.div>
        </section>
      </main>

      <motion.button
        type="button"
        onClick={() => scrollToId('mission')}
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full p-3 text-[#00FF88] outline-none transition hover:scale-105 hover:text-white focus-visible:ring-2 focus-visible:ring-[#00FF88]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] sm:bottom-12 md:bottom-16"
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
          <ChevronDown
            size={32}
            strokeWidth={1.35}
            className="shrink-0"
            style={{
              filter:
                'drop-shadow(0 0 12px rgba(0,255,136,0.95)) drop-shadow(0 0 28px rgba(0,255,136,0.55)) drop-shadow(0 2px 6px rgba(255,255,255,0.45))',
            }}
          />
        </motion.span>
      </motion.button>
    </div>
  )
}
