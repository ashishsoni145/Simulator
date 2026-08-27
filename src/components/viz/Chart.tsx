import { useCallback, useMemo, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useElementSize } from '../../hooks/useElementSize'
import { formatByStep, linearScale, niceTicks, padDomain, toSigFigs, trimZeros } from '../../science/units'
import { toneForIndex, toneVar } from './tone'
import type { Tone } from './tone'

/**
 * A graph a student can actually read a number off.
 *
 * The component this replaces drew a polyline inside a fixed 320×190 viewBox with
 * two grey lines for axes and *no numbers on either one*. You could see that a
 * curve went up, and nothing else — not how high, not how long, not in what units.
 * A graph without a scale is a picture of a graph.
 *
 * So: numbered ticks from `niceTicks` on both axes, units in the axis titles,
 * gridlines, an emphasised zero line when the range crosses it, a playhead locked
 * to the simulation clock with the value of every series printed at it, and
 * click-or-drag scrubbing that seeks the simulation.
 */

export interface ChartSeries {
  id: string
  label: string
  /** `[x, y]` pairs in physical units, ascending in x. */
  points: ReadonlyArray<readonly [number, number]>
  tone?: Tone
  dashed?: boolean
  /** Shade the area between the curve and y = 0. */
  area?: boolean
  /** Grey the series out — used for a closed-form curve that no longer applies. */
  inactive?: boolean
}

export interface ChartMarker {
  x: number
  label: string
  tone?: Tone
}

export interface ChartProps {
  series: ChartSeries[]
  xLabel: string
  yLabel: string
  xUnit?: string
  yUnit?: string
  /** Where to draw the playhead, in x units. Omit for a static chart. */
  playhead?: number
  /** Enables scrubbing. Receives an x value in domain units. */
  onScrub?: (x: number) => void
  markers?: ChartMarker[]
  /** Pin the domains rather than fitting the data — keeps a chart steady while a slider moves. */
  xDomain?: readonly [number, number]
  yDomain?: readonly [number, number]
  /** Plot height in CSS pixels. Width always fills the container. */
  height?: number
  /** Don't let the y domain go below zero (for speeds, energies, magnitudes). */
  yFloorAtZero?: boolean
  legend?: boolean
  /** One sentence naming the trend, used as the accessible description. */
  summary?: string
  className?: string
}

interface Resolved {
  x: number
  y: number
}

/** Linear interpolation of a series at an arbitrary x. */
function sampleAt(points: ReadonlyArray<readonly [number, number]>, x: number): Resolved | null {
  if (points.length === 0) return null
  const first = points[0] as readonly [number, number]
  const last = points[points.length - 1] as readonly [number, number]
  if (x <= first[0]) return { x: first[0], y: first[1] }
  if (x >= last[0]) return { x: last[0], y: last[1] }

  let low = 0
  let high = points.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if ((points[mid] as readonly [number, number])[0] <= x) low = mid
    else high = mid
  }
  const a = points[low] as readonly [number, number]
  const b = points[high] as readonly [number, number]
  const span = b[0] - a[0]
  const t = span === 0 ? 0 : (x - a[0]) / span
  return { x, y: a[1] + (b[1] - a[1]) * t }
}

export default function Chart({
  series,
  xLabel,
  yLabel,
  xUnit = '',
  yUnit = '',
  playhead,
  onScrub,
  markers = [],
  xDomain,
  yDomain,
  height = 230,
  yFloorAtZero = false,
  legend = true,
  summary,
  className
}: ChartProps) {
  const [hostRef, size] = useElementSize<HTMLDivElement>()
  const plotRef = useRef<SVGRectElement>(null)
  const width = size.width || 0

  const domains = useMemo(() => {
    const allX: number[] = []
    const allY: number[] = []
    for (const s of series) {
      for (const [px, py] of s.points) {
        if (Number.isFinite(px)) allX.push(px)
        if (Number.isFinite(py)) allY.push(py)
      }
    }
    const fallbackX: readonly [number, number] = [0, 1]
    const fallbackY: readonly [number, number] = [0, 1]

    const x =
      xDomain ??
      (allX.length > 0
        ? // x is the independent variable — usually time — so it is shown exactly
          // as given rather than padded, or the curve would float off both ends.
          ([Math.min(...allX), Math.max(...allX)] as readonly [number, number])
        : fallbackX)
    const y =
      yDomain ??
      (allY.length > 0
        ? padDomain(Math.min(...allY), Math.max(...allY), { padFraction: 0.1, snap: true, floorAtZero: yFloorAtZero })
        : fallbackY)

    return {
      x: (x[1] > x[0] ? x : ([x[0], x[0] + 1] as readonly [number, number])),
      y: (y[1] > y[0] ? y : ([y[0], y[0] + 1] as readonly [number, number]))
    }
  }, [series, xDomain, yDomain, yFloorAtZero])

  const yTickValues = useMemo(() => niceTicks(domains.y[0], domains.y[1], 5), [domains.y])
  const xTickValues = useMemo(() => niceTicks(domains.x[0], domains.x[1], 6), [domains.x])

  const yStep = yTickValues.length > 1 ? (yTickValues[1] as number) - (yTickValues[0] as number) : 1
  const xStep = xTickValues.length > 1 ? (xTickValues[1] as number) - (xTickValues[0] as number) : 1

  // The left margin has to fit the widest y label, or "−1000" clips off the edge.
  // 6.2 px per character at the 10 px tick font, measured empirically.
  const yLabelWidth = useMemo(() => {
    let widest = 0
    for (const t of yTickValues) widest = Math.max(widest, formatByStep(t, yStep).length)
    return Math.min(64, Math.max(22, widest * 6.2 + 8))
  }, [yTickValues, yStep])

  const margin = { top: 14, right: 14, bottom: 34, left: yLabelWidth + 16 }
  const plotWidth = Math.max(0, width - margin.left - margin.right)
  const plotHeight = Math.max(0, height - margin.top - margin.bottom)

  const scales = useMemo(() => {
    const x = linearScale({ domain: domains.x, range: [margin.left, margin.left + plotWidth] })
    // Range is inverted: SVG y grows downward while values grow upward.
    const y = linearScale({ domain: domains.y, range: [margin.top + plotHeight, margin.top] })
    return { x, y }
  }, [domains.x, domains.y, margin.left, margin.top, plotWidth, plotHeight])

  const readable = width > 0 && plotWidth > 10 && plotHeight > 10

  const paths = useMemo(() => {
    if (!readable) return []
    return series.map((s, index) => {
      const tone = s.tone ?? toneForIndex(index)
      const usable = s.points.filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py))
      const line = usable
        .map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${scales.x.map(px).toFixed(2)} ${scales.y.map(py).toFixed(2)}`)
        .join(' ')
      let areaPath = ''
      if (s.area && usable.length > 1) {
        const baseline = scales.y.map(Math.max(domains.y[0], Math.min(domains.y[1], 0)))
        const firstX = scales.x.map((usable[0] as readonly [number, number])[0])
        const lastX = scales.x.map((usable[usable.length - 1] as readonly [number, number])[0])
        areaPath = `${line} L ${lastX.toFixed(2)} ${baseline.toFixed(2)} L ${firstX.toFixed(2)} ${baseline.toFixed(2)} Z`
      }
      return { id: s.id, label: s.label, tone, dashed: s.dashed, inactive: s.inactive, line, areaPath }
    })
  }, [series, scales, readable, domains.y])

  const readouts = useMemo(() => {
    if (playhead === undefined || !Number.isFinite(playhead)) return []
    return series.map((s, index) => ({
      id: s.id,
      label: s.label,
      tone: s.tone ?? toneForIndex(index),
      inactive: s.inactive,
      sample: sampleAt(s.points, playhead)
    }))
  }, [series, playhead])

  const scrub = useCallback(
    (clientX: number) => {
      if (!onScrub || !readable) return
      const rect = plotRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0) return
      // getBoundingClientRect is in viewport pixels; the SVG shares that scale
      // because it has no viewBox transform, so a plain ratio is exact here.
      const fraction = (clientX - rect.left) / rect.width
      const clamped = Math.min(1, Math.max(0, fraction))
      onScrub(domains.x[0] + clamped * (domains.x[1] - domains.x[0]))
    },
    [onScrub, readable, domains.x]
  )

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<SVGRectElement>) => {
      if (!onScrub) return
      event.currentTarget.setPointerCapture(event.pointerId)
      scrub(event.clientX)
    },
    [onScrub, scrub]
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<SVGRectElement>) => {
      if (!onScrub) return
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
      scrub(event.clientX)
    },
    [onScrub, scrub]
  )

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<SVGSVGElement>) => {
      if (!onScrub) return
      const span = domains.x[1] - domains.x[0]
      const current = playhead ?? domains.x[0]
      const nudge = span / 50
      const jump = span / 10
      const moves: Record<string, number | undefined> = {
        ArrowRight: current + nudge,
        ArrowLeft: current - nudge,
        ArrowUp: current + jump,
        ArrowDown: current - jump,
        Home: domains.x[0],
        End: domains.x[1],
        PageUp: current + jump,
        PageDown: current - jump
      }
      const next = moves[event.key]
      if (next === undefined) return
      event.preventDefault()
      onScrub(Math.min(domains.x[1], Math.max(domains.x[0], next)))
    },
    [onScrub, domains.x, playhead]
  )

  const accessibleLabel = useMemo(() => {
    const names = series.map((s) => s.label).join(', ')
    const base = `${yLabel}${yUnit ? ` in ${yUnit}` : ''} against ${xLabel}${xUnit ? ` in ${xUnit}` : ''}. Series: ${names}.`
    return summary ? `${base} ${summary}` : base
  }, [series, xLabel, yLabel, xUnit, yUnit, summary])

  const zeroInRange = domains.y[0] < 0 && domains.y[1] > 0
  const playheadPx = playhead !== undefined && Number.isFinite(playhead) ? scales.x.map(playhead) : null

  return (
    <div className={`chart${className ? ` ${className}` : ''}`} ref={hostRef}>
      <svg
        className="chart__svg"
        width={width || undefined}
        height={height}
        role={onScrub ? 'slider' : 'img'}
        aria-label={accessibleLabel}
        aria-valuemin={onScrub ? domains.x[0] : undefined}
        aria-valuemax={onScrub ? domains.x[1] : undefined}
        aria-valuenow={onScrub && playhead !== undefined ? toSigFigs(playhead, 4) : undefined}
        aria-valuetext={
          onScrub && playhead !== undefined ? `${trimZeros(toSigFigs(playhead, 4))} ${xUnit}` : undefined
        }
        tabIndex={onScrub ? 0 : undefined}
        onKeyDown={onKeyDown}
      >
        {readable ? (
          <>
            {/* Gridlines first, so every curve sits on top of them. */}
            <g className="chart__grid">
              {yTickValues.map((t) => (
                <line
                  key={`gy-${t}`}
                  x1={margin.left}
                  x2={margin.left + plotWidth}
                  y1={scales.y.map(t)}
                  y2={scales.y.map(t)}
                />
              ))}
              {xTickValues.map((t) => (
                <line
                  key={`gx-${t}`}
                  y1={margin.top}
                  y2={margin.top + plotHeight}
                  x1={scales.x.map(t)}
                  x2={scales.x.map(t)}
                />
              ))}
            </g>

            {zeroInRange ? (
              <line
                className="chart__zero"
                x1={margin.left}
                x2={margin.left + plotWidth}
                y1={scales.y.map(0)}
                y2={scales.y.map(0)}
              />
            ) : null}

            {markers.map((marker) => {
              const mx = scales.x.map(marker.x)
              if (mx < margin.left - 1 || mx > margin.left + plotWidth + 1) return null
              return (
                <g key={`${marker.label}-${marker.x}`} className="chart__marker" style={{ color: toneVar(marker.tone ?? 'muted') }}>
                  <line x1={mx} x2={mx} y1={margin.top} y2={margin.top + plotHeight} />
                  <text x={mx + 4} y={margin.top + 11}>
                    {marker.label}
                  </text>
                </g>
              )
            })}

            {paths.map((p) => (
              <g key={p.id} style={{ color: toneVar(p.tone) }} className={p.inactive ? 'chart__series chart__series--inactive' : 'chart__series'}>
                {p.areaPath ? <path className="chart__area" d={p.areaPath} /> : null}
                <path className={p.dashed ? 'chart__line chart__line--dashed' : 'chart__line'} d={p.line} />
              </g>
            ))}

            {/* Axes and their numbers. */}
            <g className="chart__axis">
              <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotHeight} />
              <line
                x1={margin.left}
                x2={margin.left + plotWidth}
                y1={margin.top + plotHeight}
                y2={margin.top + plotHeight}
              />
            </g>

            <g className="chart__ticks">
              {yTickValues.map((t) => (
                <text key={`ty-${t}`} x={margin.left - 8} y={scales.y.map(t) + 3.5} textAnchor="end">
                  {formatByStep(t, yStep)}
                </text>
              ))}
              {xTickValues.map((t) => (
                <text
                  key={`tx-${t}`}
                  x={scales.x.map(t)}
                  y={margin.top + plotHeight + 15}
                  textAnchor="middle"
                >
                  {formatByStep(t, xStep)}
                </text>
              ))}
            </g>

            <text className="chart__axis-title" x={margin.left + plotWidth} y={height - 4} textAnchor="end">
              {xUnit ? `${xLabel} (${xUnit})` : xLabel}
            </text>
            <text
              className="chart__axis-title"
              transform={`translate(11 ${margin.top + plotHeight / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              {yUnit ? `${yLabel} (${yUnit})` : yLabel}
            </text>

            {playheadPx !== null ? (
              <g className="chart__playhead">
                <line x1={playheadPx} x2={playheadPx} y1={margin.top} y2={margin.top + plotHeight} />
                {readouts.map((r) =>
                  r.sample ? (
                    <circle
                      key={r.id}
                      style={{ color: toneVar(r.tone) }}
                      className="chart__playhead-dot"
                      cx={scales.x.map(r.sample.x)}
                      cy={scales.y.map(r.sample.y)}
                      r={3.6}
                    />
                  ) : null
                )}
              </g>
            ) : null}

            {/* Transparent hit area for scrubbing, on top so nothing steals the pointer. */}
            <rect
              ref={plotRef}
              className="chart__hit"
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              style={{ cursor: onScrub ? 'ew-resize' : 'default', pointerEvents: onScrub ? 'all' : 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
            />
          </>
        ) : null}
      </svg>

      {legend && series.length > 0 ? (
        <ul className="chart__legend">
          {series.map((s, index) => {
            const tone = s.tone ?? toneForIndex(index)
            const readout = readouts.find((r) => r.id === s.id)
            return (
              <li
                key={s.id}
                className={s.inactive ? 'chart__legend-item chart__legend-item--inactive' : 'chart__legend-item'}
                style={{ color: toneVar(tone) }}
              >
                <span className="chart__swatch" aria-hidden="true" />
                <span className="chart__legend-label">{s.label}</span>
                {readout?.sample ? (
                  <span className="chart__legend-value">
                    {`${trimZeros(toSigFigs(readout.sample.y, 4))}${yUnit ? ` ${yUnit}` : ''}`}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
