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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] isolate border-t border-[#232b25] bg-[#0f1412] pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto flex w-full max-w-4xl items-stretch justify-between gap-0.5 px-1.5 py-2 sm:gap-1 sm:px-6 sm:py-3 lg:px-10">
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
              className={`relative flex min-h-[3.25rem] min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 transition-colors duration-200 sm:min-h-0 sm:gap-1 sm:px-3 sm:py-2 ${
                isActive ? 'bg-[#1a221c]' : 'hover:bg-[#161d18]'
              }`}
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
                <Icon
                  className={`relative z-10 h-[20px] w-[20px] sm:h-[22px] sm:w-[22px] md:h-6 md:w-6 ${
                    isActive ? 'text-[#2979ff]' : 'text-[#6b756c]'
                  }`}
                  strokeWidth={isActive ? 2.35 : 2}
                  aria-hidden
                />
              </span>
              <span
                className={`relative z-10 w-full max-w-[min(100%,4.5rem)] truncate text-center text-[9px] font-bold uppercase leading-tight tracking-tighter min-[400px]:max-w-[5.25rem] min-[400px]:text-[10px] sm:max-w-[6rem] sm:text-[11px] md:max-w-full ${
                  isActive ? 'text-[#e9ece8]' : 'text-[#a7b0a8]'
                }`}
              >
                {/* Dynamic profile label truncates on narrow screens; keep it static there */}
                <span className="md:hidden">{item.label}</span>
                <span className="hidden md:inline">{tabLabel}</span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
