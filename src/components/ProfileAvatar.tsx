import { useState } from 'react'

type ProfileAvatarProps = {
  avatarUrl: string | null | undefined
  initial: string
}

export function ProfileAvatar({ avatarUrl, initial }: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false)

  if (avatarUrl && !broken) {
    return (
      <img
        src={avatarUrl}
        alt="Tintomi profile"
        className="h-16 w-16 shrink-0 rounded-xl border border-white/15 object-cover shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-x border-b border-white/10 border-t border-t-white/25 bg-white/5 text-xl font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-md">
      {initial}
    </div>
  )
}
