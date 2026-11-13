// Session-only memory of where the user was in each bottom-nav tab: last route,
// scroll position per route and a little view state. Lives in module memory,
// so it survives tab switches but not an app restart (intentionally).

export const TAB_ROOTS = ['/verlauf', '/uebungen', '/statistik', '/einstellungen'] as const
export type TabRoot = (typeof TAB_ROOTS)[number]

const lastPath = new Map<TabRoot, string>()
const scrollByKey = new Map<string, number>()

/** View state that lives inside pages and should survive a tab switch. */
export const sessionState: {
  calendar: { year: number; month: number; selected: string | null } | null
  statsTab: 'exercise' | 'body'
} = { calendar: null, statsTab: 'exercise' }

/** The tab a path belongs to, e.g. "/statistik/uebung/x" → "/statistik". */
export function tabOf(pathname: string): TabRoot | null {
  return TAB_ROOTS.find((root) => pathname === root || pathname.startsWith(`${root}/`)) ?? null
}

/** Records a visited location (pathname + search) as the last route of its tab. */
export function rememberPath(pathname: string, search = ''): void {
  const tab = tabOf(pathname)
  if (tab) lastPath.set(tab, pathname + search)
}

/**
 * Where a tap on a nav tab should go: the tab's overview if it is the current
 * tab (reset), otherwise the route last seen in that tab.
 */
export function navTarget(root: TabRoot, currentPathname: string): string {
  if (tabOf(currentPathname) === root) return root
  return lastPath.get(root) ?? root
}

export function saveScroll(key: string, y: number): void {
  scrollByKey.set(key, y)
}

export function savedScroll(key: string): number {
  return scrollByKey.get(key) ?? 0
}

/** For tests. */
export function _resetTabMemory(): void {
  lastPath.clear()
  scrollByKey.clear()
  sessionState.calendar = null
  sessionState.statsTab = 'exercise'
}
