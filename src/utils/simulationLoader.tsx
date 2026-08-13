import type { ComponentType } from 'react'

export type SimulationComponent = ComponentType

const loaders: Record<string, () => Promise<{ default: SimulationComponent }>> = {
  'projectile-motion': () => import('../simulations/physics/projectile-motion/ProjectileMotion'),
  'newtons-second-law': () => import('../simulations/physics/newtons-second-law/NewtonsSecondLaw'),
  collision: () => import('../simulations/physics/collision/CollisionSimulation'),
  gravitation: () => import('../simulations/physics/gravitation/GravitationSimulation'),
  shm: () => import('../simulations/physics/shm/SHMSimulation'),
  'electric-field': () => import('../simulations/physics/electric-field/ElectricFieldSimulation'),
  'ray-optics': () => import('../simulations/physics/ray-optics/RayOpticsSimulation'),
  'atomic-structure': () => import('../simulations/chemistry/atomic-structure/AtomicStructure'),
  'electron-configuration': () => import('../simulations/chemistry/electron-configuration/ElectronConfiguration'),
  'molecular-geometry': () => import('../simulations/chemistry/molecular-geometry/MolecularGeometry'),
  hybridization: () => import('../simulations/chemistry/hybridization/HybridizationSimulation'),
  'gas-laws': () => import('../simulations/chemistry/gas-laws/GasLawsSimulation'),
  titration: () => import('../simulations/chemistry/titration/TitrationExperiment')
}

export function loadSimulationComponent(id: string) {
  return loaders[id] ?? (() => Promise.resolve({ default: () => null }))
}
