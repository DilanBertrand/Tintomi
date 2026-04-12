import type { TabId } from '../components/Navbar'

const DASHBOARD_SEGMENTS: Record<string, TabId> = {
  home: 'home',
  learn: 'learn',
  invest: 'invest',
  community: 'community',
  profile: 'profile',
}

/** First path segment -> tab; unknown or empty -> home */
export function pathToTab(pathname: string): TabId {
  const seg = pathname.replace(/\/+$/, '').split('/').filter(Boolean)[0]?.toLowerCase()
  if (seg && DASHBOARD_SEGMENTS[seg]) return DASHBOARD_SEGMENTS[seg]
  return 'home'
}

export function tabToPath(tab: TabId): string {
  return `/${tab}`
}
