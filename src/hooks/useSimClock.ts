import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * One clock per simulation.
 *
 * The SHM simulation used to run two independent clocks: `useFrame` advanced the
 * cube while a separate React state drove the metrics and the graph, so pressing
 * Play animated the block while every number on screen stayed frozen — and Reset
 * zeroed only one of them. A student watching that has no way to connect the
 * moving thing to the numbers describing it, which is the entire point of the
 * exercise.
 *
 * So there is exactly one clock, it lives in React state, and the scene, the
 * metrics, the graph playhead and the data table all read the same `time`. They
 * cannot disagree.
 */
export interface SimClockOptions {
  /**
   * Length of one run in simulated seconds. Omit for an open-ended clock (a
   * field-line explorer, say) that runs until paused.
   */
  duration?: number
  /** Start running on mount. Default `false` — a student should press Play. */
  autoPlay?: boolean
  /** Restart from zero on reaching `duration` instead of stopping. */
  loop?: boolean
  /** Simulated seconds per wall-clock second. Default 1. */
  initialSpeed?: number
  /**
   * Cap the update rate. Default 0 (every animation frame). Set 30 for scenes
   * heavy enough that a 60 Hz React render costs more than the smoothness buys.
   */
  fps?: number
  /** Called once when the clock reaches `duration` and is not looping. */
  onComplete?: () => void
}

export interface SimClock {
  /** Simulated time in seconds. The single source of truth. */
  time: number
  /** Whether the clock is advancing. */
  playing: boolean
  /** Simulated seconds per wall-clock second. */
  speed: number
  /** `duration` if one was given, else `Infinity`. */
  duration: number
  /** Fraction of the run elapsed, 0..1. Always 0 for an open-ended clock. */
  progress: number
  /** True once an unlooped clock has reached `duration`. */
  finished: boolean
  play(): void
  pause(): void
  toggle(): void
  /** Back to t = 0, paused, and `finished` cleared. */
  reset(): void
  /** Advance by `seconds` (default 1/30 s) while paused, for frame-stepping. */
  step(seconds?: number): void
  /** Jump to an absolute time — used by a graph scrubber. */
  seek(seconds: number): void
  setSpeed(next: number): void
  /**
   * Attach to the scene container. The clock pauses itself while the element is
   * scrolled out of view or the tab is hidden, so a backgrounded simulation stops
   * burning battery. The old projectile sim's requestAnimationFrame loop never
   * stopped at all.
   */
  containerRef: React.RefObject<HTMLDivElement>
}

/** True when the OS asks for reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useSimClock(options: SimClockOptions = {}): SimClock {
  const { duration, autoPlay = false, loop = false, initialSpeed = 1, fps = 0, onComplete } = options

  const total = duration !== undefined && Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY

  // Never autoplay into a reduced-motion preference: the student opted out of
  // things moving without being asked.
  const [playing, setPlaying] = useState(autoPlay && !prefersReducedMotion())
  const [time, setTime] = useState(0)
  const [speed, setSpeedState] = useState(initialSpeed)
  const [finished, setFinished] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const frame = useRef<number>()
  const lastStamp = useRef<number>()
  const accumulator = useRef(0)
  const visible = useRef(true)
  const [visibilityTick, setVisibilityTick] = useState(0)

  // `onComplete` is read from a ref so a caller passing an inline arrow does not
  // restart the animation loop on every render.
  const completeRef = useRef(onComplete)
  useEffect(() => {
    completeRef.current = onComplete
  }, [onComplete])

  // Pause while off-screen or on a hidden tab. Both are cases where the student
  // is definitionally not watching.
  useEffect(() => {
    const element = containerRef.current
    const update = (next: boolean) => {
      if (visible.current === next) return
      visible.current = next
      setVisibilityTick((value) => value + 1)
    }

    const onVisibility = () => update(!document.hidden && visible.current !== false)
    document.addEventListener('visibilitychange', onVisibility)

    let observer: IntersectionObserver | undefined
    if (element && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (entry) update(entry.isIntersecting && !document.hidden)
        },
        { threshold: 0.01 }
      )
      observer.observe(element)
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      observer?.disconnect()
    }
  }, [])

  const minStep = fps > 0 ? 1 / fps : 0

  useEffect(() => {
    if (!playing) {
      lastStamp.current = undefined
      return
    }
    if (typeof window === 'undefined') return

    let cancelled = false

    const tick = (stamp: number) => {
      if (cancelled) return
      if (lastStamp.current === undefined) lastStamp.current = stamp

      // Cap the delta so returning to a backgrounded tab does not teleport the
      // simulation forward by however long the student was away.
      const wall = Math.min((stamp - lastStamp.current) / 1000, 0.1)
      lastStamp.current = stamp

      if (!document.hidden && visible.current) {
        accumulator.current += wall * speed
        if (accumulator.current >= minStep) {
          const advance = accumulator.current
          accumulator.current = 0
          setTime((current) => {
            const next = current + advance
            if (next >= total) {
              if (loop) return next % total
              return total
            }
            return next
          })
        }
      }

      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      if (frame.current !== undefined) cancelAnimationFrame(frame.current)
      lastStamp.current = undefined
      accumulator.current = 0
    }
  }, [playing, speed, total, loop, minStep, visibilityTick])

  // Completion is detected here rather than inside the setState updater above.
  // Calling a store mutation from inside an updater double-fires under React
  // StrictMode, which is how the projectile sim marked itself complete twice.
  useEffect(() => {
    if (loop || total === Number.POSITIVE_INFINITY) return
    if (time < total || finished) return
    setFinished(true)
    setPlaying(false)
    completeRef.current?.()
  }, [time, total, loop, finished])

  const play = useCallback(() => {
    setFinished((wasFinished) => {
      if (wasFinished) setTime(0)
      return false
    })
    setPlaying(true)
  }, [])

  const pause = useCallback(() => setPlaying(false), [])

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false)
      return
    }
    play()
  }, [play, playing])

  const reset = useCallback(() => {
    // Reset stops the clock as well as zeroing it. The old Newton's-law sim's
    // Reset only paused, leaving the block wherever it had drifted to.
    setPlaying(false)
    setTime(0)
    setFinished(false)
    accumulator.current = 0
    lastStamp.current = undefined
  }, [])

  const step = useCallback(
    (seconds = 1 / 30) => {
      setPlaying(false)
      setTime((current) => Math.min(total, Math.max(0, current + seconds)))
    },
    [total]
  )

  const seek = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(seconds)) return
      const clamped = Math.min(total, Math.max(0, seconds))
      setTime(clamped)
      setFinished(clamped >= total && total !== Number.POSITIVE_INFINITY)
    },
    [total]
  )

  const setSpeed = useCallback((next: number) => {
    if (!Number.isFinite(next) || next <= 0) return
    setSpeedState(next)
  }, [])

  // A new duration means new physics: rewind rather than leaving the playhead
  // past the end of a now-shorter run.
  useEffect(() => {
    setTime((current) => (current > total ? total : current))
    setFinished(false)
  }, [total])

  return useMemo(
    () => ({
      time,
      playing,
      speed,
      duration: total,
      progress: total === Number.POSITIVE_INFINITY ? 0 : Math.min(1, time / total),
      finished,
      play,
      pause,
      toggle,
      reset,
      step,
      seek,
      setSpeed,
      containerRef
    }),
    [time, playing, speed, total, finished, play, pause, toggle, reset, step, seek, setSpeed]
  )
}
