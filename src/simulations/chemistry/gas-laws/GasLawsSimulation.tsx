import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SliderControl } from '../../../components/simulation/SimulationControls'
import SimulationGraph from '../../../components/simulation/SimulationGraph'
import { idealGasPressure } from '../../../science/chemistry/chemistry'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

function Particles({ count, temperature, volume }: { count: number; temperature: number; volume: number }) {
  const group = useRef<THREE.Group>(null)
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        position: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3),
        velocity: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
      })),
    [count]
  )
  const half = Math.max(0.9, Math.cbrt(volume / 10))

  useFrame((_, delta) => {
    const speed = Math.sqrt(temperature / 300) * 1.5
    particles.forEach((particle, index) => {
      particle.position.addScaledVector(particle.velocity, delta * speed)
      ;(['x', 'y', 'z'] as const).forEach((axis) => {
        if (Math.abs(particle.position[axis]) > half) {
          particle.position[axis] = Math.sign(particle.position[axis]) * half
          particle.velocity[axis] *= -1
        }
      })
      const child = group.current?.children[index]
      if (child) child.position.copy(particle.position)
    })
  })

  return (
    <group ref={group}>
      {particles.map((particle) => (
        <mesh key={particle.id} position={particle.position}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#0d405b" />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[half * 2, half * 2, half * 2]} />
        <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

export default function GasLawsSimulation() {
  const [temperature, setTemperature] = useState(300)
  const [volume, setVolume] = useState(24)
  const [particleCount, setParticleCount] = useState(42)
  const pressure = idealGasPressure(particleCount * 1e22, temperature, volume)
  const graph = useMemo(
    () =>
      Array.from({ length: 60 }, (_, index) => {
        const graphVolume = 5 + index * 0.75
        return { x: graphVolume, y: idealGasPressure(particleCount * 1e22, temperature, graphVolume) }
      }),
    [particleCount, temperature]
  )

  return (
    <SimulationShell
      title="Gas Laws Particle Box"
      subtitle="Chemistry · Class 11 · Gas Laws"
      stage={<Canvas camera={{ position: [0, 1.5, 5.5], fov: 50 }}><ambientLight intensity={0.65} /><pointLight position={[3, 4, 5]} intensity={1.2} /><Particles count={particleCount} temperature={temperature} volume={volume} /><OrbitControls enablePan={false} /></Canvas>}
      controls={
        <>
          <SliderControl label="Temperature" min={120} max={800} step={5} value={temperature} unit="K" onChange={setTemperature} />
          <SliderControl label="Volume" min={5} max={50} step={0.5} value={volume} unit="L" onChange={setVolume} />
          <SliderControl label="Particles" min={10} max={100} step={1} value={particleCount} onChange={setParticleCount} />
          <SimulationGraph label="Pressure vs volume" points={graph} color="#8ef7c1" />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('gas-laws')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Pressure', value: `${formatNumber(pressure)} atm` },
        { label: 'Temperature', value: `${temperature} K` },
        { label: 'Volume', value: `${formatNumber(volume)} L` },
        { label: 'Model', value: 'PV = nRT' }
      ]}
    />
  )
}
