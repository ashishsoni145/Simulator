export interface ProjectileParams {
  speed: number
  angleDeg: number
  gravity: number
  height: number
  dragCoefficient: number
}

export interface ProjectileSample {
  time: number
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
}

export interface ProjectileResult {
  samples: ProjectileSample[]
  range: number
  maxHeight: number
  flightTime: number
  finalSpeed: number
}

export function solveProjectile(params: ProjectileParams): ProjectileResult {
  const dt = 0.02
  const angle = (params.angleDeg * Math.PI) / 180
  let x = 0
  let y = params.height
  let vx = params.speed * Math.cos(angle)
  let vy = params.speed * Math.sin(angle)
  let time = 0
  let maxHeight = y
  const samples: ProjectileSample[] = []

  for (let step = 0; step < 8000; step += 1) {
    const speed = Math.hypot(vx, vy)
    const dragX = -params.dragCoefficient * speed * vx
    const dragY = -params.dragCoefficient * speed * vy
    const ax = dragX
    const ay = -params.gravity + dragY

    samples.push({ time, x, y, vx, vy, ax, ay })
    maxHeight = Math.max(maxHeight, y)

    vx += ax * dt
    vy += ay * dt
    x += vx * dt
    y += vy * dt
    time += dt

    if (time > 0.05 && y <= 0) {
      samples.push({ time, x, y: 0, vx, vy, ax, ay })
      break
    }
  }

  const last = samples[samples.length - 1]
  return {
    samples,
    range: Math.max(0, last?.x ?? 0),
    maxHeight,
    flightTime: last?.time ?? 0,
    finalSpeed: Math.hypot(last?.vx ?? 0, last?.vy ?? 0)
  }
}

export function projectileAt(result: ProjectileResult, time: number): ProjectileSample {
  if (result.samples.length === 0) {
    return { time: 0, x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0 }
  }
  const clamped = Math.max(0, Math.min(time, result.flightTime))
  return (
    result.samples.find((sample) => sample.time >= clamped) ??
    result.samples[result.samples.length - 1]
  )
}
