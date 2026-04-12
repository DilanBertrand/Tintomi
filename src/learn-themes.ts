/** Per-track accent for Learn levels (gaming terminal HUD) */
export type LevelTheme = {
  accent: string
  accentSoft: string
  glow: string
}

export const LEVEL_THEMES: Record<string, LevelTheme> = {
  'money-basics': {
    accent: '#38BDF8',
    accentSoft: 'rgba(56, 189, 248, 0.14)',
    glow: '0 0 28px rgba(56, 189, 248, 0.22)',
  },
  saving: {
    accent: '#EAB308',
    accentSoft: 'rgba(234, 179, 8, 0.14)',
    glow: '0 0 28px rgba(234, 179, 8, 0.2)',
  },
  investing: {
    accent: '#00FF88',
    accentSoft: 'rgba(0, 255, 136, 0.14)',
    glow: '0 0 28px rgba(0, 255, 136, 0.22)',
  },
  business: {
    accent: '#2DD4BF',
    accentSoft: 'rgba(45, 212, 191, 0.14)',
    glow: '0 0 28px rgba(45, 212, 191, 0.2)',
  },
  economy: {
    accent: '#FB923C',
    accentSoft: 'rgba(251, 146, 60, 0.14)',
    glow: '0 0 28px rgba(251, 146, 60, 0.2)',
  },
}

export function themeForLevel(id: string): LevelTheme {
  return (
    LEVEL_THEMES[id] ?? {
      accent: '#00FF88',
      accentSoft: 'rgba(0, 255, 136, 0.12)',
      glow: '0 0 20px rgba(0, 255, 136, 0.15)',
    }
  )
}
