import { useEffect, useRef, useState } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * The measured CSS-pixel size of an element.
 *
 * Both the 3D stage and the graphs need this: a chart that guesses its width
 * draws axis ticks in the wrong place, and the old `SimulationGraph` sidestepped
 * the problem with a fixed 320×190 viewBox that the browser then stretched — which
 * is why its (already absent) tick spacing would have been wrong anyway.
 */
export function useElementSize<T extends HTMLElement>(): [React.RefObject<T>, ElementSize] {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // jsdom and very old browsers have no ResizeObserver; fall back to a single
    // measurement rather than throwing.
    if (typeof ResizeObserver === 'undefined') {
      setSize({ width: element.clientWidth, height: element.clientHeight })
      return
    }

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (!box) return
      setSize((current) =>
        // Sub-pixel jitter from a fractional layout would otherwise re-render on
        // every scroll of a zoomed page.
        Math.abs(current.width - box.width) < 0.5 && Math.abs(current.height - box.height) < 0.5
          ? current
          : { width: box.width, height: box.height }
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}

export default useElementSize
