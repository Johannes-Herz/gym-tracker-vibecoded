import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { recordNavigation, rememberPath, saveScroll, savedScroll } from './tabMemory'
import { inTransientStep } from './useNavSteps'

const MAX_RESTORE_FRAMES = 30

/**
 * Records the last route per tab and keeps the scroll position per route:
 * saved while scrolling, restored after navigating (retrying for a few frames
 * while lazily loaded pages render).
 */
export function useTabMemory(): void {
  const location = useLocation()
  const key = location.pathname + location.search
  const current = useRef(key)
  const restoring = useRef(false)
  const navigationType = useNavigationType()
  const prevEntry = useRef<{ key: string; pathname: string } | null>(null)

  // Remember which page lies below each history entry (used to go "up").
  useLayoutEffect(() => {
    const below = (location.state as { below?: string } | null)?.below
    recordNavigation(navigationType, location.key, prevEntry.current, below)
    prevEntry.current = { key: location.key, pathname: location.pathname }
  }, [location.key]) // runs once per history entry

  useEffect(() => {
    const onScroll = () => {
      if (!restoring.current) saveScroll(current.current, window.scrollY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    current.current = key
    if (!inTransientStep()) rememberPath(location.pathname, location.search)

    const target = savedScroll(key)
    restoring.current = true
    let frames = 0
    let raf = 0
    const attempt = () => {
      window.scrollTo(0, target)
      if (Math.abs(window.scrollY - target) < 2 || ++frames >= MAX_RESTORE_FRAMES) {
        restoring.current = false
        return
      }
      raf = requestAnimationFrame(attempt)
    }
    attempt()
    return () => {
      cancelAnimationFrame(raf)
      restoring.current = false
    }
  }, [key, location.pathname, location.search])
}
