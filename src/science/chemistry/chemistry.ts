export function atomStats(protons: number, neutrons: number, electrons: number) {
  return {
    atomicNumber: protons,
    massNumber: protons + neutrons,
    charge: protons - electrons,
    isotopeLabel: `${protons + neutrons}/${protons}`
  }
}

const aufbauOrder = [
  { label: '1s', capacity: 2 },
  { label: '2s', capacity: 2 },
  { label: '2p', capacity: 6 },
  { label: '3s', capacity: 2 },
  { label: '3p', capacity: 6 },
  { label: '4s', capacity: 2 },
  { label: '3d', capacity: 10 },
  { label: '4p', capacity: 6 }
] as const

export function electronConfiguration(electrons: number) {
  let remaining = electrons
  return aufbauOrder.map((orbital) => {
    const count = Math.min(remaining, orbital.capacity)
    remaining -= count
    return { ...orbital, electrons: Math.max(0, count) }
  })
}

export type GeometryKind =
  | 'linear'
  | 'bent'
  | 'trigonal-planar'
  | 'tetrahedral'
  | 'trigonal-pyramidal'
  | 'trigonal-bipyramidal'
  | 'octahedral'

export const molecularGeometries: Record<
  GeometryKind,
  { label: string; bondedPairs: number; lonePairs: number; angle: string; points: [number, number, number][] }
> = {
  linear: {
    label: 'Linear',
    bondedPairs: 2,
    lonePairs: 0,
    angle: '180°',
    points: [
      [-1.7, 0, 0],
      [1.7, 0, 0]
    ]
  },
  bent: {
    label: 'Bent',
    bondedPairs: 2,
    lonePairs: 2,
    angle: '~104.5°',
    points: [
      [-1.15, -0.9, 0],
      [1.15, -0.9, 0]
    ]
  },
  'trigonal-planar': {
    label: 'Trigonal planar',
    bondedPairs: 3,
    lonePairs: 0,
    angle: '120°',
    points: [
      [0, 1.55, 0],
      [-1.35, -0.8, 0],
      [1.35, -0.8, 0]
    ]
  },
  tetrahedral: {
    label: 'Tetrahedral',
    bondedPairs: 4,
    lonePairs: 0,
    angle: '109.5°',
    points: [
      [1, 1, 1],
      [-1, -1, 1],
      [-1, 1, -1],
      [1, -1, -1]
    ]
  },
  'trigonal-pyramidal': {
    label: 'Trigonal pyramidal',
    bondedPairs: 3,
    lonePairs: 1,
    angle: '~107°',
    points: [
      [1.2, -0.7, 0.65],
      [-1.2, -0.7, 0.65],
      [0, -0.7, -1.3]
    ]
  },
  'trigonal-bipyramidal': {
    label: 'Trigonal bipyramidal',
    bondedPairs: 5,
    lonePairs: 0,
    angle: '90° / 120°',
    points: [
      [0, 1.8, 0],
      [0, -1.8, 0],
      [1.55, 0, 0],
      [-0.78, 0, 1.35],
      [-0.78, 0, -1.35]
    ]
  },
  octahedral: {
    label: 'Octahedral',
    bondedPairs: 6,
    lonePairs: 0,
    angle: '90°',
    points: [
      [1.6, 0, 0],
      [-1.6, 0, 0],
      [0, 1.6, 0],
      [0, -1.6, 0],
      [0, 0, 1.6],
      [0, 0, -1.6]
    ]
  }
}

export type HybridizationKind = 'sp' | 'sp2' | 'sp3'

export const hybridizations: Record<HybridizationKind, { label: string; angle: string; points: [number, number, number][] }> = {
  sp: {
    label: 'sp',
    angle: '180°',
    points: [
      [-1.8, 0, 0],
      [1.8, 0, 0]
    ]
  },
  sp2: {
    label: 'sp²',
    angle: '120°',
    points: [
      [0, 1.7, 0],
      [-1.47, -0.85, 0],
      [1.47, -0.85, 0]
    ]
  },
  sp3: {
    label: 'sp³',
    angle: '109.5°',
    points: [
      [1, 1, 1],
      [-1, -1, 1],
      [-1, 1, -1],
      [1, -1, -1]
    ]
  }
}

export function idealGasPressure(particles: number, temperatureKelvin: number, volumeLitres: number) {
  const gasConstant = 0.082057
  const moles = particles / 6.022e23
  return (moles * gasConstant * temperatureKelvin) / Math.max(volumeLitres, 0.001)
}

export function strongAcidStrongBasePh(acidMolarity: number, acidVolumeMl: number, baseMolarity: number, baseVolumeMl: number) {
  const acidMoles = acidMolarity * (acidVolumeMl / 1000)
  const baseMoles = baseMolarity * (baseVolumeMl / 1000)
  const totalVolumeL = (acidVolumeMl + baseVolumeMl) / 1000
  const excessAcid = acidMoles - baseMoles
  if (Math.abs(excessAcid) < 1e-8) return 7
  if (excessAcid > 0) return -Math.log10(excessAcid / totalVolumeL)
  const poh = -Math.log10(Math.abs(excessAcid) / totalVolumeL)
  return 14 - poh
}
