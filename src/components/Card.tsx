import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeSlideUp } from '../motion/variants'

const accentBorder: Record<string, string> = {
  neon: 'border-[#232b25]',
  amber: 'border-[#232b25]',
  violet: 'border-[#232b25]',
  sky: 'border-[#232b25]',
  gold: 'border-[#232b25]',
  neutral: 'border-[#232b25]',
}

type CardAccent = keyof typeof accentBorder

type CardProps = {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  featured?: boolean
  glowRgb?: string
  accent?: CardAccent
}

export function Card({
  children,
  className = '',
  title,
  subtitle,
  featured = false,
  glowRgb = '41, 121, 255',
  accent = 'neutral',
}: CardProps) {
  void glowRgb
  const rim = accentBorder[accent] ?? accentBorder.neutral
  const feat = featured ? 'border-[#39423b]' : ''

  return (
    <motion.div
      variants={fadeSlideUp}
      className={`group relative rounded-2xl border transition-all duration-300 ease-out hover:scale-[1.02] ${rim} ${feat} ${className}`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#121a15] p-4">
        <div className="relative">
          {title ? (
            <div className="mb-3">
              <h3 className="tm-premium-title text-xs sm:text-sm">{title}</h3>
              {subtitle ? (
                <p className="mt-1 text-[11px] font-semibold text-[#a7b0a8] sm:text-xs">
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
