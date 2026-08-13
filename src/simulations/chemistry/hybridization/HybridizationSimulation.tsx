import { Canvas } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useState } from 'react'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SelectControl } from '../../../components/simulation/SimulationControls'
import { type HybridizationKind, hybridizations } from '../../../science/chemistry/chemistry'
import { progressStore } from '../../../state/progressStore'

function HybridScene({ kind }: { kind: HybridizationKind }) {
  const hybrid = hybridizations[kind]
  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 5, 4]} intensity={1.1} />
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {hybrid.points.map((point, index) => (
        <group key={index}>
          <Line points={[[0, 0, 0], point]} color="#91a3b8" lineWidth={1.5} />
          <mesh position={[point[0] * 0.5, point[1] * 0.5, point[2] * 0.5]} scale={[0.34, 0.34, 0.82]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#7dd3fc' : '#a78bfa'} transparent opacity={0.68} />
          </mesh>
        </group>
      ))}
      <OrbitControls enablePan={false} />
    </>
  )
}

export default function HybridizationSimulation() {
  const [kind, setKind] = useState<HybridizationKind>('sp3')
  const hybrid = hybridizations[kind]
  return (
    <SimulationShell
      title="Hybridization"
      subtitle="Chemistry · Class 11 · Chemical Bonding"
      stage={<Canvas camera={{ position: [0, 1.2, 5.6], fov: 48 }}><HybridScene kind={kind} /></Canvas>}
      controls={
        <>
          <SelectControl
            label="Hybridization"
            value={kind}
            onChange={setKind}
            options={(Object.keys(hybridizations) as HybridizationKind[]).map((key) => ({ value: key, label: hybridizations[key].label }))}
          />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('hybridization')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Hybridization', value: hybrid.label },
        { label: 'Geometry angle', value: hybrid.angle },
        { label: 'Hybrid orbitals', value: String(hybrid.points.length) }
      ]}
    />
  )
}
