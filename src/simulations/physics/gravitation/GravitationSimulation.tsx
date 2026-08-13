import { Canvas } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useMemo, useState } from 'react'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SliderControl } from '../../../components/simulation/SimulationControls'
import { gravitationalForce } from '../../../science/physics/mechanics'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

export default function GravitationSimulation() {
  const [mass1, setMass1] = useState(5.97e24)
  const [mass2, setMass2] = useState(7.35e22)
  const [distance, setDistance] = useState(3.84e8)
  const force = useMemo(() => gravitationalForce(mass1, mass2, distance), [distance, mass1, mass2])
  const separation = Math.min(5.2, Math.max(1.5, distance / 8e7))

  return (
    <SimulationShell
      title="Universal Gravitation"
      subtitle="Physics · Class 11 · Gravitation"
      stage={
        <>
          <Canvas camera={{ position: [0, 1.3, 7], fov: 48 }}>
            <ambientLight intensity={0.55} />
            <pointLight position={[0, 3, 4]} intensity={1.3} />
            <mesh position={[-separation / 2, 0, 0]}>
              <sphereGeometry args={[0.55, 48, 48]} />
              <meshStandardMaterial color="#60a5fa" emissive="#082044" />
            </mesh>
            <mesh position={[separation / 2, 0, 0]}>
              <sphereGeometry args={[0.28, 48, 48]} />
              <meshStandardMaterial color="#d6e4ff" emissive="#2f3146" />
            </mesh>
            <Line points={[[-separation / 2, 0.75, 0], [separation / 2, 0.75, 0]]} color="#7dd3fc" lineWidth={2} />
            <Line points={[[-separation / 2 + 0.25, -0.85, 0], [-0.1, -0.85, 0]]} color="#8ef7c1" lineWidth={3} />
            <Line points={[[separation / 2 - 0.25, -0.85, 0], [0.1, -0.85, 0]]} color="#8ef7c1" lineWidth={3} />
            <OrbitControls enablePan={false} />
          </Canvas>
          <div className="simulation-stage__overlay">
            <span className="chip">F = Gm₁m₂/r²</span>
          </div>
        </>
      }
      controls={
        <>
          <SliderControl label="Mass 1" min={1e22} max={8e24} step={1e22} value={mass1} unit="kg" onChange={setMass1} />
          <SliderControl label="Mass 2" min={1e20} max={1e24} step={1e20} value={mass2} unit="kg" onChange={setMass2} />
          <SliderControl label="Distance" min={1e7} max={8e8} step={1e7} value={distance} unit="m" onChange={setDistance} />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('gravitation')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Gravitational force', value: `${formatNumber(force)} N` },
        { label: 'Mass 1', value: `${formatNumber(mass1)} kg` },
        { label: 'Mass 2', value: `${formatNumber(mass2)} kg` },
        { label: 'Distance', value: `${formatNumber(distance)} m` }
      ]}
    />
  )
}
