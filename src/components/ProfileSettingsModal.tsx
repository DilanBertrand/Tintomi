import { motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateProfileFields } from '../lib/profiles'

type ProfileSettingsModalProps = {
  initialFullName: string
  initialUsername: string
  onClose: () => void
}

export function ProfileSettingsModal({ initialFullName, initialUsername, onClose }: ProfileSettingsModalProps) {
  const { user, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(initialFullName)
  const [username, setUsername] = useState(initialUsername)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const sessionUser = user

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const uid = sessionUser.id
    const nameTrim = fullName.trim() || null
    const userTrim = username.trim() || null

    const { error: upErr } = await updateProfileFields(uid, {
      full_name: nameTrim,
      username: userTrim,
    })
    if (upErr) {
      setSaving(false)
      const msg = String(upErr).toLowerCase()
      if (msg.includes('duplicate') || String(upErr).includes('23505')) {
        setError('That username is already taken. Try another.')
      } else {
        setError(upErr)
      }
      return
    }

    await refreshProfile()
    setSaving(false)
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !saving && onClose()} aria-label="Close settings" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0a0f1a] p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="profile-settings-title" className="text-lg font-semibold text-white">
              Edit profile
            </h2>
            <p className="mt-1 text-sm text-gray-500">Display name is saved to your profile.</p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="settings-full-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Display name
            </label>
            <input
              id="settings-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#00FF88]/50 focus:ring-2 focus:ring-[#00FF88]/25"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="settings-username" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Username <span className="font-normal normal-case text-gray-600">(optional)</span>
            </label>
            <input
              id="settings-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#00FF88]/50 focus:ring-2 focus:ring-[#00FF88]/25"
              placeholder="unique_handle"
              autoComplete="username"
            />
          </div>

          {error ? (
            <p className="text-center text-sm font-medium text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => !saving && onClose()}
              className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00FF88] py-3 text-sm font-bold text-black transition hover:brightness-105 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
