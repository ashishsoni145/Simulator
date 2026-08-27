/**
 * The scale contract.
 *
 * Nine of this app's worst rendering bugs were the same bug: each simulation
 * invented its own mapping from a physical quantity to a screen or world
 * coordinate, usually with a silent `Math.max`/`Math.min` clamp buried in it. A
 * clamp that the student cannot see is a lie — the slider moves, the picture
 * does not, and the picture is what they believe.
 *
 * So scaling lives here, once, with three rules:
 *
 *  1. A scale's `domain` is always in physical units and is always declared.
 *  2. Clamping is opt-in and reported: `map()` never quietly saturates unless
 *     you asked for it, and `clampedAt` tells the caller when it did.
 *  3. Every scale can produce round-numbered `ticks()`, so any axis, ruler or
 *     protractor drawn from it carries real labelled values instead of
 *     decoration.
 */

/** A one-dimensional mapping from physical units onto scene or screen units. */
export interface Scale {
  /** Input extent in physical units, `[min, max]`. */
  readonly domain: readonly [number, number]
  /** Output extent in world units or pixels, `[atMin, atMax]`. */
  readonly range: readonly [number, number]
  /** Whether `map` saturates at the range ends instead of extrapolating. */
  readonly clamp: boolean
  /** Physical units spanned per output unit — the honest "scale factor". */
  readonly unitsPerOutput: number
  /** Output units per physical unit — the reciprocal, for sizing vectors. */
  readonly outputPerUnit: number
  /** Map a physical value into output space. */
  map(value: number): number
  /** Map an output coordinate back to a physical value. */
  invert(output: number): number
  /** True when `value` falls outside `domain` and would be (or was) clamped. */
  isOutOfRange(value: number): boolean
  /** Round-numbered values inside the domain, for axis and ruler labels. */
  ticks(target?: number): number[]
  /** The spacing `ticks()` chose, in physical units. */
  tickStep(target?: number): number
  /** A copy with a different domain, keeping range and clamp behaviour. */
  withDomain(domain: readonly [number, number]): Scale
}

export interface ScaleOptions {
  domain: readonly [number, number]
  range: readonly [number, number]
  /**
   * Saturate at the range ends rather than extrapolating past them. Default
   * `false`: extrapolation is usually the truthful answer, and a value drawn
   * off-screen is a visible, diagnosable problem where a clamp is an invisible
   * one. Set this only when the caller also surfaces `isOutOfRange`.
   */
  clamp?: boolean
}

/**
 * Build a linear scale. A zero-width domain is tolerated — it maps everything
 * to the midpoint of the range rather than producing `NaN`/`Infinity`, because
 * a degenerate domain is a normal transient while a student drags a slider.
 */
export function linearScale({ domain, range, clamp = false }: ScaleOptions): Scale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const dSpan = d1 - d0
  const rSpan = r1 - r0
  const degenerate = dSpan === 0
  const slope = degenerate ? 0 : rSpan / dSpan
  const midpoint = (r0 + r1) / 2

  const lo = Math.min(r0, r1)
  const hi = Math.max(r0, r1)
  const dLo = Math.min(d0, d1)
  const dHi = Math.max(d0, d1)

  return {
    domain: [d0, d1],
    range: [r0, r1],
    clamp,
    unitsPerOutput: rSpan === 0 ? 0 : dSpan / rSpan,
    outputPerUnit: slope,
    map(value) {
      if (!Number.isFinite(value)) return midpoint
      if (degenerate) return midpoint
      const out = r0 + (value - d0) * slope
      return clamp ? Math.min(hi, Math.max(lo, out)) : out
    },
    invert(output) {
      if (degenerate || slope === 0) return d0
      return d0 + (output - r0) / slope
    },
    isOutOfRange(value) {
      return !Number.isFinite(value) || value < dLo || value > dHi
    },
    ticks(target = 6) {
      return niceTicks(dLo, dHi, target)
    },
    tickStep(target = 6) {
      return niceStep(dHi - dLo, target)
    },
    withDomain(next) {
      return linearScale({ domain: next, range, clamp })
    }
  }
}

/**
 * Pick a "nice" tick spacing — 1, 2, 5 or 10 times a power of ten — that
 * divides `span` into roughly `target` intervals. This is what makes a ruler
 * read 0, 5, 10, 15 instead of 0, 4.7, 9.4.
 */
export function niceStep(span: number, target = 6): number {
  const safeSpan = Math.abs(span)
  if (!Number.isFinite(safeSpan) || safeSpan === 0) return 1
  const rough = safeSpan / Math.max(1, target)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)))
  const normalised = rough / magnitude
  const stepped = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return stepped * magnitude
}

/**
 * Round-numbered values covering `[min, max]`, inclusive of any nice value that
 * falls inside it. Returns at least the two endpoints so an axis is never bare.
 */
export function niceTicks(min: number, max: number, target = 6): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return []
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  if (lo === hi) return [lo]

  const step = niceStep(hi - lo, target)
  const first = Math.ceil(lo / step) * step
  const out: number[] = []
  // Guard the loop count as well as the bound: floating-point steps like 0.1
  // can otherwise overshoot or spin.
  const count = Math.floor((hi - first) / step) + 1
  for (let i = 0; i < count && i < 512; i += 1) {
    const value = first + i * step
    // Snap away accumulated float error so labels read "0.3" not "0.30000000004".
    out.push(roundToStep(value, step))
  }
  if (out.length === 0) return [lo, hi]
  return out
}

/** Snap `value` onto the lattice defined by `step`, killing float drift. */
export function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step === 0) return value
  const decimals = decimalsForStep(step)
  return Number.parseFloat((Math.round(value / step) * step).toFixed(decimals))
}

/**
 * How many decimal places a quantity quantised to `step` needs. A step of 0.005
 * needs three — the old slider hardcoded `toFixed(step < 1 ? 2 : 0)`, which
 * displayed both 0.005 and 0.015 as "0.01" and made the air-resistance control
 * look broken.
 */
export function decimalsForStep(step: number): number {
  const size = Math.abs(step)
  if (!Number.isFinite(size) || size === 0) return 0
  if (size >= 1) return 0
  return Math.min(10, Math.ceil(-Math.log10(size)))
}

/** Format a value at exactly the precision its slider step can resolve. */
export function formatByStep(value: number, step: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(decimalsForStep(step))
}

const SI_PREFIXES: Array<{ exp: number; symbol: string }> = [
  { exp: 24, symbol: 'Y' },
  { exp: 21, symbol: 'Z' },
  { exp: 18, symbol: 'E' },
  { exp: 15, symbol: 'P' },
  { exp: 12, symbol: 'T' },
  { exp: 9, symbol: 'G' },
  { exp: 6, symbol: 'M' },
  { exp: 3, symbol: 'k' },
  { exp: 0, symbol: '' },
  { exp: -3, symbol: 'm' },
  { exp: -6, symbol: 'µ' },
  { exp: -9, symbol: 'n' },
  { exp: -12, symbol: 'p' },
  { exp: -15, symbol: 'f' },
  { exp: -18, symbol: 'a' }
]

export interface QuantityFormat {
  /** Significant figures to keep. Default 3, which suits lab readouts. */
  sigFigs?: number
  /** Attach an SI prefix (kN, mA, µC) instead of printing a bare exponent. */
  prefix?: boolean
  /** Force scientific notation, e.g. for charge in coulombs. */
  scientific?: boolean
}

/** Round to `sigFigs` significant figures without switching to exponent form. */
export function toSigFigs(value: number, sigFigs = 3): number {
  if (!Number.isFinite(value) || value === 0) return value === 0 ? 0 : value
  const digits = Math.max(1, Math.min(15, Math.round(sigFigs)))
  return Number.parseFloat(value.toPrecision(digits))
}

/**
 * Render a physical quantity the way a lab readout should: fixed significant
 * figures, real units, and `×10ⁿ` rather than JavaScript's `e-19`.
 */
export function formatQuantity(value: number, unit = '', opts: QuantityFormat = {}): string {
  const { sigFigs = 3, prefix = false, scientific = false } = opts
  if (!Number.isFinite(value)) return unit ? `— ${unit}` : '—'
  const suffix = unit ? ` ${unit}` : ''
  if (value === 0) return `0${suffix}`

  const magnitude = Math.abs(value)

  if (scientific || magnitude >= 1e6 || magnitude < 1e-4) {
    if (prefix && !scientific) {
      const scaled = withPrefix(value, sigFigs)
      if (scaled) return `${scaled.text}${scaled.symbol}${unit ? ` ${unit}` : ''}`.replace('  ', ' ')
    }
    return `${formatScientific(value, sigFigs)}${suffix}`
  }

  if (prefix) {
    const scaled = withPrefix(value, sigFigs)
    if (scaled && scaled.symbol) return `${scaled.text} ${scaled.symbol}${unit}`
  }

  return `${trimZeros(toSigFigs(value, sigFigs))}${suffix}`
}

function withPrefix(value: number, sigFigs: number): { text: string; symbol: string } | null {
  const magnitude = Math.abs(value)
  const found = SI_PREFIXES.find((entry) => magnitude >= Math.pow(10, entry.exp))
  if (!found) return null
  const scaled = value / Math.pow(10, found.exp)
  return { text: trimZeros(toSigFigs(scaled, sigFigs)), symbol: found.symbol }
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻'
}

/** Render as `1.60 × 10⁻¹⁹` — readable by a student, unlike `1.6e-19`. */
export function formatScientific(value: number, sigFigs = 3): string {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  const exponent = Math.floor(Math.log10(Math.abs(value)))
  const mantissa = value / Math.pow(10, exponent)
  const mantissaText = trimZeros(toSigFigs(mantissa, sigFigs))
  if (exponent === 0) return mantissaText
  const exponentText = String(exponent)
    .split('')
    .map((char) => SUPERSCRIPT[char] ?? char)
    .join('')
  return `${mantissaText} × 10${exponentText}`
}

/** Drop trailing zeros so 2.50 reads "2.5" and 3.00 reads "3". */
export function trimZeros(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Number.isInteger(value)) return String(value)
  return String(Number.parseFloat(value.toPrecision(12)))
}

/**
 * A declared mapping between a physical scene and r3f world units.
 *
 * A simulation states its physical extent once — "this view covers 60 m across
 * and 25 m up" — and everything drawn in it (the ball, the ruler, the grid, the
 * velocity arrow) converts through the same object. That is what makes a grid
 * cell able to honestly say "5 m" and a doubled launch speed able to actually
 * draw a longer arc.
 */
export interface SceneScale {
  /** Horizontal scale: physical x → world x. */
  readonly x: Scale
  /** Vertical scale: physical y → world y. Shares x's ratio when `uniform`. */
  readonly y: Scale
  /** True when x and y use the same units-per-world-unit, so angles are true. */
  readonly uniform: boolean
  /** Physical units per world unit along x. Grid/ruler labels come from this. */
  readonly unitsPerWorld: number
  /** Round-numbered grid spacing in physical units. */
  readonly cellUnits: number
  /** That same spacing expressed in world units. */
  readonly cellWorld: number
  /** Convert a physical point to a world-space triple. */
  toWorld(x: number, y: number, z?: number): [number, number, number]
  /** Scale a physical length into a world length using the x ratio. */
  lengthToWorld(length: number): number
  /** Physical extent currently covered, `{ x: [min,max], y: [min,max] }`. */
  readonly extent: { x: readonly [number, number]; y: readonly [number, number] }
}

export interface SceneScaleOptions {
  /** Physical extent to show horizontally. */
  xDomain: readonly [number, number]
  /** Physical extent to show vertically. */
  yDomain: readonly [number, number]
  /** World-space width the view occupies. */
  worldWidth: number
  /** World-space height the view occupies. */
  worldHeight: number
  /**
   * Keep one units-per-world ratio on both axes so a 45° launch looks like 45°
   * and a circle looks round. Default `true`; turn it off only for plots where
   * the axes carry unrelated quantities.
   */
  uniform?: boolean
  /** Where physical (0,0) sits in world space. Default `[0, 0, 0]`. */
  origin?: readonly [number, number, number]
  /** Target number of grid cells across, used to pick `cellUnits`. */
  targetCells?: number
}

/**
 * Build a scene scale. With `uniform` (the default) the tighter of the two
 * axes wins, so the whole declared extent is guaranteed visible and neither
 * axis is secretly stretched.
 */
export function sceneScale(options: SceneScaleOptions): SceneScale {
  const {
    xDomain,
    yDomain,
    worldWidth,
    worldHeight,
    uniform = true,
    origin = [0, 0, 0],
    targetCells = 8
  } = options

  const xSpan = Math.abs(xDomain[1] - xDomain[0]) || 1
  const ySpan = Math.abs(yDomain[1] - yDomain[0]) || 1

  // units-per-world on each axis if each were fitted independently
  const xRatio = xSpan / worldWidth
  const yRatio = ySpan / worldHeight
  const ratio = uniform ? Math.max(xRatio, yRatio) : xRatio

  const xWorldSpan = uniform ? xSpan / ratio : worldWidth
  const yWorldSpan = uniform ? ySpan / ratio : worldHeight

  const [ox, oy, oz] = origin

  const x = linearScale({
    domain: xDomain,
    range: [ox, ox + xWorldSpan]
  })
  const y = linearScale({
    domain: yDomain,
    range: [oy, oy + yWorldSpan]
  })

  const cellUnits = niceStep(Math.max(xSpan, ySpan), targetCells)

  return {
    x,
    y,
    uniform,
    unitsPerWorld: ratio,
    cellUnits,
    cellWorld: cellUnits / ratio,
    toWorld(px, py, pz = 0) {
      return [x.map(px), y.map(py), oz + pz]
    },
    lengthToWorld(length) {
      return length / ratio
    },
    extent: { x: xDomain, y: yDomain }
  }
}

/**
 * Grow a domain to a round number and add headroom, so a view does not have to
 * resize on every animation frame. `[0, 47.3]` becomes `[0, 50]`.
 */
export function padDomain(
  min: number,
  max: number,
  { padFraction = 0.08, snap = true, floorAtZero = false }: { padFraction?: number; snap?: boolean; floorAtZero?: boolean } = {}
): [number, number] {
  let lo = Math.min(min, max)
  let hi = Math.max(min, max)
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1]
  if (lo === hi) {
    const bump = Math.abs(lo) > 0 ? Math.abs(lo) * 0.5 : 0.5
    lo -= bump
    hi += bump
  }
  const pad = (hi - lo) * padFraction
  lo -= pad
  hi += pad
  if (snap) {
    const step = niceStep(hi - lo, 6)
    lo = Math.floor(lo / step) * step
    hi = Math.ceil(hi / step) * step
  }
  // Applied after the snap, so snapping cannot reintroduce a negative bound.
  if (floorAtZero && lo < 0) lo = 0
  return [lo, hi]
}

/** Clamp with a report, for the rare case a clamp is genuinely correct. */
export function clampReport(value: number, min: number, max: number): { value: number; clamped: boolean } {
  if (value < min) return { value: min, clamped: true }
  if (value > max) return { value: max, clamped: true }
  return { value, clamped: false }
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Where `value` sits between `a` and `b`, as a 0..1 fraction. */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0
  return (value - a) / (b - a)
}
