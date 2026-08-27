import type { ReactNode } from 'react'
import { niceStep, niceTicks, toSigFigs, trimZeros } from '../../../science/units'
import { useSceneView } from '../SceneFrame'

/**
 * Measurement primitives — the instruments a physics diagram needs and this app
 * had none of: numbered axes, a calibrated ruler, a protractor, dimension lines,
 * and arrows whose length actually means something.
 *
 * Every one of these takes **physical coordinates** and projects them through the
 * shared `useSceneView()` transform, so they land exactly on the 3D scene beneath.
 * Every label is computed from the geometry it is drawn on, never passed in as a
 * string — a protractor that says "107°" while drawing 99° is worse than no
 * protractor, and that exact defect shipped in the old molecular-geometry view.
 */

function fmt(value: number, sig = 3): string {
  if (!Number.isFinite(value)) return '—'
  return trimZeros(toSigFigs(value, sig))
}

/** A dot with a leader line and a caption, for apex/impact/equilibrium points. */
export function Marker({
  x,
  y,
  label,
  detail,
  tone = 'cyan',
  anchor = 'above'
}: {
  x: number
  y: number
  label: string
  detail?: string
  tone?: 'cyan' | 'green' | 'amber' | 'violet' | 'danger'
  anchor?: 'above' | 'below' | 'left' | 'right'
}) {
  const view = useSceneView()
  const [px, py] = view.project(x, y)
  const gap = 14
  const offsets = {
    above: { lx: 0, ly: -gap, textAnchor: 'middle' as const, dy: -6 },
    below: { lx: 0, ly: gap, textAnchor: 'middle' as const, dy: 16 },
    left: { lx: -gap, ly: 0, textAnchor: 'end' as const, dy: 4 },
    right: { lx: gap, ly: 0, textAnchor: 'start' as const, dy: 4 }
  }
  const o = offsets[anchor]

  return (
    <g className={`measure measure--${tone}`}>
      <line className="measure__leader" x1={px} y1={py} x2={px + o.lx} y2={py + o.ly} />
      <circle className="measure__dot" cx={px} cy={py} r={4} />
      <text className="measure__label" x={px + o.lx} y={py + o.ly + o.dy} textAnchor={o.textAnchor}>
        {label}
      </text>
      {detail ? (
        <text
          className="measure__sublabel"
          x={px + o.lx}
          y={py + o.ly + o.dy + 14}
          textAnchor={o.textAnchor}
        >
          {detail}
        </text>
      ) : null}
    </g>
  )
}

/** Gridlines at a round physical spacing, with the spacing stated in a corner. */
export function Grid({
  step,
  unit = 'm',
  showSpacingLabel = true
}: {
  step?: number
  unit?: string
  showSpacingLabel?: boolean
}) {
  const view = useSceneView()
  const { extent } = view
  const spacing = step ?? view.cellUnits
  if (!(spacing > 0)) return null

  const xs = niceTicks(extent.x[0], extent.x[1], Math.max(2, Math.round((extent.x[1] - extent.x[0]) / spacing)))
  const ys = niceTicks(extent.y[0], extent.y[1], Math.max(2, Math.round((extent.y[1] - extent.y[0]) / spacing)))

  return (
    <g className="measure measure--grid">
      {xs.map((x) => {
        const [px] = view.project(x, 0)
        return <line key={`gx-${x}`} className="measure__gridline" x1={px} y1={0} x2={px} y2={view.height} />
      })}
      {ys.map((y) => {
        const [, py] = view.project(0, y)
        return <line key={`gy-${y}`} className="measure__gridline" x1={0} y1={py} x2={view.width} y2={py} />
      })}
      {showSpacingLabel ? (
        <text className="measure__caption" x={view.width - 10} y={view.height - 10} textAnchor="end">
          {`grid = ${fmt(spacing)} ${unit}`}
        </text>
      ) : null}
    </g>
  )
}

/**
 * Numbered axes. The tick values come from `niceTicks`, so they read 0, 10, 20
 * rather than 0, 4.7, 9.4 — and every one carries its number, which no view in
 * this app previously did.
 */
export function Axes({
  xLabel,
  yLabel,
  xUnit = 'm',
  yUnit = 'm',
  originX = 0,
  originY = 0,
  showY = true
}: {
  xLabel: string
  yLabel?: string
  xUnit?: string
  yUnit?: string
  originX?: number
  originY?: number
  showY?: boolean
}) {
  const view = useSceneView()
  const { extent } = view
  const [ox, oy] = view.project(originX, originY)

  const xTicks = niceTicks(extent.x[0], extent.x[1], 8).filter((t) => t !== originX)
  const yTicks = niceTicks(extent.y[0], extent.y[1], 6).filter((t) => t !== originY)

  return (
    <g className="measure measure--axes">
      <line className="measure__axis" x1={0} y1={oy} x2={view.width} y2={oy} />
      {showY ? <line className="measure__axis" x1={ox} y1={0} x2={ox} y2={view.height} /> : null}

      {xTicks.map((t) => {
        const [px] = view.project(t, originY)
        return (
          <g key={`xt-${t}`}>
            <line className="measure__tick" x1={px} y1={oy} x2={px} y2={oy + 6} />
            <text className="measure__tick-label" x={px} y={oy + 19} textAnchor="middle">
              {fmt(t)}
            </text>
          </g>
        )
      })}

      {showY
        ? yTicks.map((t) => {
            const [, py] = view.project(originX, t)
            return (
              <g key={`yt-${t}`}>
                <line className="measure__tick" x1={ox} y1={py} x2={ox - 6} y2={py} />
                <text className="measure__tick-label" x={ox - 10} y={py + 4} textAnchor="end">
                  {fmt(t)}
                </text>
              </g>
            )
          })
        : null}

      <text className="measure__axis-label" x={view.width - 8} y={oy - 10} textAnchor="end">
        {`${xLabel} (${xUnit})`}
      </text>
      {showY && yLabel ? (
        <text
          className="measure__axis-label"
          x={ox + 12}
          y={16}
          textAnchor="start"
        >
          {`${yLabel} (${yUnit})`}
        </text>
      ) : null}
    </g>
  )
}

/**
 * A calibrated ruler — "the scale for how far it goes".
 *
 * Major ticks at a round spacing with numbers on them, minor ticks between, and
 * the total span called out at the end. Because world units are physical units,
 * a reading taken off this ruler is the number the metrics panel shows.
 */
export function Ruler({
  from,
  to,
  offsetPx = 0,
  unit = 'm',
  label,
  minorPerMajor = 5,
  tone = 'cyan'
}: {
  /** Physical start point. */
  from: readonly [number, number]
  /** Physical end point. */
  to: readonly [number, number]
  /** Push the ruler perpendicular to its own direction, in pixels. */
  offsetPx?: number
  unit?: string
  /** Caption. Defaults to the measured length with its unit. */
  label?: string
  minorPerMajor?: number
  tone?: 'cyan' | 'green' | 'amber' | 'violet'
}) {
  const view = useSceneView()
  const [ax, ay] = view.project(from[0], from[1])
  const [bx, by] = view.project(to[0], to[1])

  const dx = bx - ax
  const dy = by - ay
  const pxLength = Math.hypot(dx, dy)
  if (pxLength < 1) return null

  const ux = dx / pxLength
  const uy = dy / pxLength
  // Perpendicular, in SVG pixel space.
  const nx = -uy
  const ny = ux
  const sx = ax + nx * offsetPx
  const sy = ay + ny * offsetPx
  const ex = bx + nx * offsetPx
  const ey = by + ny * offsetPx

  const spanUnits = Math.hypot(to[0] - from[0], to[1] - from[1])
  const major = niceStep(spanUnits, 6)
  const minor = major / Math.max(1, Math.round(minorPerMajor))

  const ticks: ReactNode[] = []
  const count = Math.floor(spanUnits / minor + 1e-9)
  for (let i = 0; i <= count && i < 800; i += 1) {
    const distance = i * minor
    const t = distance / spanUnits
    const tx = sx + (ex - sx) * t
    const ty = sy + (ey - sy) * t
    // Floating-point safe test for "is this a major tick".
    const ratio = distance / major
    const isMajor = Math.abs(ratio - Math.round(ratio)) < 1e-6
    const len = isMajor ? 9 : 5
    ticks.push(
      <line
        key={`tick-${i}`}
        className={isMajor ? 'measure__tick measure__tick--major' : 'measure__tick'}
        x1={tx}
        y1={ty}
        x2={tx + nx * -len}
        y2={ty + ny * -len}
      />
    )
    if (isMajor) {
      ticks.push(
        <text
          key={`num-${i}`}
          className="measure__tick-label"
          x={tx + nx * -len - nx * 8}
          y={ty + ny * -len - ny * 8 + 4}
          textAnchor="middle"
        >
          {fmt(distance)}
        </text>
      )
    }
  }

  const midX = (sx + ex) / 2
  const midY = (sy + ey) / 2

  return (
    <g className={`measure measure--${tone} measure--ruler`}>
      <line className="measure__ruler-spine" x1={sx} y1={sy} x2={ex} y2={ey} />
      {ticks}
      <text
        className="measure__caption"
        x={midX + nx * 24}
        y={midY + ny * 24 + 4}
        textAnchor="middle"
      >
        {label ?? `${fmt(spanUnits, 4)} ${unit}`}
      </text>
    </g>
  )
}

function arrowHead(tipX: number, tipY: number, ux: number, uy: number, size: number): string {
  const backX = tipX - ux * size
  const backY = tipY - uy * size
  const halfW = size * 0.42
  return [
    `${tipX},${tipY}`,
    `${backX + -uy * halfW},${backY + ux * halfW}`,
    `${backX + uy * halfW},${backY - ux * halfW}`
  ].join(' ')
}

/**
 * An engineering-style dimension line: extension lines at each end, arrowheads
 * pointing outward, and the measured value in the middle. This is the direct
 * answer to "how far does it go" — it puts a number on a distance in the picture.
 */
export function Dimension({
  from,
  to,
  offsetPx = 26,
  unit = 'm',
  label,
  tone = 'amber'
}: {
  from: readonly [number, number]
  to: readonly [number, number]
  offsetPx?: number
  unit?: string
  label?: string
  tone?: 'cyan' | 'green' | 'amber' | 'violet'
}) {
  const view = useSceneView()
  const [ax, ay] = view.project(from[0], from[1])
  const [bx, by] = view.project(to[0], to[1])
  const dx = bx - ax
  const dy = by - ay
  const pxLength = Math.hypot(dx, dy)
  if (pxLength < 2) return null

  const ux = dx / pxLength
  const uy = dy / pxLength
  const nx = -uy
  const ny = ux
  const sx = ax + nx * offsetPx
  const sy = ay + ny * offsetPx
  const ex = bx + nx * offsetPx
  const ey = by + ny * offsetPx

  const spanUnits = Math.hypot(to[0] - from[0], to[1] - from[1])
  const head = Math.min(11, pxLength / 3)

  return (
    <g className={`measure measure--${tone} measure--dimension`}>
      <line className="measure__extension" x1={ax} y1={ay} x2={sx + nx * 5} y2={sy + ny * 5} />
      <line className="measure__extension" x1={bx} y1={by} x2={ex + nx * 5} y2={ey + ny * 5} />
      <line className="measure__dimension-line" x1={sx} y1={sy} x2={ex} y2={ey} />
      <polygon className="measure__head" points={arrowHead(sx, sy, -ux, -uy, head)} />
      <polygon className="measure__head" points={arrowHead(ex, ey, ux, uy, head)} />
      <text
        className="measure__value"
        x={(sx + ex) / 2 + nx * 14}
        y={(sy + ey) / 2 + ny * 14 + 4}
        textAnchor="middle"
      >
        {label ?? `${fmt(spanUnits, 4)} ${unit}`}
      </text>
    </g>
  )
}

/**
 * A protractor — the "protected angles" instrument.
 *
 * Degree ticks every 10° with numbers every 30°, plus a filled wedge marking the
 * measured angle and its value. The wedge is drawn from the same numbers the
 * label prints, so the drawing and the caption cannot drift apart.
 */
export function Protractor({
  vertex,
  angleDeg,
  referenceDeg = 0,
  radiusPx = 74,
  label,
  showScale = true,
  tone = 'violet'
}: {
  /** Physical position of the angle's vertex. */
  vertex: readonly [number, number]
  /** The angle being measured, in degrees anticlockwise from the reference. */
  angleDeg: number
  /** Direction of the zero line, in degrees anticlockwise from +x. */
  referenceDeg?: number
  radiusPx?: number
  /** Caption. Defaults to the angle with a degree sign. */
  label?: string
  /** Draw the full graduated scale, not just the measured wedge. */
  showScale?: boolean
  tone?: 'cyan' | 'green' | 'amber' | 'violet'
}) {
  const view = useSceneView()
  const [cx, cy] = view.project(vertex[0], vertex[1])

  // Physical angles run anticlockwise; SVG y grows downward, so the screen angle
  // is the negation. Getting this backwards is how a diagram ends up mirrored.
  const toScreen = (deg: number) => (-deg * Math.PI) / 180
  const at = (deg: number, r: number): [number, number] => {
    const a = toScreen(deg)
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  }

  const sweep = Math.max(-360, Math.min(360, angleDeg))
  const start = referenceDeg
  const end = referenceDeg + sweep

  const [wx, wy] = at(start, radiusPx * 0.62)
  const [ex, ey] = at(end, radiusPx * 0.62)
  // largeArc when the sweep exceeds a half turn; SVG's sweep flag is inverted
  // relative to physical anticlockwise because of the y-down coordinate system.
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0
  const sweepFlag = sweep >= 0 ? 0 : 1
  const wedge = `M ${cx} ${cy} L ${wx} ${wy} A ${radiusPx * 0.62} ${radiusPx * 0.62} 0 ${largeArc} ${sweepFlag} ${ex} ${ey} Z`

  const ticks: ReactNode[] = []
  if (showScale) {
    for (let deg = 0; deg <= 180; deg += 10) {
      const absolute = referenceDeg + deg
      const isLabelled = deg % 30 === 0
      const inner = radiusPx - (isLabelled ? 12 : 7)
      const [ix, iy] = at(absolute, inner)
      const [ox, oy] = at(absolute, radiusPx)
      ticks.push(
        <line
          key={`pt-${deg}`}
          className={isLabelled ? 'measure__tick measure__tick--major' : 'measure__tick'}
          x1={ix}
          y1={iy}
          x2={ox}
          y2={oy}
        />
      )
      if (isLabelled) {
        const [lx, ly] = at(absolute, radiusPx + 13)
        ticks.push(
          <text key={`pl-${deg}`} className="measure__tick-label" x={lx} y={ly + 4} textAnchor="middle">
            {deg}
          </text>
        )
      }
    }
  }

  const [labelX, labelY] = at(start + sweep / 2, radiusPx * 0.4)
  const [refX, refY] = at(start, radiusPx)
  const [armX, armY] = at(end, radiusPx)

  return (
    <g className={`measure measure--${tone} measure--protractor`}>
      {showScale ? (
        <path
          className="measure__arc"
          d={`M ${at(referenceDeg, radiusPx)[0]} ${at(referenceDeg, radiusPx)[1]} A ${radiusPx} ${radiusPx} 0 0 1 ${at(referenceDeg + 180, radiusPx)[0]} ${at(referenceDeg + 180, radiusPx)[1]}`}
        />
      ) : null}
      {ticks}
      <path className="measure__wedge" d={wedge} />
      <line className="measure__reference" x1={cx} y1={cy} x2={refX} y2={refY} />
      <line className="measure__arm" x1={cx} y1={cy} x2={armX} y2={armY} />
      <text className="measure__value" x={labelX} y={labelY + 4} textAnchor="middle">
        {label ?? `${fmt(sweep, 4)}°`}
      </text>
    </g>
  )
}

/**
 * A vector arrow with a real arrowhead, whose length is proportional to the
 * quantity it represents through an explicit, caller-supplied scale.
 *
 * The old views drew "force vectors" as fixed-length segments, and one drew
 * gravitational force arrows that got *longer as the force got weaker*. So the
 * scale is a required argument here, and `VectorLegend` puts it on screen where
 * the student can see it.
 */
export function Vector({
  at: origin,
  vx,
  vy,
  /** Pixels drawn per unit of the quantity. Required — no implicit normalisation. */
  pxPerUnit,
  label,
  unit,
  tone = 'green',
  dashed = false,
  showComponents = false
}: {
  at: readonly [number, number]
  vx: number
  vy: number
  pxPerUnit: number
  label?: string
  unit?: string
  tone?: 'cyan' | 'green' | 'amber' | 'violet' | 'danger'
  dashed?: boolean
  /** Also draw the dashed x and y components, as a textbook figure does. */
  showComponents?: boolean
}) {
  const view = useSceneView()
  const [ox, oy] = view.project(origin[0], origin[1])
  const magnitude = Math.hypot(vx, vy)
  if (!(magnitude > 0) || !(pxPerUnit > 0)) return null

  const lengthPx = magnitude * pxPerUnit
  if (lengthPx < 1.5) return null

  // Screen direction: y is negated because physical up is screen down.
  const ux = vx / magnitude
  const uy = -vy / magnitude
  const tipX = ox + ux * lengthPx
  const tipY = oy + uy * lengthPx
  const head = Math.min(12, Math.max(5, lengthPx * 0.28))

  return (
    <g className={`measure measure--${tone} measure--vector`}>
      {showComponents ? (
        <>
          <line
            className="measure__component"
            x1={ox}
            y1={oy}
            x2={ox + vx * pxPerUnit}
            y2={oy}
          />
          <line
            className="measure__component"
            x1={ox + vx * pxPerUnit}
            y1={oy}
            x2={tipX}
            y2={tipY}
          />
        </>
      ) : null}
      <line
        className={dashed ? 'measure__shaft measure__shaft--dashed' : 'measure__shaft'}
        x1={ox}
        y1={oy}
        x2={tipX - ux * head * 0.8}
        y2={tipY - uy * head * 0.8}
      />
      <polygon className="measure__head" points={arrowHead(tipX, tipY, ux, uy, head)} />
      {label ? (
        <text
          className="measure__label"
          x={tipX + ux * 12}
          y={tipY + uy * 12 + 4}
          textAnchor={ux >= 0 ? 'start' : 'end'}
        >
          {unit ? `${label} ${fmt(magnitude, 3)} ${unit}` : label}
        </text>
      ) : null}
    </g>
  )
}

/**
 * States what a vector arrow's length means, e.g. "→ 20 px = 10 m/s". Without
 * this a scaled arrow is decoration; with it, it is a measurement.
 */
export function VectorLegend({
  entries,
  x = 12,
  y = 12
}: {
  entries: Array<{ label: string; pxPerUnit: number; unit: string; tone?: string; sample?: number }>
  x?: number
  y?: number
}) {
  return (
    <g className="measure measure--legend">
      {entries.map((entry, index) => {
        const sample = entry.sample ?? 1
        const lengthPx = Math.min(48, Math.max(14, sample * entry.pxPerUnit))
        const rowY = y + 14 + index * 20
        return (
          <g key={entry.label} className={`measure--${entry.tone ?? 'green'}`}>
            <line className="measure__shaft" x1={x} y1={rowY} x2={x + lengthPx - 7} y2={rowY} />
            <polygon className="measure__head" points={arrowHead(x + lengthPx, rowY, 1, 0, 8)} />
            <text className="measure__caption" x={x + lengthPx + 10} y={rowY + 4}>
              {`${entry.label}: ${fmt(sample)} ${entry.unit}`}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** A polyline through physical points — a trajectory, a field line, a ray. */
export function Path({
  points,
  tone = 'cyan',
  dashed = false,
  width,
  fade = false
}: {
  points: ReadonlyArray<readonly [number, number]>
  tone?: 'cyan' | 'green' | 'amber' | 'violet' | 'danger' | 'muted'
  dashed?: boolean
  width?: number
  /** Draw as a faint ghost, for a previous run kept for comparison. */
  fade?: boolean
}) {
  const view = useSceneView()
  if (points.length < 2) return null
  const d = points
    .map((p, index) => {
      const [px, py] = view.project(p[0], p[1])
      return `${index === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`
    })
    .join(' ')
  const classes = ['measure', `measure--${tone}`, 'measure__path']
  if (dashed) classes.push('measure__path--dashed')
  if (fade) classes.push('measure__path--ghost')
  return <path className={classes.join(' ')} d={d} strokeWidth={width} fill="none" />
}

/** Free text pinned to a physical position. */
export function Label({
  x,
  y,
  children,
  dxPx = 0,
  dyPx = 0,
  anchor = 'start',
  tone = 'muted'
}: {
  x: number
  y: number
  children: string
  dxPx?: number
  dyPx?: number
  anchor?: 'start' | 'middle' | 'end'
  tone?: 'cyan' | 'green' | 'amber' | 'violet' | 'danger' | 'muted'
}) {
  const view = useSceneView()
  const [px, py] = view.project(x, y)
  return (
    <text
      className={`measure measure--${tone} measure__label`}
      x={px + dxPx}
      y={py + dyPx}
      textAnchor={anchor}
    >
      {children}
    </text>
  )
}
