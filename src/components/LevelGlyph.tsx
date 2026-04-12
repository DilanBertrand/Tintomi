type LevelGlyphProps = {
  levelId: string
  className?: string
}

export function LevelGlyph({ levelId, className = 'h-14 w-14 shrink-0' }: LevelGlyphProps) {
  const stroke = 'currentColor'
  const fill = 'currentColor'

  switch (levelId) {
    case 'money-basics':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
          <path
            d="M32 8 L52 20 L52 44 L32 56 L12 44 L12 20 Z"
            stroke={stroke}
            strokeWidth={1.2}
            opacity={0.9}
          />
          <path d="M32 8 L32 56 M12 20 L52 44 M52 20 L12 44" stroke={stroke} strokeWidth={0.6} opacity={0.35} />
          <path d="M32 18 L44 26 L44 38 L32 46 L20 38 L20 26 Z" fill={fill} opacity={0.12} />
        </svg>
      )
    case 'saving':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
          <rect x="14" y="36" width="10" height="18" rx="1" stroke={stroke} strokeWidth={1} opacity={0.85} />
          <rect x="27" y="28" width="10" height="26" rx="1" stroke={stroke} strokeWidth={1} opacity={0.85} />
          <rect x="40" y="18" width="10" height="36" rx="1" stroke={stroke} strokeWidth={1} opacity={0.85} />
          <path d="M18 32 L22 28 L26 32" stroke={stroke} strokeWidth={0.8} opacity={0.4} />
        </svg>
      )
    case 'investing':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
          <path d="M12 48 L28 22 L38 32 L52 14" stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />
          <path d="M12 48 L52 48" stroke={stroke} strokeWidth={0.5} opacity={0.25} />
          <polygon points="44,10 52,18 44,18" fill={fill} opacity={0.35} />
        </svg>
      )
    case 'business':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
          <path d="M32 10 L54 22 L54 42 L32 54 L10 42 L10 22 Z" stroke={stroke} strokeWidth={1} opacity={0.5} />
          <path d="M32 18 L46 26 L46 38 L32 46 L18 38 L18 26 Z" fill={fill} opacity={0.15} />
          <circle cx="32" cy="32" r="6" stroke={stroke} strokeWidth={1} />
        </svg>
      )
    case 'economy':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
          <circle cx="32" cy="32" r="22" stroke={stroke} strokeWidth={1} opacity={0.35} />
          <circle cx="32" cy="32" r="14" stroke={stroke} strokeWidth={0.8} opacity={0.5} strokeDasharray="4 3" />
          <ellipse cx="32" cy="32" rx="22" ry="10" stroke={stroke} strokeWidth={0.7} opacity={0.4} />
          <circle cx="32" cy="32" r="3" fill={fill} opacity={0.5} />
        </svg>
      )
    default:
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
          <rect x="16" y="16" width="32" height="32" rx="4" stroke={stroke} strokeWidth={1.2} />
        </svg>
      )
  }
}
