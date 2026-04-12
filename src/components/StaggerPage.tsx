import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { staggerContainer } from '../motion/variants'

type StaggerPageProps = {
  children: ReactNode
  className?: string
}

export function StaggerPage({ children, className = '' }: StaggerPageProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}
