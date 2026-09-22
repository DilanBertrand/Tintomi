import type { TabId } from '../components/Navbar'

const DASHBOARD_SEGMENTS: Record<string, TabId> = {
  home: 'home',
  learn: 'learn',
  invest: 'invest',
  community: 'community',
  profile: 'profile',
}

/** Policy pages. Reachable by URL whether or not anyone is signed in. */
export const LEGAL_PAGES = {
  privacy: 'Privacy Policy',
  terms: 'Terms and Conditions',
  cookies: 'Cookie Policy',
} as const

export type LegalSlug = keyof typeof LEGAL_PAGES

function firstSegment(pathname: string): string | undefined {
  return pathname.replace(/\/+$/, '').split('/').filter(Boolean)[0]?.toLowerCase()
}

/** Legal slug for a path, or null when the path is not a policy page. */
export function pathToLegalSlug(pathname: string): LegalSlug | null {
  const seg = firstSegment(pathname)
  return seg && seg in LEGAL_PAGES ? (seg as LegalSlug) : null
}

/** First path segment -> tab; unknown or empty -> home */
export function pathToTab(pathname: string): TabId {
  const seg = firstSegment(pathname)
  if (seg && DASHBOARD_SEGMENTS[seg]) return DASHBOARD_SEGMENTS[seg]
  return 'home'
}

export function tabToPath(tab: TabId): string {
  return `/${tab}`
}
