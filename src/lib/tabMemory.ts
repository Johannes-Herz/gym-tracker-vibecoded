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

// --- Going "up" within a tab -------------------------------------------------

/** Explicit parent routes: every page with a back arrow and its logical parent. */
const PARENT_ROUTES: { pattern: RegExp; parent: string }[] = [
  { pattern: /^\/verlauf\/neu$/, parent: '/verlauf' },
  { pattern: /^\/verlauf\/[^/]+$/, parent: '/verlauf' },
  { pattern: /^\/statistik\/uebung\/[^/]+$/, parent: '/statistik' },
]

/** Logical parent page of a route; null for tab overviews (and unknown routes). */
export function parentOf(pathname: string): string | null {
  return PARENT_ROUTES.find((r) => r.pattern.test(pathname))?.parent ?? null
}

/** History entry key → pathname of the entry directly below it (when known). */
const belowByEntry = new Map<string, string>()

/**
 * Tracks what lies below each history entry. `below` (from location state) wins;
 * a push otherwise sits on the previously shown page; a replace keeps what was
 * below the replaced entry; a pop changes nothing.
 */
export function recordNavigation(
  type: 'PUSH' | 'REPLACE' | 'POP',
  key: string,
  prev: { key: string; pathname: string } | null,
  below?: string,
): void {
  if (below !== undefined) belowByEntry.set(key, below)
  else if (type === 'PUSH' && prev) belowByEntry.set(key, prev.pathname)
  else if (type === 'REPLACE' && prev && belowByEntry.has(prev.key)) belowByEntry.set(key, belowByEntry.get(prev.key)!)
}

/** `transient` back steps are only a way station (tab switch) and don't count as visiting that page. */
export type NavStep = { back: true; transient?: boolean } | { to: string; replace?: boolean; below?: string }

/**
 * Going up one level from the current entry: step back if the entry below is the
 * parent (keeps history shallow), otherwise replace the page with its parent.
 */
export function upSteps(key: string, pathname: string): NavStep[] {
  const parent = parentOf(pathname)
  if (!parent) return []
  return belowByEntry.get(key) === parent ? [{ back: true }] : [{ to: parent, replace: true }]
}

/**
 * Steps for tapping a bottom-nav tab. Active tab: go up to its overview (none if
 * already there). Other tab: if a detail page is open on top of its overview,
 * step back to that overview first; then replace it with the new tab's overview
 * and, if a detail page was open there, push it on top. History thus stays at
 * most "overview + one detail" deep, and the phone back button always goes up.
 */
export function tabSteps(root: TabRoot, key: string, pathname: string): NavStep[] {
  if (tabOf(pathname) === root) return pathname === root ? [] : upSteps(key, pathname)
  const target = navTarget(root, pathname)
  const parent = parentOf(pathname)
  const steps: NavStep[] = parent && belowByEntry.get(key) === parent ? [{ back: true, transient: true }] : []
  steps.push({ to: root, replace: true })
  if (target !== root) steps.push({ to: target, below: root })
  return steps
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
  belowByEntry.clear()
  sessionState.calendar = null
  sessionState.statsTab = 'exercise'
}
