import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { Card } from '../components/Card'
import { ProfileSettingsModal } from '../components/ProfileSettingsModal'
import { ProgressBar } from '../components/ProgressBar'
import { StaggerPage } from '../components/StaggerPage'
import { getDisplayName } from '../lib/displayName'
import { streakForDisplay } from '../lib/profiles'

type ProfileProps = {
  xp: number
  portfolioValue: number
}

function badgesForXp(xp: number) {
  const badges: { label: string; emoji: string; unlocked: boolean }[] = [
    { label: 'Starter', emoji: '\u{1F331}', unlocked: xp >= 0 },
    { label: 'Saver mode', emoji: '\u{1F4B8}', unlocked: xp >= 100 },
    { label: 'Investor brain', emoji: '\u{1F9E0}', unlocked: xp >= 300 },
    { label: 'Macro main character', emoji: '\u{1F30D}', unlocked: xp >= 500 },
    { label: 'Tintomi OG', emoji: '\u{2B50}', unlocked: xp >= 800 },
  ]
  return badges
}

function avatarInitial(name: string): string {
  const c = name.trim().charAt(0)
  return c ? c.toUpperCase() : '?'
}

export function Profile({ xp, portfolioValue }: ProfileProps) {
  const { user, profile, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsKey, setSettingsKey] = useState(0)
  const level = Math.max(1, Math.floor(xp / 100) + 1)
  const xpInto = xp % 100

  const displayName = getDisplayName(profile, user)
  const streak = streakForDisplay(profile, user)
  const avatarUrl = profile?.avatar_url

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
  }

  return (
    <div className="pb-28">
      <motion.header
        className="px-1"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">OPERATOR</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Profile</h1>
        <p className="mt-1 max-w-md text-sm text-gray-500">Account overview and progress.</p>
      </motion.header>

      <StaggerPage className="mt-8 space-y-6">
        <Card>
          <div className="flex items-center gap-4">
            <ProfileAvatar key={avatarUrl ?? 'none'} avatarUrl={avatarUrl} initial={avatarInitial(displayName)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-semibold text-white">{displayName}</p>
              <p className="truncate text-sm text-gray-500">{user?.email ?? 'Signed in'}</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Level {level} | {xp} XP total
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={xpInto} max={100} label="XP / 100 in this level" />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setSettingsKey((k) => k + 1)
                setSettingsOpen(true)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Settings className="h-4 w-4" aria-hidden />
              Edit profile
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {signingOut ? 'Signing out…' : 'Log out'}
            </button>
          </div>
        </Card>

        <Card title="PORTFOLIO" subtitle="Sim | cash + holdings">
          <p className="font-mono text-3xl font-semibold text-[#00FF88]">${portfolioValue.toFixed(2)}</p>
          <p className="mt-2 text-sm text-gray-500">Simulator only. Not financial advice.</p>
        </Card>

        <Card title="STREAK" subtitle="Consecutive days active">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-4xl font-semibold text-white">{streak}</p>
              <p className="text-sm text-gray-500">days logged</p>
            </div>
            <span className="rounded-full bg-[#00FF88]/10 px-3 py-1 text-xs font-semibold text-[#00FF88]">
              {streak > 0 ? 'Active' : 'Start today'}
            </span>
          </div>
        </Card>

        <Card title="BADGES" subtitle="Unlock with XP">
          <div className="grid grid-cols-2 gap-2">
            {badgesForXp(xp).map((b) => (
              <div
                key={b.label}
                className={`rounded-xl border-x border-b border-white/10 border-t border-t-white/20 bg-white/5 px-3 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-colors duration-300 hover:bg-white/[0.07] ${
                  b.unlocked ? 'border-[#00FF88]/25' : 'opacity-45'
                }`}
              >
                <p className="text-xl">{b.emoji}</p>
                <p className="mt-1 text-sm font-semibold text-white">{b.label}</p>
                <p className="text-[11px] text-gray-500">{b.unlocked ? 'Unlocked' : 'Locked'}</p>
              </div>
            ))}
          </div>
        </Card>
      </StaggerPage>

      <AnimatePresence>
        {settingsOpen ? (
          <ProfileSettingsModal
            key={settingsKey}
            initialFullName={profile?.full_name ?? ''}
            initialUsername={profile?.username ?? ''}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
