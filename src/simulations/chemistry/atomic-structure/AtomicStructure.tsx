import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SliderControl } from '../../../components/simulation/SimulationControls'
import { atomStats } from '../../../science/chemistry/chemistry'
import { progressStore } from '../../../state/progressStore'

function AtomScene({ protons, neutrons, electrons }: { protons: number; neutrons: number; electrons: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.22
  })
  const electronItems = Array.from({ length: electrons }, (_, index) => index)
  const nucleusItems = Array.from({ length: Math.min(protons + neutrons, 36) }, (_, index) => index)
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 4, 5]} intensity={1.2} />
      <group ref={group}>
        {nucleusItems.map((item) => {
          const angle = item * 2.399
          const radius = 0.1 + (item % 5) * 0.075
          return (
            <mesh key={item} position={[Math.cos(angle) * radius, Math.sin(angle * 1.7) * radius, Math.sin(angle) * radius]}>
              <sphereGeometry args={[0.09, 20, 20]} />
              <meshStandardMaterial color={item % 2 === 0 ? '#fb7185' : '#a78bfa'} />
            </mesh>
          )
        })}
        {electronItems.map((item) => {
          const shell = item < 2 ? 1.05 : item < 10 ? 1.7 : 2.35
          const angle = (item / Math.max(electrons, 1)) * Math.PI * 2
          const tilt = item % 3
          return (
            <mesh key={item} position={[Math.cos(angle) * shell, Math.sin(angle) * shell * (tilt === 0 ? 0.2 : 0.7), Math.sin(angle) * shell * (tilt === 0 ? 1 : 0.35)]}>
              <sphereGeometry args={[0.055, 16, 16]} />
              <meshStandardMaterial color="#7dd3fc" emissive="#0f5f83" />
            </mesh>
          )
        })}
      </group>
      <OrbitControls enablePan={false} />
    </>
  )
}

export default function AtomicStructure() {
  const [protons, setProtons] = useState(6)
  const [neutrons, setNeutrons] = useState(6)
  const [electrons, setElectrons] = useState(6)
  const stats = useMemo(() => atomStats(protons, neutrons, electrons), [electrons, neutrons, protons])

  return (
    <SimulationShell
      title="Atomic Structure"
      subtitle="Chemistry · Class 11 · Structure of Atom"
      stage={<Canvas camera={{ position: [0, 1.2, 5.5], fov: 48 }}><AtomScene electrons={electrons} neutrons={neutrons} protons={protons} /></Canvas>}
      controls={
        <>
          <SliderControl label="Protons" min={1} max={20} step={1} value={protons} onChange={setProtons} />
          <SliderControl label="Neutrons" min={0} max={24} step={1} value={neutrons} onChange={setNeutrons} />
          <SliderControl label="Electrons" min={1} max={20} step={1} value={electrons} onChange={setElectrons} />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('atomic-structure')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Atomic number', value: String(stats.atomicNumber) },
        { label: 'Mass number', value: String(stats.massNumber) },
        { label: 'Net charge', value: `${stats.charge > 0 ? '+' : ''}${stats.charge}` },
        { label: 'Isotope notation', value: stats.isotopeLabel }
      ]}
    />
  )
}
