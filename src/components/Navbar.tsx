import { BarChart3, FolderOpen, Home, User, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export type TabId = 'home' | 'learn' | 'invest' | 'community' | 'profile'

type NavItem = {
  id: TabId
  label: string
  Icon: typeof Home
}

const items: NavItem[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'learn', label: 'Learn', Icon: FolderOpen },
  { id: 'invest', label: 'Invest', Icon: BarChart3 },
  { id: 'community', label: 'Community', Icon: Users },
  { id: 'profile', label: 'Profile', Icon: User },
]

type NavbarProps = {
  active: TabId
  onChange: (tab: TabId) => void
  /** When set, the Profile tab shows this label instead of "Profile". */
  profileTabLabel?: string
}

export function Navbar({ active, onChange, profileTabLabel }: NavbarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] isolate border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_48px_rgba(0,0,0,0.75)] backdrop-blur-xl">
      <div className="relative mx-auto flex w-full max-w-4xl items-stretch justify-between gap-1 px-2 py-2 sm:px-6 sm:py-3 lg:px-10">
        {items.map((item) => {
          const isActive = active === item.id
          const { Icon } = item
          const tabLabel = item.id === 'profile' && profileTabLabel ? profileTabLabel : item.label
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              whileTap={{ scale: 0.97 }}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-full px-2 py-2 transition-colors duration-200 sm:px-3 ${
                isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
              }`}
            >
              {isActive ? (
                <>
                  <span
                    className="pointer-events-none absolute -bottom-2 left-1/2 h-14 w-32 -translate-x-1/2 rounded-full bg-[#00FF88]/50 blur-3xl"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute -bottom-1 left-1/2 h-8 w-20 -translate-x-1/2 rounded-full bg-[#00FF88]/70 blur-xl"
                    aria-hidden
                  />
                </>
              ) : null}
              <span className="relative flex h-9 w-9 items-center justify-center">
                <Icon
                  className={`relative z-10 h-[22px] w-[22px] sm:h-6 sm:w-6 ${
                    isActive
                      ? 'text-[#00FF88] [filter:drop-shadow(0_0_14px_rgba(0,255,136,1))_drop-shadow(0_0_28px_rgba(0,255,136,1))_drop-shadow(0_0_56px_rgba(0,255,136,0.85))_drop-shadow(0_0_80px_rgba(0,255,136,0.5))]'
                      : 'text-neutral-500'
                  }`}
                  strokeWidth={isActive ? 2.35 : 2}
                  aria-hidden
                />
              </span>
              <span
                className={`relative z-10 max-w-full truncate text-[10px] font-bold uppercase tracking-tighter sm:text-[11px] ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4a574] via-[#f5e6c8] to-[#e8edf2] bg-clip-text text-transparent'
                    : 'text-neutral-400'
                }`}
              >
                {tabLabel}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
