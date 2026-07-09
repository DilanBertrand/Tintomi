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
        className="h-16 w-16 shrink-0 rounded-xl border border-[#232b25] object-cover"
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-x border-b border-[#232b25] border-t border-t-white/25 bg-transparent text-xl font-semibold text-[#e9ece8]">
      {initial}
    </div>
  )
}
