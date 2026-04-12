import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeSlideUp } from '../motion/variants'

const accentBorder: Record<string, string> = {
  neon: 'border-[#00FF88]/45 shadow-[0_0_50px_rgba(0,255,136,0.14)]',
  amber: 'border-[#fb923c]/45 shadow-[0_0_50px_rgba(251,146,60,0.14)]',
  violet: 'border-[#a78bfa]/45 shadow-[0_0_50px_rgba(167,139,250,0.14)]',
  sky: 'border-[#38bdf8]/45 shadow-[0_0_50px_rgba(56,189,248,0.14)]',
  gold: 'border-[#eab308]/40 shadow-[0_0_50px_rgba(234,179,8,0.12)]',
  neutral: 'border-white/12 shadow-[0_0_40px_rgba(255,255,255,0.06)]',
}

type CardAccent = keyof typeof accentBorder

type CardProps = {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  featured?: boolean
  glowRgb?: string
  /** 1px neon rim + glow-morphism halo */
  accent?: CardAccent
}

function haloStyle(glowRgb: string) {
  return {
    boxShadow: `0 0 60px rgba(${glowRgb}, 0.14), 0 24px 80px rgba(0,0,0,0.55)`,
  } as const
}

export function Card({
  children,
  className = '',
  title,
  subtitle,
  featured = false,
  glowRgb = '0, 255, 136',
  accent = 'neutral',
}: CardProps) {
  const rim = accentBorder[accent] ?? accentBorder.neutral
  const feat = featured ? 'ring-1 ring-[#00FF88]/40' : ''

  return (
    <motion.div
      variants={fadeSlideUp}
      className={`group relative rounded-2xl p-[1px] transition-all duration-300 ease-out hover:scale-[1.02] ${rim} ${feat} ${className}`}
      style={haloStyle(glowRgb)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md">
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(${glowRgb}, 0.2), transparent 65%)`,
          }}
          aria-hidden
        />
        <div className="relative">
          {title ? (
            <div className="mb-3">
              <h3 className="tm-premium-title text-xs font-bold uppercase tracking-tighter sm:text-sm">{title}</h3>
              {subtitle ? (
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-tighter text-[#7cb8ff] sm:text-xs">
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </motion.div>
  )
}
