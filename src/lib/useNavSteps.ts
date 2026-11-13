import { useEffect } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { upSteps, type NavStep } from './tabMemory'

// Steps that must wait until a "back" step has landed (history.back is async).
let pending: NavStep[] = []

/** Runs navigation steps in order. A back step defers the remaining steps until the pop happened. */
export function useRunSteps(): (steps: NavStep[]) => void {
  const navigate = useNavigate()
  return (steps) => {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if ('back' in step) {
        pending = steps.slice(i + 1)
        navigate(-1)
        return
      }
      navigate(step.to, { replace: step.replace, state: step.below ? { below: step.below } : undefined })
    }
  }
}

/** True while a tab switch is passing through a transient back step. */
export function inTransientStep(): boolean {
  return pending.length > 0
}

/** Mount once (in App): continues deferred steps after a back step has popped. */
export function usePendingSteps(): void {
  const location = useLocation()
  const type = useNavigationType()
  const run = useRunSteps()
  useEffect(() => {
    if (type !== 'POP' || pending.length === 0) return
    const steps = pending
    pending = []
    run(steps)
  }, [location.key]) // only react to new history entries
}

/** In-app back arrow: go up to the page's logical parent within its tab, never to another tab. */
export function useGoUp(): () => void {
  const location = useLocation()
  const run = useRunSteps()
  return () => run(upSteps(location.key, location.pathname))
}
