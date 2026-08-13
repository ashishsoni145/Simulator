import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useState } from 'react'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SelectControl, SliderControl } from '../../../components/simulation/SimulationControls'
import { type CollisionType, solveCollision } from '../../../science/physics/mechanics'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

function CollisionScene({ v1After, v2After }: { v1After: number; v2After: number }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 4, 4]} intensity={1} />
      <gridHelper args={[8, 8, '#27445e', '#132235']} position={[0, -0.8, 0]} />
      <mesh position={[-1.2, 0, 0]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color="#7dd3fc" />
      </mesh>
      <mesh position={[1.2, 0, 0]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color="#a78bfa" />
      </mesh>
      <mesh position={[-1.2 + Math.sign(v1After) * 0.9, 0.7, 0]}>
        <coneGeometry args={[0.12, 0.4, 20]} />
        <meshStandardMaterial color="#8ef7c1" />
      </mesh>
      <mesh position={[1.2 + Math.sign(v2After) * 0.9, 0.7, 0]}>
        <coneGeometry args={[0.12, 0.4, 20]} />
        <meshStandardMaterial color="#8ef7c1" />
      </mesh>
      <OrbitControls enablePan={false} enableZoom={false} />
    </>
  )
}

export default function CollisionSimulation() {
  const [mass1, setMass1] = useState(2)
  const [mass2, setMass2] = useState(3)
  const [velocity1, setVelocity1] = useState(4)
  const [velocity2, setVelocity2] = useState(-2)
  const [type, setType] = useState<CollisionType>('elastic')
  const result = useMemo(() => solveCollision(mass1, velocity1, mass2, velocity2, type), [mass1, mass2, type, velocity1, velocity2])

  return (
    <SimulationShell
      title="Collision Laboratory"
      subtitle="Physics · Class 11 · Momentum"
      stage={<Canvas camera={{ position: [0, 2.2, 5.8], fov: 48 }}><CollisionScene v1After={result.v1After} v2After={result.v2After} /></Canvas>}
      controls={
        <>
          <SelectControl
            label="Collision type"
            value={type}
            onChange={setType}
            options={[
              { label: 'Elastic', value: 'elastic' },
              { label: 'Perfectly inelastic', value: 'perfectly-inelastic' }
            ]}
          />
          <div className="control-grid">
            <SliderControl label="Mass 1" min={0.5} max={20} step={0.5} value={mass1} unit="kg" onChange={setMass1} />
            <SliderControl label="Mass 2" min={0.5} max={20} step={0.5} value={mass2} unit="kg" onChange={setMass2} />
            <SliderControl label="Velocity 1" min={-10} max={10} step={0.5} value={velocity1} unit="m/s" onChange={setVelocity1} />
            <SliderControl label="Velocity 2" min={-10} max={10} step={0.5} value={velocity2} unit="m/s" onChange={setVelocity2} />
          </div>
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('collision')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Momentum before', value: `${formatNumber(result.momentumBefore)} kg·m/s` },
        { label: 'Momentum after', value: `${formatNumber(result.momentumAfter)} kg·m/s` },
        { label: 'Object 1 after', value: `${formatNumber(result.v1After)} m/s` },
        { label: 'Object 2 after', value: `${formatNumber(result.v2After)} m/s` },
        { label: 'Energy change', value: `${formatNumber(result.kineticAfter - result.kineticBefore)} J` }
      ]}
    />
  )
}
