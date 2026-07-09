/** Per-track accent for Learn levels (flat, restrained) */
export type LevelTheme = {
  accent: string
  accentSoft: string
  glow: string
}

const FLAT_THEME: LevelTheme = {
  accent: '#2979ff',
  accentSoft: 'rgba(41, 121, 255, 0.14)',
  glow: 'none',
}

export const LEVEL_THEMES: Record<string, LevelTheme> = {
  'money-basics': FLAT_THEME,
  saving: FLAT_THEME,
  investing: FLAT_THEME,
  business: FLAT_THEME,
  economy: FLAT_THEME,
}

export function themeForLevel(id: string): LevelTheme {
  return LEVEL_THEMES[id] ?? FLAT_THEME
}
