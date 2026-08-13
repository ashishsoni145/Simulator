import { Canvas } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useState } from 'react'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SelectControl } from '../../../components/simulation/SimulationControls'
import { type GeometryKind, molecularGeometries } from '../../../science/chemistry/chemistry'
import { progressStore } from '../../../state/progressStore'

function MoleculeScene({ geometryKind }: { geometryKind: GeometryKind }) {
  const geometry = molecularGeometries[geometryKind]
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[4, 5, 5]} intensity={1.3} />
      <mesh>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#a78bfa" emissive="#20114d" />
      </mesh>
      {geometry.points.map((point, index) => (
        <group key={index}>
          <Line points={[[0, 0, 0], point]} color="#7dd3fc" lineWidth={3} />
          <mesh position={point}>
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshStandardMaterial color="#8ef7c1" />
          </mesh>
        </group>
      ))}
      {Array.from({ length: geometry.lonePairs }, (_, index) => (
        <mesh key={`lp-${index}`} position={[Math.cos(index * 2.1) * 0.9, 0.75, Math.sin(index * 2.1) * 0.9]}>
          <sphereGeometry args={[0.12, 20, 20]} />
          <meshStandardMaterial color="#facc15" transparent opacity={0.72} />
        </mesh>
      ))}
      <OrbitControls enablePan={false} />
    </>
  )
}

export default function MolecularGeometry() {
  const [geometryKind, setGeometryKind] = useState<GeometryKind>('tetrahedral')
  const geometry = molecularGeometries[geometryKind]

  return (
    <SimulationShell
      title="Molecular Geometry"
      subtitle="Chemistry · Class 11 · VSEPR"
      stage={<Canvas camera={{ position: [0, 1.2, 5.8], fov: 48 }}><MoleculeScene geometryKind={geometryKind} /></Canvas>}
      controls={
        <>
          <SelectControl
            label="Geometry"
            value={geometryKind}
            onChange={setGeometryKind}
            options={(Object.keys(molecularGeometries) as GeometryKind[]).map((key) => ({ value: key, label: molecularGeometries[key].label }))}
          />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('molecular-geometry')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Bonded pairs', value: String(geometry.bondedPairs) },
        { label: 'Lone pairs', value: String(geometry.lonePairs) },
        { label: 'Bond angle', value: geometry.angle },
        { label: 'Shape', value: geometry.label }
      ]}
    />
  )
}
