import type { ComponentType } from 'react'

export interface GalaxyProps {
  mouseRepulsion?: boolean
  mouseInteraction?: boolean
  density?: number
  glowIntensity?: number
  saturation?: number
  hueShift?: number
  starSpeed?: number
  twinkleIntensity?: number
  rotationSpeed?: number
  transparent?: boolean
}

declare const Galaxy: ComponentType<GalaxyProps>
export default Galaxy
