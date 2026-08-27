import { useEffect, useRef } from 'react'
import { progressStore } from '../state/progressStore'

/**
 * Credits time spent actually looking at a simulation.
 *
 * The Progress page previously reported a completion percentage and nothing else,
 * because nothing in the app measured time. This measures it honestly: the clock
 * only advances while the tab is visible, and the pending interval is committed
 * when the tab is hidden or the component unmounts, so a student who opens six
 * simulations in six tabs is not credited six hours for one afternoon.
 */

/** How often time is banked. Small enough that navigating away loses very little. */
const TICK_MS = 15_000

export function useStudyTimer(simulationId: string, enabled = true): void {
  // Held in a ref so changing the id mid-session commits the old bucket first.
  const lastCommit = useRef(0)

  useEffect(() => {
    if (!enabled || !simulationId) return

    // `Date.now` rather than `performance.now`: a system-clock jump is bounded by
    // `addStudyTime`'s own cap, and this reading survives a suspended tab.
    lastCommit.current = Date.now()

    const commit = () => {
      const now = Date.now()
      const seconds = (now - lastCommit.current) / 1000
      lastCommit.current = now
      if (seconds >= 1) progressStore.addStudyTime(simulationId, seconds)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Bank what was earned before the tab went away…
        commit()
      } else {
        // …and start fresh on return, so the hidden stretch is not counted.
        lastCommit.current = Date.now()
      }
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') commit()
    }, TICK_MS)

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      if (document.visibilityState === 'visible') commit()
    }
  }, [simulationId, enabled])
}

export default useStudyTimer
