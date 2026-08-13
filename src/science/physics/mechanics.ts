export function newtonsSecondLaw(mass: number, appliedForce: number, friction: number) {
  const netForce = appliedForce - friction
  const acceleration = mass > 0 ? netForce / mass : 0
  return { netForce, acceleration }
}

export type CollisionType = 'elastic' | 'perfectly-inelastic'

export function solveCollision(
  mass1: number,
  velocity1: number,
  mass2: number,
  velocity2: number,
  type: CollisionType
) {
  const momentumBefore = mass1 * velocity1 + mass2 * velocity2
  if (type === 'perfectly-inelastic') {
    const sharedVelocity = momentumBefore / (mass1 + mass2)
    return {
      v1After: sharedVelocity,
      v2After: sharedVelocity,
      momentumBefore,
      momentumAfter: (mass1 + mass2) * sharedVelocity,
      kineticBefore: 0.5 * mass1 * velocity1 ** 2 + 0.5 * mass2 * velocity2 ** 2,
      kineticAfter: 0.5 * (mass1 + mass2) * sharedVelocity ** 2
    }
  }

  const v1After =
    ((mass1 - mass2) / (mass1 + mass2)) * velocity1 +
    ((2 * mass2) / (mass1 + mass2)) * velocity2
  const v2After =
    ((2 * mass1) / (mass1 + mass2)) * velocity1 +
    ((mass2 - mass1) / (mass1 + mass2)) * velocity2

  return {
    v1After,
    v2After,
    momentumBefore,
    momentumAfter: mass1 * v1After + mass2 * v2After,
    kineticBefore: 0.5 * mass1 * velocity1 ** 2 + 0.5 * mass2 * velocity2 ** 2,
    kineticAfter: 0.5 * mass1 * v1After ** 2 + 0.5 * mass2 * v2After ** 2
  }
}

export function gravitationalForce(mass1: number, mass2: number, distance: number) {
  const gravitationalConstant = 6.6743e-11
  return (gravitationalConstant * mass1 * mass2) / distance ** 2
}

export interface ShmParams {
  mass: number
  springConstant: number
  amplitude: number
  time: number
}

export function solveShm({ mass, springConstant, amplitude, time }: ShmParams) {
  const omega = Math.sqrt(springConstant / mass)
  const position = amplitude * Math.cos(omega * time)
  const velocity = -amplitude * omega * Math.sin(omega * time)
  const acceleration = -(omega ** 2) * position
  const kineticEnergy = 0.5 * mass * velocity ** 2
  const potentialEnergy = 0.5 * springConstant * position ** 2
  return {
    omega,
    period: (2 * Math.PI) / omega,
    position,
    velocity,
    acceleration,
    kineticEnergy,
    potentialEnergy,
    totalEnergy: kineticEnergy + potentialEnergy
  }
}

export function thinLens(objectDistance: number, focalLength: number) {
  const denominator = 1 / focalLength - 1 / objectDistance
  const imageDistance = Math.abs(denominator) < 1e-6 ? Number.POSITIVE_INFINITY : 1 / denominator
  const magnification = Number.isFinite(imageDistance) ? -imageDistance / objectDistance : Number.POSITIVE_INFINITY
  return {
    imageDistance,
    magnification,
    orientation: magnification < 0 ? 'inverted' : 'upright',
    imageType: imageDistance > 0 ? 'real' : 'virtual'
  }
}

export interface Charge {
  id: string
  q: number
  x: number
  y: number
}

export function electricFieldAt(charges: Charge[], x: number, y: number) {
  const k = 8.9875517923e9
  return charges.reduce(
    (field, charge) => {
      const dx = x - charge.x
      const dy = y - charge.y
      const r2 = Math.max(dx * dx + dy * dy, 0.06)
      const r = Math.sqrt(r2)
      const magnitude = (k * charge.q) / r2
      return {
        ex: field.ex + (magnitude * dx) / r,
        ey: field.ey + (magnitude * dy) / r
      }
    },
    { ex: 0, ey: 0 }
  )
}
