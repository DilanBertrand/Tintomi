import { AnimatePresence, motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchNotifications,
  markAllNotificationsRead,
  type Notification,
} from '../lib/notifications'

const POLL_MS = 60_000

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

/**
 * Header bell: polls the user's notifications, shows an unread dot, and marks
 * everything read when the panel is opened.
 */
export function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    setItems(await fetchNotifications())
  }, [])

  useEffect(() => {
    void (async () => {
      await refresh()
    })()
    const iv = window.setInterval(() => void refresh(), POLL_MS)
    return () => window.clearInterval(iv)
  }, [refresh, userId])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  const unread = items.filter((n) => !n.read).length

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  return (
    <div ref={panelRef} className="absolute right-0 top-1/2 -translate-y-1/2">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#232b25] bg-transparent text-[#a7b0a8] transition-colors hover:bg-[#1a221c] hover:text-[#e9ece8]"
      >
        <Bell className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2979ff] px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 z-[120] w-72 overflow-hidden rounded-xl border border-[#232b25] bg-[#121a15] shadow-xl shadow-black/50"
          >
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[#5c665e]">No notifications yet.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id} className="border-b border-[#232b25] px-4 py-3 last:border-b-0">
                    <p className="text-sm leading-snug text-[#e9ece8]">{n.message}</p>
                    <p className="mt-1 text-xs text-[#5c665e]">{timeAgo(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
