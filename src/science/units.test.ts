import { describe, expect, it } from 'vitest'
import {
  clampReport,
  decimalsForStep,
  formatByStep,
  formatQuantity,
  formatScientific,
  inverseLerp,
  lerp,
  linearScale,
  niceStep,
  niceTicks,
  padDomain,
  roundToStep,
  sceneScale,
  toSigFigs,
  trimZeros
} from './units'

describe('linearScale', () => {
  it('maps the domain endpoints onto the range endpoints', () => {
    const s = linearScale({ domain: [0, 100], range: [0, 10] })
    expect(s.map(0)).toBe(0)
    expect(s.map(100)).toBe(10)
    expect(s.map(50)).toBe(5)
  })

  it('extrapolates past the domain by default rather than clamping', () => {
    // A silent clamp is the bug this whole module exists to prevent: the slider
    // moves, the drawing does not, and the student believes the drawing.
    const s = linearScale({ domain: [0, 10], range: [0, 100] })
    expect(s.map(20)).toBe(200)
    expect(s.map(-5)).toBe(-50)
  })

  it('clamps only when explicitly asked, and reports when a value is out of range', () => {
    const s = linearScale({ domain: [0, 10], range: [0, 100], clamp: true })
    expect(s.map(20)).toBe(100)
    expect(s.isOutOfRange(20)).toBe(true)
    expect(s.isOutOfRange(5)).toBe(false)
  })

  it('inverts exactly', () => {
    const s = linearScale({ domain: [-20, 60], range: [12, 480] })
    for (const v of [-20, -3, 0, 17.5, 60]) {
      expect(s.invert(s.map(v))).toBeCloseTo(v, 10)
    }
  })

  it('handles an inverted range, as SVG y-down space needs', () => {
    // Getting this wrong is how the ray-optics sim mirrored every image.
    const s = linearScale({ domain: [0, 10], range: [200, 0] })
    expect(s.map(0)).toBe(200)
    expect(s.map(10)).toBe(0)
    expect(s.map(5)).toBe(100)
  })

  it('reports honest scale factors in both directions', () => {
    const s = linearScale({ domain: [0, 50], range: [0, 10] })
    expect(s.unitsPerOutput).toBeCloseTo(5, 12)
    expect(s.outputPerUnit).toBeCloseTo(0.2, 12)
  })

  it('degrades to the range midpoint for a zero-width domain instead of NaN', () => {
    // Normal transient while a student drags two sliders to the same value.
    const s = linearScale({ domain: [7, 7], range: [0, 100] })
    expect(s.map(7)).toBe(50)
    expect(Number.isFinite(s.map(7))).toBe(true)
  })

  it('returns the range midpoint for non-finite input instead of propagating NaN', () => {
    const s = linearScale({ domain: [0, 10], range: [0, 100] })
    expect(s.map(Number.NaN)).toBe(50)
    expect(s.map(Number.POSITIVE_INFINITY)).toBe(50)
  })
})

describe('niceStep', () => {
  it('chooses 1, 2 or 5 times a power of ten', () => {
    expect(niceStep(100, 5)).toBe(20)
    expect(niceStep(1, 5)).toBe(0.2)
    expect(niceStep(47, 6)).toBe(10)
    expect(niceStep(0.008, 4)).toBe(0.002)
  })

  it('never returns zero, so callers cannot divide by it', () => {
    expect(niceStep(0)).toBe(1)
    expect(niceStep(Number.NaN)).toBe(1)
  })
})

describe('niceTicks', () => {
  it('produces round numbers a student can read off a ruler', () => {
    expect(niceTicks(0, 40.8163, 5)).toEqual([0, 10, 20, 30, 40])
  })

  it('does not leak floating-point dust into labels', () => {
    // The reason a ruler reads "0.3" and not "0.30000000000000004".
    for (const t of niceTicks(0, 1, 10)) {
      expect(String(t).length).toBeLessThanOrEqual(4)
    }
  })

  it('covers negative domains', () => {
    expect(niceTicks(-30, 30, 6)).toEqual([-30, -20, -10, 0, 10, 20, 30])
  })

  it('degenerates safely', () => {
    expect(niceTicks(5, 5)).toEqual([5])
    expect(niceTicks(Number.NaN, 1)).toEqual([])
  })
})

describe('decimalsForStep / formatByStep', () => {
  it('resolves a 0.005 step to three decimals', () => {
    // The old SliderControl did toFixed(step < 1 ? 2 : 0), so the air-resistance
    // slider displayed both 0.005 and 0.015 as "0.01" and looked broken.
    expect(decimalsForStep(0.005)).toBe(3)
    expect(formatByStep(0.005, 0.005)).toBe('0.005')
    expect(formatByStep(0.015, 0.005)).toBe('0.015')
    expect(formatByStep(0.005, 0.005)).not.toBe(formatByStep(0.015, 0.005))
  })

  it('uses no decimals for integer steps', () => {
    expect(decimalsForStep(1)).toBe(0)
    expect(decimalsForStep(5)).toBe(0)
    expect(formatByStep(45, 1)).toBe('45')
  })

  it('handles a 0.1 step', () => {
    expect(decimalsForStep(0.1)).toBe(1)
    expect(formatByStep(9.8, 0.1)).toBe('9.8')
  })
})

describe('roundToStep', () => {
  it('snaps onto the step lattice', () => {
    expect(roundToStep(0.30000000000000004, 0.1)).toBe(0.3)
    expect(roundToStep(17.4, 5)).toBe(15)
    expect(roundToStep(17.6, 5)).toBe(20)
  })
})

describe('toSigFigs', () => {
  it('keeps the requested significant figures', () => {
    expect(toSigFigs(40.816326, 3)).toBe(40.8)
    expect(toSigFigs(0.00123456, 3)).toBe(0.00123)
    expect(toSigFigs(0, 3)).toBe(0)
  })
})

describe('formatScientific', () => {
  it('renders unicode superscripts, not JavaScript exponent syntax', () => {
    // "1.6e-19" is not something a student reads; "1.60 × 10⁻¹⁹" is.
    expect(formatScientific(1.602176634e-19, 3)).toBe('1.6 × 10⁻¹⁹')
    expect(formatScientific(6.022e23, 4)).toBe('6.022 × 10²³')
  })

  it('drops the exponent when it is zero', () => {
    expect(formatScientific(4.5, 2)).toBe('4.5')
  })

  it('handles zero and non-finite input', () => {
    expect(formatScientific(0)).toBe('0')
    expect(formatScientific(Number.NaN)).toBe('—')
  })
})

describe('formatQuantity', () => {
  it('attaches units', () => {
    expect(formatQuantity(40.8163, 'm', { sigFigs: 4 })).toBe('40.82 m')
  })

  it('switches to scientific notation for very small magnitudes', () => {
    expect(formatQuantity(1.6e-19, 'C')).toBe('1.6 × 10⁻¹⁹ C')
  })

  it('shows an em dash rather than NaN', () => {
    expect(formatQuantity(Number.NaN, 'm')).toBe('— m')
    expect(formatQuantity(Number.POSITIVE_INFINITY, 'm/s')).toBe('— m/s')
  })

  it('renders exact zero without an exponent', () => {
    expect(formatQuantity(0, 'N')).toBe('0 N')
  })

  it('applies SI prefixes on request', () => {
    expect(formatQuantity(2500, 'N', { prefix: true, sigFigs: 3 })).toBe('2.5 kN')
  })
})

describe('trimZeros', () => {
  it('drops trailing zeros', () => {
    expect(trimZeros(2.5)).toBe('2.5')
    expect(trimZeros(3)).toBe('3')
    expect(trimZeros(0.1 + 0.2)).toBe('0.3')
  })
})

describe('sceneScale', () => {
  it('keeps one units-per-world ratio on both axes so angles stay true', () => {
    // A 45° launch must look like 45°. Independent per-axis fitting is what made
    // the projectile arc lie about its own angle.
    const s = sceneScale({ xDomain: [0, 100], yDomain: [0, 25], worldWidth: 10, worldHeight: 5 })
    expect(s.uniform).toBe(true)
    expect(s.x.outputPerUnit).toBeCloseTo(s.y.outputPerUnit, 12)
  })

  it('fits the whole declared extent — the tighter axis wins', () => {
    const s = sceneScale({ xDomain: [0, 100], yDomain: [0, 25], worldWidth: 10, worldHeight: 5 })
    // x needs 100/10 = 10 units per world unit; y needs 25/5 = 5. x is tighter.
    expect(s.unitsPerWorld).toBeCloseTo(10, 12)
    expect(s.x.map(100)).toBeCloseTo(10, 12)
    // y then occupies only half its available height, which is correct: it must
    // not be stretched to fill the box.
    expect(s.y.map(25)).toBeCloseTo(2.5, 12)
  })

  it('makes doubling a physical extent actually change the drawing', () => {
    // The projectile sim divided by an auto-normalising `scale`, so a 20 m/s and a
    // 60 m/s launch drew the identical arc. A fixed domain must not do that.
    const near = sceneScale({ xDomain: [0, 40], yDomain: [0, 20], worldWidth: 10, worldHeight: 5 })
    const far = sceneScale({ xDomain: [0, 120], yDomain: [0, 20], worldWidth: 10, worldHeight: 5 })
    expect(near.x.map(40)).toBeGreaterThan(far.x.map(40))
  })

  it('reports a round-numbered grid cell size in physical units', () => {
    const s = sceneScale({ xDomain: [0, 100], yDomain: [0, 25], worldWidth: 10, worldHeight: 5, targetCells: 10 })
    expect(s.cellUnits).toBe(10)
    // ...and the same spacing in world units, so the grid and its label agree.
    expect(s.cellWorld).toBeCloseTo(s.cellUnits / s.unitsPerWorld, 12)
  })

  it('converts a physical length to a world length consistently with toWorld', () => {
    const s = sceneScale({ xDomain: [0, 50], yDomain: [0, 50], worldWidth: 10, worldHeight: 10 })
    const [x0] = s.toWorld(10, 0)
    const [x1] = s.toWorld(20, 0)
    expect(s.lengthToWorld(10)).toBeCloseTo(x1 - x0, 12)
  })

  it('honours a non-zero origin', () => {
    const s = sceneScale({
      xDomain: [0, 10],
      yDomain: [0, 10],
      worldWidth: 4,
      worldHeight: 4,
      origin: [-2, -1.5, 0]
    })
    expect(s.toWorld(0, 0)).toEqual([-2, -1.5, 0])
  })
})

describe('padDomain', () => {
  it('snaps to a round number with headroom', () => {
    const [lo, hi] = padDomain(0, 47.3)
    expect(hi).toBeGreaterThanOrEqual(47.3)
    expect(hi % 10).toBeCloseTo(0, 10)
    expect(lo % 10).toBeCloseTo(0, 10)
  })

  it('pads symmetrically by default, including below zero', () => {
    // Deliberate: padDomain is generic, so it does not assume zero is a floor.
    // Callers plotting a non-negative quantity pass floorAtZero.
    const [lo] = padDomain(0, 47.3)
    expect(lo).toBeLessThan(0)
    const [flooredLo] = padDomain(0, 47.3, { floorAtZero: true })
    expect(flooredLo).toBe(0)
  })

  it('expands a degenerate span instead of returning a zero-width domain', () => {
    const [lo, hi] = padDomain(5, 5)
    expect(hi).toBeGreaterThan(lo)
  })

  it('can floor at zero so a height axis does not dip below ground', () => {
    const [lo] = padDomain(2, 20, { floorAtZero: true })
    expect(lo).toBe(0)
  })

  it('survives non-finite input', () => {
    expect(padDomain(Number.NaN, 1)).toEqual([0, 1])
  })
})

describe('clampReport', () => {
  it('says when it clamped', () => {
    expect(clampReport(15, 0, 10)).toEqual({ value: 10, clamped: true })
    expect(clampReport(-1, 0, 10)).toEqual({ value: 0, clamped: true })
    expect(clampReport(5, 0, 10)).toEqual({ value: 5, clamped: false })
  })
})

describe('lerp / inverseLerp', () => {
  it('round-trips', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5)
    expect(inverseLerp(10, 20, 12.5)).toBe(0.25)
  })

  it('does not divide by zero', () => {
    expect(inverseLerp(5, 5, 5)).toBe(0)
  })
})
