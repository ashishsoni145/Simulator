import { DEG, RAD } from '../constants'

/**
 * Projectile motion.
 *
 * Two solvers live here and the result says which one ran. Without air
 * resistance the motion has an exact closed form, so the numbers come from
 * algebra and are correct to the last digit a student can read. With drag there
 * is no closed form, so the trajectory is integrated with RK4 — and in that case
 * the closed-form analytics are still returned but flagged `valid: false`, so a
 * UI can grey them out rather than quoting a formula that no longer applies.
 *
 * Sign conventions: x grows downrange, y grows upward, y = 0 is the ground, and
 * the launch point sits at (0, `height`).
 */

export interface ProjectileParams {
  /** Launch speed u, in m/s. */
  speed: number
  /** Launch angle above the horizontal, in degrees. The full 0–90 range is valid. */
  angleDeg: number
  /** Gravitational acceleration g, in m/s². */
  gravity: number
  /** Launch height above the ground, in metres. */
  height: number
  /**
   * Quadratic drag constant k, in 1/m, entering the equation of motion as
   * a_drag = −k·|v|·v. Zero selects the exact analytic solution.
   */
  dragCoefficient: number
  /** Projectile mass in kg, used only for the energy figures. Default 1. */
  mass?: number
}

export interface ProjectileSample {
  /** Seconds since launch. */
  time: number
  /** Downrange distance in metres. */
  x: number
  /** Height above the ground in metres. */
  y: number
  /** Horizontal velocity component, m/s. */
  vx: number
  /** Vertical velocity component, m/s — positive upward. */
  vy: number
  /** Horizontal acceleration component, m/s². Zero unless drag is active. */
  ax: number
  /** Vertical acceleration component, m/s². */
  ay: number
  /** Speed |v|, m/s. */
  speed: number
  /** Kinetic energy ½mv², in joules. */
  kineticEnergy: number
  /** Gravitational potential energy mgy relative to the ground, in joules. */
  potentialEnergy: number
  /** Total mechanical energy — constant when drag is off. */
  totalEnergy: number
}

/** A labelled instant a UI can pin a marker and a callout to. */
export interface ProjectileKeyEvent {
  id: 'launch' | 'apex' | 'landing' | 'launch-height'
  label: string
  time: number
  x: number
  y: number
}

/**
 * Closed-form results, computed algebraically rather than read off the samples.
 * `valid` is false when drag is active, in which case these describe the
 * drag-free motion the projectile would have followed.
 */
export interface ProjectileAnalytic {
  valid: boolean
  /** R = vₓ·T. */
  range: number
  /** H = u²sin²θ / 2g — the rise above the LAUNCH POINT, as NCERT defines it. */
  riseAboveLaunch: number
  /** The apex measured from the ground: `height + riseAboveLaunch`. */
  peakHeightAboveGround: number
  /** Total time of flight T, solving h + u sinθ·t − ½gt² = 0. */
  flightTime: number
  /** t = u sinθ / g. */
  timeToApex: number
  /** Downrange distance at the apex. */
  apexX: number
  /** 90° − θ. */
  complementaryAngleDeg: number
  /** Range at the complementary angle — equal to `range` when height is 0. */
  complementaryRange: number
  /** The angle giving maximum range for this speed and launch height. */
  optimumAngleDeg: number
  /** That maximum range. */
  optimumRange: number
}

export interface ProjectileResult {
  /** Parameters after normalisation, with `mass` filled in. */
  params: Required<ProjectileParams>
  samples: ProjectileSample[]
  /** True when drag forced numerical integration. */
  integrated: boolean
  /**
   * Set when the inputs describe motion that never lands — zero or negative
   * gravity. The samples then cover a fixed preview window instead.
   */
  unphysical: boolean
  /** Horizontal distance travelled before hitting the ground, in metres. */
  range: number
  /** Greatest height above the ground reached, in metres. */
  peakHeightAboveGround: number
  /** Greatest height above the LAUNCH POINT, which is NCERT's H. */
  riseAboveLaunch: number
  /** Total time of flight, in seconds. */
  flightTime: number
  /** Time at which the apex occurs, in seconds. */
  timeToApex: number
  /** Downrange distance at the apex, in metres. */
  apexX: number
  /** Speed at the instant of landing, m/s. */
  impactSpeed: number
  /** Angle below the horizontal at landing, in degrees. */
  impactAngleDeg: number
  /** Speed at launch, m/s — equal to `params.speed`. */
  launchSpeed: number
  analytic: ProjectileAnalytic
  keyEvents: ProjectileKeyEvent[]
  /**
   * @deprecated Ambiguous name kept so older call sites keep compiling. It has
   * always meant the peak measured from the ground; prefer
   * `peakHeightAboveGround`, or `riseAboveLaunch` for the textbook H.
   */
  maxHeight: number
  /** @deprecated Use `impactSpeed`. */
  finalSpeed: number
}

function normalise(params: ProjectileParams): Required<ProjectileParams> {
  return {
    speed: Number.isFinite(params.speed) ? Math.max(0, params.speed) : 0,
    angleDeg: Number.isFinite(params.angleDeg) ? Math.min(90, Math.max(0, params.angleDeg)) : 0,
    gravity: Number.isFinite(params.gravity) ? params.gravity : 0,
    height: Number.isFinite(params.height) ? Math.max(0, params.height) : 0,
    dragCoefficient: Number.isFinite(params.dragCoefficient) ? Math.max(0, params.dragCoefficient) : 0,
    mass: params.mass !== undefined && Number.isFinite(params.mass) && params.mass > 0 ? params.mass : 1
  }
}

/**
 * The exact analytic results. Derived, not measured — so a student's hand-worked
 * answer and the number on screen agree to every digit shown.
 */
export function projectileAnalytic(input: ProjectileParams): ProjectileAnalytic {
  const { speed: u, angleDeg, gravity: g, height: h } = normalise(input)
  const theta = angleDeg * DEG
  const vx = u * Math.cos(theta)
  const vy = u * Math.sin(theta)

  if (g <= 0) {
    return {
      valid: false,
      range: Number.POSITIVE_INFINITY,
      riseAboveLaunch: Number.POSITIVE_INFINITY,
      peakHeightAboveGround: Number.POSITIVE_INFINITY,
      flightTime: Number.POSITIVE_INFINITY,
      timeToApex: Number.POSITIVE_INFINITY,
      apexX: Number.POSITIVE_INFINITY,
      complementaryAngleDeg: 90 - angleDeg,
      complementaryRange: Number.POSITIVE_INFINITY,
      optimumAngleDeg: 45,
      optimumRange: Number.POSITIVE_INFINITY
    }
  }

  const timeToApex = vy / g
  const riseAboveLaunch = (vy * vy) / (2 * g)
  const peakHeightAboveGround = h + riseAboveLaunch
  // Positive root of h + vy·t − ½g·t² = 0.
  const flightTime = (vy + Math.sqrt(vy * vy + 2 * g * h)) / g
  const range = vx * flightTime
  const apexX = vx * timeToApex

  // Range at 90° − θ, which equals `range` when h = 0 and differs when it is not.
  const compTheta = (90 - angleDeg) * DEG
  const compVx = u * Math.cos(compTheta)
  const compVy = u * Math.sin(compTheta)
  const compFlight = (compVy + Math.sqrt(compVy * compVy + 2 * g * h)) / g

  // Maximum-range angle: sin²θ = 1 / (2 + 2gh/u²), which gives exactly 45° at
  // h = 0 and flattens as the launch height grows.
  let optimumAngleDeg = 45
  let optimumRange = (u * u) / g
  if (u > 0) {
    const denominator = 2 + (2 * g * h) / (u * u)
    optimumAngleDeg = Math.asin(Math.sqrt(1 / denominator)) * RAD
    optimumRange = (u / g) * Math.sqrt(u * u + 2 * g * h)
  } else {
    optimumRange = 0
  }

  return {
    valid: true,
    range,
    riseAboveLaunch,
    peakHeightAboveGround,
    flightTime,
    timeToApex,
    apexX,
    complementaryAngleDeg: 90 - angleDeg,
    complementaryRange: compVx * compFlight,
    optimumAngleDeg,
    optimumRange
  }
}

function makeSample(
  time: number,
  x: number,
  y: number,
  vx: number,
  vy: number,
  g: number,
  k: number,
  mass: number
): ProjectileSample {
  const speed = Math.hypot(vx, vy)
  const ax = -k * speed * vx
  const ay = -g - k * speed * vy
  const kineticEnergy = 0.5 * mass * speed * speed
  const potentialEnergy = mass * g * y
  return {
    time,
    x,
    y,
    vx,
    vy,
    ax,
    ay,
    speed,
    kineticEnergy,
    potentialEnergy,
    totalEnergy: kineticEnergy + potentialEnergy
  }
}

interface State {
  x: number
  y: number
  vx: number
  vy: number
}

function derivative(s: State, g: number, k: number): State {
  const speed = Math.hypot(s.vx, s.vy)
  return {
    x: s.vx,
    y: s.vy,
    vx: -k * speed * s.vx,
    vy: -g - k * speed * s.vy
  }
}

function rk4Step(s: State, dt: number, g: number, k: number): State {
  const a = derivative(s, g, k)
  const sb: State = { x: s.x + (a.x * dt) / 2, y: s.y + (a.y * dt) / 2, vx: s.vx + (a.vx * dt) / 2, vy: s.vy + (a.vy * dt) / 2 }
  const b = derivative(sb, g, k)
  const sc: State = { x: s.x + (b.x * dt) / 2, y: s.y + (b.y * dt) / 2, vx: s.vx + (b.vx * dt) / 2, vy: s.vy + (b.vy * dt) / 2 }
  const c = derivative(sc, g, k)
  const sd: State = { x: s.x + c.x * dt, y: s.y + c.y * dt, vx: s.vx + c.vx * dt, vy: s.vy + c.vy * dt }
  const d = derivative(sd, g, k)
  return {
    x: s.x + (dt / 6) * (a.x + 2 * b.x + 2 * c.x + d.x),
    y: s.y + (dt / 6) * (a.y + 2 * b.y + 2 * c.y + d.y),
    vx: s.vx + (dt / 6) * (a.vx + 2 * b.vx + 2 * c.vx + d.vx),
    vy: s.vy + (dt / 6) * (a.vy + 2 * b.vy + 2 * c.vy + d.vy)
  }
}

/**
 * Smallest non-negative root of y₀ + v·τ + ½a·τ² = 0 within `[0, limit]`.
 * Used to land the projectile at the exact ground crossing instead of at
 * whichever animation frame happened to overshoot it.
 */
function solveCrossing(y0: number, v: number, a: number, limit: number): number {
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(v) < 1e-12) return limit
    const t = -y0 / v
    return t >= 0 && t <= limit ? t : limit
  }
  const disc = v * v - 2 * a * y0
  if (disc < 0) return limit
  const root = Math.sqrt(disc)
  const t1 = (-v + root) / a
  const t2 = (-v - root) / a
  const candidates = [t1, t2].filter((t) => t >= -1e-9 && t <= limit + 1e-9).sort((p, q) => p - q)
  const chosen = candidates[0]
  return chosen === undefined ? limit : Math.max(0, Math.min(limit, chosen))
}

const TARGET_STEPS = 1400
const MAX_STEPS = 20000

/**
 * Solve the trajectory.
 *
 * With `dragCoefficient` of 0 the samples are evaluated from the closed form, so
 * the drawn arc, the metrics and a hand calculation all agree exactly. With drag
 * the motion is integrated with RK4 at a step size chosen from the expected
 * flight time, so a 60 m/s launch is not integrated as coarsely as a 2 m/s one.
 */
export function solveProjectile(input: ProjectileParams): ProjectileResult {
  const params = normalise(input)
  const { speed: u, angleDeg, gravity: g, height: h, dragCoefficient: k, mass } = params
  const theta = angleDeg * DEG
  const vx0 = u * Math.cos(theta)
  const vy0 = u * Math.sin(theta)
  const analytic = projectileAnalytic(params)

  // Nothing lands without gravity pulling it down. Show a bounded preview and
  // say so, rather than integrating 20 000 steps into empty space.
  if (g <= 0) {
    const previewDuration = 4
    const samples: ProjectileSample[] = []
    const steps = 200
    for (let i = 0; i <= steps; i += 1) {
      const t = (previewDuration * i) / steps
      samples.push(makeSample(t, vx0 * t, h + vy0 * t, vx0, vy0, 0, k, mass))
    }
    const last = samples[samples.length - 1] ?? makeSample(0, 0, h, vx0, vy0, 0, k, mass)
    return {
      params,
      samples,
      integrated: k > 0,
      unphysical: true,
      range: Number.POSITIVE_INFINITY,
      peakHeightAboveGround: Number.POSITIVE_INFINITY,
      riseAboveLaunch: Number.POSITIVE_INFINITY,
      flightTime: Number.POSITIVE_INFINITY,
      timeToApex: Number.POSITIVE_INFINITY,
      apexX: Number.POSITIVE_INFINITY,
      impactSpeed: Number.NaN,
      impactAngleDeg: Number.NaN,
      launchSpeed: u,
      analytic,
      keyEvents: [{ id: 'launch', label: 'Launch', time: 0, x: 0, y: h }],
      maxHeight: Number.POSITIVE_INFINITY,
      finalSpeed: last.speed
    }
  }

  if (k === 0) {
    return solveAnalyticTrajectory(params, analytic)
  }

  // Drag shortens the flight, so the drag-free time is a safe upper bound for
  // picking a step size.
  const dt = Math.max(1e-4, Math.min(0.02, analytic.flightTime / TARGET_STEPS))
  const samples: ProjectileSample[] = []
  let state: State = { x: 0, y: h, vx: vx0, vy: vy0 }
  let time = 0
  samples.push(makeSample(time, state.x, state.y, state.vx, state.vy, g, k, mass))

  let apex = samples[0] as ProjectileSample
  let landed = false

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const previous = state
    const previousTime = time
    const next = rk4Step(state, dt, g, k)
    const nextTime = previousTime + dt

    // Ground crossing: solve the quadratic implied by the state at the start of
    // the step, so x, vx and vy are all interpolated to the true landing instant
    // rather than x being left a whole step past it.
    if (next.y <= 0 && previous.y > 0) {
      const prevAccel = derivative(previous, g, k)
      const tau = solveCrossing(previous.y, previous.vy, prevAccel.vy, dt)
      const landing = rk4Step(previous, tau, g, k)
      samples.push(makeSample(previousTime + tau, landing.x, 0, landing.vx, landing.vy, g, k, mass))
      landed = true
      break
    }

    // Apex: vy changes sign, so interpolate to vy = 0 instead of taking whichever
    // discrete sample happened to be highest. That discretisation error alone
    // reported 10.06 m where the textbook says 10.20 m.
    if (previous.vy > 0 && next.vy <= 0) {
      const prevAccel = derivative(previous, g, k)
      const tau = prevAccel.vy === 0 ? 0 : -previous.vy / prevAccel.vy
      const clampedTau = Math.max(0, Math.min(dt, tau))
      const at = rk4Step(previous, clampedTau, g, k)
      apex = makeSample(previousTime + clampedTau, at.x, at.y, at.vx, at.vy, g, k, mass)
      samples.push(apex)
    }

    state = next
    time = nextTime
    const sample = makeSample(time, state.x, state.y, state.vx, state.vy, g, k, mass)
    samples.push(sample)
    if (sample.y > apex.y) apex = sample
  }

  const last = samples[samples.length - 1] as ProjectileSample
  const launchHeightCrossing = findLaunchHeightCrossing(samples, h)

  return {
    params,
    samples,
    integrated: true,
    unphysical: !landed,
    range: Math.max(0, last.x),
    peakHeightAboveGround: apex.y,
    riseAboveLaunch: Math.max(0, apex.y - h),
    flightTime: last.time,
    timeToApex: apex.time,
    apexX: apex.x,
    impactSpeed: last.speed,
    impactAngleDeg: Math.abs(Math.atan2(last.vy, last.vx) * RAD),
    launchSpeed: u,
    analytic,
    keyEvents: buildKeyEvents(h, apex, last, launchHeightCrossing),
    maxHeight: apex.y,
    finalSpeed: last.speed
  }
}

function solveAnalyticTrajectory(
  params: Required<ProjectileParams>,
  analytic: ProjectileAnalytic
): ProjectileResult {
  const { speed: u, angleDeg, gravity: g, height: h, mass } = params
  const theta = angleDeg * DEG
  const vx = u * Math.cos(theta)
  const vy0 = u * Math.sin(theta)
  const flightTime = analytic.flightTime

  const samples: ProjectileSample[] = []
  const steps = 600

  // A degenerate flight (dropped from ground level at 0°) still needs one sample
  // so downstream code has something to read.
  if (!(flightTime > 0)) {
    samples.push(makeSample(0, 0, h, vx, vy0, g, 0, mass))
  } else {
    for (let i = 0; i <= steps; i += 1) {
      const t = (flightTime * i) / steps
      const y = h + vy0 * t - 0.5 * g * t * t
      samples.push(makeSample(t, vx * t, Math.max(0, y), vx, vy0 - g * t, g, 0, mass))
    }
    // Guarantee the apex is present as an exact sample, so a marker sits on the
    // curve rather than near it.
    const apexTime = analytic.timeToApex
    if (apexTime > 0 && apexTime < flightTime) {
      const insertAt = samples.findIndex((s) => s.time > apexTime)
      const apexSample = makeSample(
        apexTime,
        vx * apexTime,
        analytic.peakHeightAboveGround,
        vx,
        0,
        g,
        0,
        mass
      )
      if (insertAt >= 0) samples.splice(insertAt, 0, apexSample)
      else samples.push(apexSample)
    }
  }

  const last = samples[samples.length - 1] as ProjectileSample
  const apex = makeSample(
    Math.min(analytic.timeToApex, flightTime),
    analytic.apexX,
    Math.max(h, analytic.peakHeightAboveGround),
    vx,
    0,
    g,
    0,
    mass
  )
  const impactVy = vy0 - g * flightTime
  const impactSpeed = Math.hypot(vx, impactVy)

  return {
    params,
    samples,
    integrated: false,
    unphysical: false,
    range: analytic.range,
    peakHeightAboveGround: analytic.peakHeightAboveGround,
    riseAboveLaunch: analytic.riseAboveLaunch,
    flightTime,
    timeToApex: analytic.timeToApex,
    apexX: analytic.apexX,
    impactSpeed,
    impactAngleDeg: Math.abs(Math.atan2(impactVy, vx) * RAD),
    launchSpeed: u,
    analytic,
    keyEvents: buildKeyEvents(h, apex, last, findLaunchHeightCrossing(samples, h)),
    maxHeight: analytic.peakHeightAboveGround,
    finalSpeed: impactSpeed
  }
}

/** The instant the projectile falls back past its own launch height. */
function findLaunchHeightCrossing(samples: ProjectileSample[], height: number): ProjectileSample | null {
  if (height <= 0) return null
  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1]
    const current = samples[i]
    if (!previous || !current) continue
    if (previous.vy <= 0 && previous.y > height && current.y <= height) return current
  }
  return null
}

function buildKeyEvents(
  height: number,
  apex: ProjectileSample,
  last: ProjectileSample,
  launchHeight: ProjectileSample | null
): ProjectileKeyEvent[] {
  const events: ProjectileKeyEvent[] = [{ id: 'launch', label: 'Launch', time: 0, x: 0, y: height }]
  if (apex.time > 0) {
    events.push({ id: 'apex', label: 'Apex — vertical velocity is zero', time: apex.time, x: apex.x, y: apex.y })
  }
  if (launchHeight) {
    events.push({
      id: 'launch-height',
      label: 'Back at launch height — speed equals launch speed',
      time: launchHeight.time,
      x: launchHeight.x,
      y: launchHeight.y
    })
  }
  events.push({ id: 'landing', label: 'Impact', time: last.time, x: last.x, y: last.y })
  return events
}

/**
 * The sample at `time`, interpolated between the two bracketing samples.
 *
 * Binary search rather than the linear scan this replaced: with up to 20 000
 * samples, scanning on every animation frame was the single most expensive thing
 * the projectile view did.
 */
export function projectileAt(result: ProjectileResult, time: number): ProjectileSample {
  const { samples } = result
  if (samples.length === 0) {
    return makeSample(0, 0, 0, 0, 0, 0, 0, 1)
  }
  const first = samples[0] as ProjectileSample
  const last = samples[samples.length - 1] as ProjectileSample
  if (!Number.isFinite(time) || time <= first.time) return first
  if (time >= last.time) return last

  let lo = 0
  let hi = samples.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    const sample = samples[mid] as ProjectileSample
    if (sample.time <= time) lo = mid
    else hi = mid
  }

  const a = samples[lo] as ProjectileSample
  const b = samples[hi] as ProjectileSample
  const span = b.time - a.time
  if (span <= 0) return a
  const t = (time - a.time) / span
  const mix = (p: number, q: number) => p + (q - p) * t
  return {
    time,
    x: mix(a.x, b.x),
    y: mix(a.y, b.y),
    vx: mix(a.vx, b.vx),
    vy: mix(a.vy, b.vy),
    ax: mix(a.ax, b.ax),
    ay: mix(a.ay, b.ay),
    speed: mix(a.speed, b.speed),
    kineticEnergy: mix(a.kineticEnergy, b.kineticEnergy),
    potentialEnergy: mix(a.potentialEnergy, b.potentialEnergy),
    totalEnergy: mix(a.totalEnergy, b.totalEnergy)
  }
}

/** One point of the range-versus-angle curve. */
export interface RangeVsAnglePoint {
  angleDeg: number
  range: number
}

/**
 * Range as a function of launch angle, holding everything else fixed.
 *
 * Plotting this is what turns "45° is best" from a memorised fact into something
 * visible: the curve is a symmetric hump, and reading off 30° and 60° gives the
 * same height on it. Uses the closed form when drag is off and integrates
 * otherwise, so the curve stays honest either way.
 */
export function rangeVsAngle(params: ProjectileParams, steps = 90): RangeVsAnglePoint[] {
  const base = normalise(params)
  const count = Math.max(2, Math.min(360, Math.round(steps)))
  const points: RangeVsAnglePoint[] = []
  for (let i = 0; i <= count; i += 1) {
    const angleDeg = (90 * i) / count
    const candidate = { ...base, angleDeg }
    const range =
      base.dragCoefficient === 0
        ? projectileAnalytic(candidate).range
        : solveProjectile(candidate).range
    points.push({ angleDeg, range: Number.isFinite(range) ? range : 0 })
  }
  return points
}

/**
 * Trajectory polyline in physical coordinates, thinned to at most `maxPoints`.
 * Handy for drawing a ghost of a previous run without carrying 20 000 vertices.
 */
export function trajectoryPolyline(result: ProjectileResult, maxPoints = 160): Array<[number, number]> {
  const { samples } = result
  if (samples.length === 0) return []
  if (samples.length <= maxPoints) return samples.map((s) => [s.x, s.y] as [number, number])
  const stride = (samples.length - 1) / (maxPoints - 1)
  const out: Array<[number, number]> = []
  for (let i = 0; i < maxPoints; i += 1) {
    const sample = samples[Math.round(i * stride)]
    if (sample) out.push([sample.x, sample.y])
  }
  const last = samples[samples.length - 1]
  if (last) out[out.length - 1] = [last.x, last.y]
  return out
}
