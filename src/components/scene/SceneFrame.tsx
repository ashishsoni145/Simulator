import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { niceStep } from '../../science/units'

/**
 * The stage every simulation is drawn on.
 *
 * The central decision here: **world units are physical units.** A projectile
 * 40.8 m downrange sits at world x = 40.8. There is no metres-to-world conversion
 * anywhere, because the conversion was the bug — nine separate simulations each
 * invented their own version of it, most with a silent clamp buried inside, and a
 * clamp the student cannot see is a lie. Fitting the view is instead the
 * orthographic camera's job, done once, here.
 *
 * That choice buys something else: because the camera is orthographic and looks
 * straight down −Z, the mapping from physical coordinates to screen pixels is a
 * plain affine transform this component can compute exactly. So a measurement
 * layer drawn in SVG — labelled axes, a calibrated ruler, a protractor, arrows
 * with real arrowheads — lands pixel-perfect on top of the 3D scene, with crisp
 * text and no font downloads.
 */

export interface Extent {
  x: readonly [number, number]
  y: readonly [number, number]
}

export interface SceneView {
  /** The extent actually visible, widened from the requested one to fit the aspect ratio. */
  extent: Extent
  /** Canvas width in CSS pixels. */
  width: number
  /** Canvas height in CSS pixels. */
  height: number
  /** Screen pixels per physical unit. Identical on both axes, so angles are true. */
  pxPerUnit: number
  /** Physical units per screen pixel. */
  unitsPerPx: number
  /** A round-numbered grid spacing in physical units, suitable for this extent. */
  cellUnits: number
  /** Physical → SVG pixel coordinates. */
  project(x: number, y: number): [number, number]
  /** SVG pixel → physical coordinates. */
  unproject(px: number, py: number): [number, number]
  /** Convert a physical length to a pixel length. */
  toPx(length: number): number
  /** True while the student is orbiting in 3D, when flat measurements no longer align. */
  orbiting: boolean
}

const FALLBACK_VIEW: SceneView = {
  extent: { x: [0, 1], y: [0, 1] },
  width: 0,
  height: 0,
  pxPerUnit: 1,
  unitsPerPx: 1,
  cellUnits: 1,
  project: () => [0, 0],
  unproject: () => [0, 0],
  toPx: () => 0,
  orbiting: false
}

const SceneViewContext = createContext<SceneView>(FALLBACK_VIEW)

/**
 * The current projection. Available to both the 3D scene and the SVG measurement
 * layer, so the two cannot disagree about where 40.8 m is.
 */
export function useSceneView(): SceneView {
  return useContext(SceneViewContext)
}

/** Whether this browser can give us a WebGL context at all. */
export function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')
    return gl !== null
  } catch {
    return false
  }
}

function expandExtent(requested: Extent, width: number, height: number) {
  const xSpan = Math.abs(requested.x[1] - requested.x[0]) || 1
  const ySpan = Math.abs(requested.y[1] - requested.y[0]) || 1
  const cx = (requested.x[0] + requested.x[1]) / 2
  const cy = (requested.y[0] + requested.y[1]) / 2

  if (width <= 0 || height <= 0) {
    return { extent: requested, pxPerUnit: 1, cx, cy }
  }

  // One scale for both axes — the tighter constraint wins, so the whole requested
  // extent is guaranteed visible and neither axis is secretly stretched.
  const pxPerUnit = Math.min(width / xSpan, height / ySpan)
  const visibleXSpan = width / pxPerUnit
  const visibleYSpan = height / pxPerUnit

  return {
    extent: {
      x: [cx - visibleXSpan / 2, cx + visibleXSpan / 2] as [number, number],
      y: [cy - visibleYSpan / 2, cy + visibleYSpan / 2] as [number, number]
    },
    pxPerUnit,
    cx,
    cy
  }
}

export interface SceneFrameProps {
  /**
   * The physical region to show, in the simulation's own units. Declared by the
   * caller from the physics — never auto-normalised behind the student's back,
   * because that is what made a 20 m/s and a 60 m/s launch draw identical arcs.
   */
  extent: Extent
  /**
   * A sentence describing what is on screen, for screen readers and as the
   * canvas's accessible name. Required: a canvas with no description is invisible
   * to anyone not looking at it.
   */
  ariaDescription: string
  /** The r3f scene. Draw in physical coordinates. */
  children: ReactNode
  /** SVG measurement layer, drawn on top. Use the `measure/` primitives. */
  overlay?: ReactNode
  /** Non-interactive HTML drawn over everything — chips, legends, callouts. */
  hud?: ReactNode
  /** Offer a "rotate in 3D" toggle. Off by default: flat views measure better. */
  allowOrbit?: boolean
  /** Extra class on the root element. */
  className?: string
}

/**
 * Shown instead of the canvas when WebGL is unavailable — a machine without
 * hardware acceleration, a locked-down browser, a headless test. The old codebase
 * had a `WebGLFallback` component that was never imported anywhere, so those
 * students simply got a blank rectangle.
 */
function WebGLUnavailable({ description }: { description: string }) {
  return (
    <div className="scene-frame__fallback" role="img" aria-label={description}>
      <div className="scene-frame__fallback-inner">
        <p className="scene-frame__fallback-title">3D view unavailable</p>
        <p className="scene-frame__fallback-body">
          This browser could not start WebGL, so the 3D stage cannot be drawn. Every number, graph
          and control on this page still works — the physics is computed independently of the view.
        </p>
        <p className="scene-frame__fallback-hint">
          Try enabling hardware acceleration in your browser settings, or open this page in a
          different browser.
        </p>
      </div>
    </div>
  )
}

/**
 * Free rotation, mounted only while the student has asked for it.
 *
 * The camera set up below is a flat, calibrated, straight-on view; orbiting breaks
 * that on purpose. So this saves the camera's pose on mount and puts it back on
 * unmount — otherwise returning to the flat view would leave the scene at whatever
 * odd angle the student let go at, and every measurement drawn afterwards would be
 * quietly wrong.
 */
function OrbitRig({ target }: { target: readonly [number, number, number] }) {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    const position = camera.position.clone()
    const quaternion = camera.quaternion.clone()
    const zoom = camera.zoom
    return () => {
      camera.position.copy(position)
      camera.quaternion.copy(quaternion)
      camera.zoom = zoom
      camera.updateProjectionMatrix()
    }
  }, [camera])

  return <OrbitControls makeDefault enablePan={false} target={[target[0], target[1], target[2]]} />
}

export default function SceneFrame({
  extent,
  ariaDescription,
  children,
  overlay,
  hud,
  allowOrbit = false,
  className
}: SceneFrameProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [orbiting, setOrbiting] = useState(false)
  const [webgl, setWebgl] = useState<boolean | null>(null)

  useEffect(() => {
    setWebgl(detectWebGL())
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (typeof ResizeObserver === 'undefined') {
      setSize({ width: host.clientWidth, height: host.clientHeight })
      return
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const box = entry.contentRect
      setSize((current) =>
        Math.abs(current.width - box.width) < 0.5 && Math.abs(current.height - box.height) < 0.5
          ? current
          : { width: box.width, height: box.height }
      )
    })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  const geometry = useMemo(
    () => expandExtent(extent, size.width, size.height),
    [extent, size.width, size.height]
  )

  const view = useMemo<SceneView>(() => {
    const { extent: visible, pxPerUnit, cx, cy } = geometry
    const halfW = size.width / 2
    const halfH = size.height / 2
    const xSpan = Math.abs(visible.x[1] - visible.x[0]) || 1
    return {
      extent: visible,
      width: size.width,
      height: size.height,
      pxPerUnit,
      unitsPerPx: 1 / pxPerUnit,
      cellUnits: niceStep(xSpan, 8),
      // The exact inverse of the orthographic camera set up below. SVG y grows
      // downward, physical y grows upward, hence the subtraction.
      project: (x, y) => [halfW + (x - cx) * pxPerUnit, halfH - (y - cy) * pxPerUnit],
      unproject: (px, py) => [cx + (px - halfW) / pxPerUnit, cy - (py - halfH) / pxPerUnit],
      toPx: (length) => length * pxPerUnit,
      orbiting
    }
  }, [geometry, size.width, size.height, orbiting])

  const toggleOrbit = useCallback(() => setOrbiting((value) => !value), [])

  if (webgl === false) {
    return (
      <div className={`scene-frame${className ? ` ${className}` : ''}`} ref={hostRef}>
        <WebGLUnavailable description={ariaDescription} />
      </div>
    )
  }

  const ready = size.width > 0 && size.height > 0

  return (
    <div className={`scene-frame${className ? ` ${className}` : ''}`} ref={hostRef}>
      <SceneViewContext.Provider value={view}>
        {webgl === null ? null : (
          <Canvas
            orthographic
            // zoom is the whole trick: r3f's orthographic frustum is in pixels, so a
            // zoom of `pxPerUnit` makes one world unit exactly that many pixels —
            // and r3f keeps the frustum correct across resizes for us.
            camera={{
              zoom: geometry.pxPerUnit,
              position: [geometry.cx, geometry.cy, 100],
              near: 0.1,
              far: 1000
            }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            aria-label={ariaDescription}
            role="img"
          >
            <ambientLight intensity={0.75} />
            <directionalLight position={[30, 60, 80]} intensity={1.1} />
            <directionalLight position={[-40, 20, -30]} intensity={0.35} />
            {children}
            {orbiting ? <OrbitRig target={[geometry.cx, geometry.cy, 0]} /> : null}
          </Canvas>
        )}

        {ready && overlay && !orbiting ? (
          <svg
            className="scene-frame__measure"
            width={size.width}
            height={size.height}
            viewBox={`0 0 ${size.width} ${size.height}`}
            aria-hidden="true"
            focusable="false"
          >
            {overlay}
          </svg>
        ) : null}

        {orbiting && overlay ? (
          <p className="scene-frame__orbit-note">
            Measurements hidden while rotating — a ruler only reads true from the side.
          </p>
        ) : null}

        {hud ? <div className="scene-frame__hud">{hud}</div> : null}

        {allowOrbit ? (
          <button type="button" className="scene-frame__orbit-toggle" onClick={toggleOrbit}>
            {orbiting ? 'Back to flat view' : 'Rotate in 3D'}
          </button>
        ) : null}
      </SceneViewContext.Provider>
    </div>
  )
}
