import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { rememberPath, saveScroll, savedScroll } from './tabMemory'

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

  useEffect(() => {
    const onScroll = () => {
      if (!restoring.current) saveScroll(current.current, window.scrollY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    current.current = key
    rememberPath(location.pathname, location.search)

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
