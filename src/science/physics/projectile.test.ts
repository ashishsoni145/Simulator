import { describe, expect, it } from 'vitest'
import {
  projectileAnalytic,
  projectileAt,
  rangeVsAngle,
  solveProjectile,
  trajectoryPolyline
} from './projectile'

/** The canonical NCERT worked example: u = 20 m/s, θ = 45°, g = 9.8, launched from the ground. */
const CANONICAL = { speed: 20, angleDeg: 45, gravity: 9.8, height: 0, dragCoefficient: 0 }

describe('projectileAnalytic — closed forms', () => {
  it('matches the textbook numbers for u=20, θ=45°, g=9.8', () => {
    // vₓ = v_y = 20·cos45° = 14.142136 m/s
    // T  = 2·v_y/g = 28.284271/9.8      = 2.886150 s
    // R  = vₓ·T = u²sin(2θ)/g = 400/9.8 = 40.816327 m
    // H  = v_y²/2g = 200/19.6           = 10.204082 m
    const a = projectileAnalytic(CANONICAL)
    expect(a.valid).toBe(true)
    expect(a.flightTime).toBeCloseTo(2.886150, 5)
    expect(a.range).toBeCloseTo(40.816327, 5)
    expect(a.riseAboveLaunch).toBeCloseTo(10.204082, 5)
    expect(a.timeToApex).toBeCloseTo(1.443075, 5)
    expect(a.apexX).toBeCloseTo(20.408163, 5)
  })

  it('separates rise-above-launch from peak-above-ground', () => {
    // The old code initialised maxHeight to the launch height, so its single
    // "Maximum height" metric silently meant height above the GROUND while being
    // compared against the textbook's H, which is the rise above the LAUNCH POINT.
    const a = projectileAnalytic({ ...CANONICAL, height: 25 })
    expect(a.riseAboveLaunch).toBeCloseTo(10.204082, 5)
    expect(a.peakHeightAboveGround).toBeCloseTo(35.204082, 5)
    expect(a.peakHeightAboveGround - a.riseAboveLaunch).toBeCloseTo(25, 10)
  })

  it('gives complementary angles equal range when launched from the ground', () => {
    // R = u²sin(2θ)/g, and sin(2·30°) = sin(2·60°) = sin60°, so 30° and 60° tie.
    const low = projectileAnalytic({ ...CANONICAL, angleDeg: 30 })
    const high = projectileAnalytic({ ...CANONICAL, angleDeg: 60 })
    expect(low.range).toBeCloseTo(high.range, 9)
    // R = u²sin(2θ)/g = 400·sin60°/9.8 = 346.4101615/9.8 = 35.3479757 m
    expect(low.range).toBeCloseTo(35.3479757, 5)
    expect(low.complementaryAngleDeg).toBe(60)
    expect(low.complementaryRange).toBeCloseTo(high.range, 9)
  })

  it('breaks the complementary-angle tie once launched from a height', () => {
    const low = projectileAnalytic({ ...CANONICAL, angleDeg: 30, height: 20 })
    const high = projectileAnalytic({ ...CANONICAL, angleDeg: 60, height: 20 })
    expect(low.range).toBeGreaterThan(high.range)
  })

  it('puts the optimum angle at exactly 45° from ground level', () => {
    expect(projectileAnalytic(CANONICAL).optimumAngleDeg).toBeCloseTo(45, 9)
    expect(projectileAnalytic(CANONICAL).optimumRange).toBeCloseTo(40.816327, 5)
  })

  it('flattens the optimum angle when launched from a height', () => {
    // sin²θ = 1/(2 + 2gh/u²) = 1/2.98 = 0.33557047 → sinθ = 0.57928441
    //      θ = asin(0.57928441) = 35.40023°
    // R_max = (u/g)·√(u² + 2gh) = 2.0408163·√792 = 2.0408163·28.142495 = 57.4337 m
    const a = projectileAnalytic({ ...CANONICAL, height: 20 })
    expect(a.optimumAngleDeg).toBeCloseTo(35.40023, 4)
    expect(a.optimumRange).toBeCloseTo(57.4337, 3)
    expect(a.optimumAngleDeg).toBeLessThan(45)
  })
})

describe('solveProjectile — bugs the old integrator had', () => {
  it('resolves the apex exactly instead of taking the highest discrete sample', () => {
    // The old solver stepped at dt = 0.02 and never interpolated, reporting
    // 10.06 m against the textbook's 10.2041 m — 1.4% low, and visibly wrong
    // next to a hand calculation.
    const r = solveProjectile(CANONICAL)
    expect(r.riseAboveLaunch).toBeCloseTo(10.204082, 5)
    expect(r.peakHeightAboveGround).toBeCloseTo(10.204082, 5)
  })

  it('gets a short flight right', () => {
    // u = 3 m/s at 10° flies for only 0.1063 s. The old ground-crossing guard was
    // `time > 0.05 && y <= 0`, so it could not detect landing until 0.05 s had
    // passed — nearly half this flight — and then only on a 0.02 s grid.
    // v_y = 3·sin10° = 0.5209445, T = 2v_y/g = 0.1063152 s
    // R = u²sin(2θ)/g = 9·sin20°/9.8 = 3.0781813/9.8 = 0.3141001 m
    const r = solveProjectile({ speed: 3, angleDeg: 10, gravity: 9.8, height: 0, dragCoefficient: 0 })
    expect(r.flightTime).toBeCloseTo(0.1063152, 6)
    expect(r.range).toBeCloseTo(0.3141001, 6)
  })

  it('lands at the exact ground crossing, not a step past it', () => {
    // The old code forced y = 0 on the final sample but left x un-interpolated,
    // so the range overshot by up to vₓ·dt ≈ 0.28 m here.
    const r = solveProjectile(CANONICAL)
    expect(r.range).toBeCloseTo(40.816327, 4)
    const last = r.samples[r.samples.length - 1]
    expect(last?.y).toBeCloseTo(0, 9)
    expect(last?.x).toBeCloseTo(40.816327, 4)
  })

  it('accepts the full 0–90° range', () => {
    // The old UI capped its slider at 5–85°, so straight up and flat along the
    // ground — the two cases that make the formula intuitive — were unreachable.
    const vertical = solveProjectile({ ...CANONICAL, angleDeg: 90 })
    expect(vertical.range).toBeCloseTo(0, 6)
    expect(vertical.riseAboveLaunch).toBeCloseTo(20.408163, 4) // u²/2g = 400/19.6

    const flat = solveProjectile({ ...CANONICAL, angleDeg: 0, height: 20 })
    // T = √(2h/g) = √4.0816327 = 2.0203051 s, R = 20·T = 40.406102 m
    expect(flat.flightTime).toBeCloseTo(2.0203051, 5)
    expect(flat.range).toBeCloseTo(40.406102, 4)
  })

  it('makes a faster launch actually travel further', () => {
    // Guards against the auto-normalising scale that made 20 m/s and 60 m/s draw
    // the identical arc: the underlying physics must at least differ.
    const slow = solveProjectile({ ...CANONICAL, speed: 20 })
    const fast = solveProjectile({ ...CANONICAL, speed: 60 })
    expect(fast.range).toBeCloseTo(slow.range * 9, 3) // range scales as u²
  })

  it('reports an impact angle equal to the launch angle for a symmetric flight', () => {
    const r = solveProjectile(CANONICAL)
    expect(r.impactAngleDeg).toBeCloseTo(45, 4)
    expect(r.impactSpeed).toBeCloseTo(20, 4)
  })

  it('steepens the impact angle when launched from a height', () => {
    const r = solveProjectile({ ...CANONICAL, height: 30 })
    expect(r.impactAngleDeg).toBeGreaterThan(45)
    expect(r.impactSpeed).toBeGreaterThan(20)
  })
})

describe('solveProjectile — invariants', () => {
  it('conserves total mechanical energy with no drag', () => {
    const r = solveProjectile({ ...CANONICAL, mass: 2 })
    const total = r.samples.map((s) => s.totalEnergy)
    const first = total[0] as number
    // ½mu² = ½·2·400 = 400 J, all of it kinetic at launch from y = 0.
    expect(first).toBeCloseTo(400, 6)
    for (const e of total) expect(e).toBeCloseTo(first, 6)
  })

  it('trades kinetic for potential energy at the apex', () => {
    const r = solveProjectile({ ...CANONICAL, mass: 2 })
    const apex = projectileAt(r, r.timeToApex)
    // At the apex only the horizontal component survives: ½·2·14.142136² = 200 J
    expect(apex.kineticEnergy).toBeCloseTo(200, 4)
    expect(apex.potentialEnergy).toBeCloseTo(200, 4)
    expect(apex.vy).toBeCloseTo(0, 6)
  })

  it('dissipates energy monotonically once drag is on', () => {
    const r = solveProjectile({ ...CANONICAL, dragCoefficient: 0.02, mass: 1 })
    expect(r.integrated).toBe(true)
    for (let i = 1; i < r.samples.length; i += 1) {
      const previous = r.samples[i - 1]?.totalEnergy ?? 0
      const current = r.samples[i]?.totalEnergy ?? 0
      expect(current).toBeLessThanOrEqual(previous + 1e-6)
    }
  })

  it('makes drag shorten the range and flags the closed forms as inapplicable', () => {
    const dry = solveProjectile(CANONICAL)
    const draggy = solveProjectile({ ...CANONICAL, dragCoefficient: 0.03 })
    expect(draggy.range).toBeLessThan(dry.range)
    expect(draggy.integrated).toBe(true)
    // The analytic block still describes the drag-free motion, so it must say so
    // rather than being quoted next to a trajectory it does not describe.
    expect(draggy.analytic.range).toBeCloseTo(dry.range, 4)
  })

  it('keeps the drag solution close to the analytic one as drag vanishes', () => {
    const dry = solveProjectile(CANONICAL)
    const almostDry = solveProjectile({ ...CANONICAL, dragCoefficient: 1e-7 })
    expect(almostDry.range).toBeCloseTo(dry.range, 2)
    expect(almostDry.riseAboveLaunch).toBeCloseTo(dry.riseAboveLaunch, 3)
  })
})

describe('solveProjectile — degenerate input', () => {
  it('flags zero gravity as unphysical rather than integrating into space', () => {
    const r = solveProjectile({ ...CANONICAL, gravity: 0 })
    expect(r.unphysical).toBe(true)
    expect(r.samples.length).toBeGreaterThan(0)
    expect(r.analytic.valid).toBe(false)
  })

  it('handles a zero-speed drop', () => {
    const r = solveProjectile({ speed: 0, angleDeg: 45, gravity: 9.8, height: 20, dragCoefficient: 0 })
    expect(r.range).toBeCloseTo(0, 9)
    expect(r.flightTime).toBeCloseTo(2.0203051, 5) // √(2·20/9.8)
    expect(r.riseAboveLaunch).toBeCloseTo(0, 9)
  })

  it('survives a fully degenerate launch without producing NaN', () => {
    const r = solveProjectile({ speed: 0, angleDeg: 0, gravity: 9.8, height: 0, dragCoefficient: 0 })
    expect(Number.isFinite(r.range)).toBe(true)
    expect(Number.isFinite(r.flightTime)).toBe(true)
    expect(r.samples.length).toBeGreaterThan(0)
  })

  it('coerces non-finite and out-of-range input instead of propagating it', () => {
    const r = solveProjectile({
      speed: Number.NaN,
      angleDeg: 400,
      gravity: 9.8,
      height: -5,
      dragCoefficient: Number.NaN
    })
    expect(r.params.speed).toBe(0)
    expect(r.params.angleDeg).toBe(90)
    expect(r.params.height).toBe(0)
    expect(r.params.dragCoefficient).toBe(0)
    expect(Number.isFinite(r.range)).toBe(true)
  })
})

describe('projectileAt', () => {
  it('interpolates rather than snapping to the next stored sample', () => {
    const r = solveProjectile(CANONICAL)
    const t = 1.0
    const s = projectileAt(r, t)
    expect(s.time).toBeCloseTo(t, 9)
    // Exact closed form at t = 1: x = 14.142136, y = 14.142136 − 4.9 = 9.242136
    expect(s.x).toBeCloseTo(14.142136, 4)
    expect(s.y).toBeCloseTo(9.242136, 4)
  })

  it('clamps to the endpoints outside the flight', () => {
    const r = solveProjectile(CANONICAL)
    expect(projectileAt(r, -10).time).toBe(0)
    expect(projectileAt(r, 999).time).toBeCloseTo(r.flightTime, 9)
  })

  it('returns finite values for non-finite time', () => {
    const r = solveProjectile(CANONICAL)
    const s = projectileAt(r, Number.NaN)
    expect(Number.isFinite(s.x)).toBe(true)
    expect(Number.isFinite(s.y)).toBe(true)
  })
})

describe('keyEvents', () => {
  it('labels launch, apex and impact', () => {
    const ids = solveProjectile(CANONICAL).keyEvents.map((e) => e.id)
    expect(ids).toContain('launch')
    expect(ids).toContain('apex')
    expect(ids).toContain('landing')
  })

  it('adds the launch-height crossing only when launched from a height', () => {
    expect(solveProjectile(CANONICAL).keyEvents.map((e) => e.id)).not.toContain('launch-height')
    const raised = solveProjectile({ ...CANONICAL, height: 20 })
    expect(raised.keyEvents.map((e) => e.id)).toContain('launch-height')
  })

  it('orders events in time', () => {
    const events = solveProjectile({ ...CANONICAL, height: 20 }).keyEvents
    for (let i = 1; i < events.length; i += 1) {
      expect(events[i]?.time).toBeGreaterThanOrEqual(events[i - 1]?.time ?? 0)
    }
  })
})

describe('rangeVsAngle', () => {
  it('peaks at 45° from ground level', () => {
    const curve = rangeVsAngle(CANONICAL, 90)
    const best = curve.reduce((a, b) => (b.range > a.range ? b : a))
    expect(best.angleDeg).toBeCloseTo(45, 0)
  })

  it('is symmetric about 45°, which is why 30° and 60° tie', () => {
    const curve = rangeVsAngle(CANONICAL, 90)
    const at = (deg: number) => curve.find((p) => Math.abs(p.angleDeg - deg) < 1e-9)?.range ?? Number.NaN
    expect(at(30)).toBeCloseTo(at(60), 6)
    expect(at(20)).toBeCloseTo(at(70), 6)
    expect(at(0)).toBeCloseTo(0, 6)
    expect(at(90)).toBeCloseTo(0, 6)
  })

  it('shifts its peak below 45° when launched from a height', () => {
    const curve = rangeVsAngle({ ...CANONICAL, height: 20 }, 180)
    const best = curve.reduce((a, b) => (b.range > a.range ? b : a))
    expect(best.angleDeg).toBeLessThan(45)
    expect(best.angleDeg).toBeCloseTo(35.4, 0)
  })

  it('stays finite with drag enabled', () => {
    const curve = rangeVsAngle({ ...CANONICAL, dragCoefficient: 0.02 }, 12)
    expect(curve.every((p) => Number.isFinite(p.range))).toBe(true)
    expect(curve.length).toBe(13)
  })
})

describe('trajectoryPolyline', () => {
  it('thins to the requested budget and keeps both endpoints', () => {
    const r = solveProjectile(CANONICAL)
    const line = trajectoryPolyline(r, 40)
    expect(line.length).toBeLessThanOrEqual(40)
    expect(line[0]?.[0]).toBeCloseTo(0, 6)
    expect(line[line.length - 1]?.[0]).toBeCloseTo(r.range, 4)
  })
})
