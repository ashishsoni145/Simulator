import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { PlayResetControls, SliderControl } from '../../../components/simulation/SimulationControls'
import AITutorPanel from '../../../components/simulation/AITutorPanel'
import { newtonsSecondLaw } from '../../../science/physics/mechanics'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

function BlockScene({ acceleration, playing }: { acceleration: number; playing: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const velocity = useRef(0)
  const position = useRef(-3)
  useFrame((_, delta) => {
    if (!playing) return
    velocity.current += acceleration * delta
    position.current += velocity.current * delta * 0.25
    if (position.current > 3.2 || position.current < -3.2) {
      velocity.current *= -0.45
      position.current = Math.max(-3.2, Math.min(3.2, position.current))
    }
    if (ref.current) ref.current.position.x = position.current
  })
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1} />
      <gridHelper args={[8, 8, '#27445e', '#132235']} position={[0, -0.7, 0]} />
      <mesh ref={ref} position={[-3, 0, 0]}>
        <boxGeometry args={[0.9, 0.65, 0.65]} />
        <meshStandardMaterial color="#7dd3fc" metalness={0.18} roughness={0.34} />
      </mesh>
      <Line points={[[-3.4, 0.65, 0], [2.8, 0.65, 0]]} color="#8ef7c1" lineWidth={4} />
      <Line points={[[-2.2, 0.95, 0], [-3.3, 0.95, 0]]} color="#fb7185" lineWidth={4} />
      <OrbitControls enablePan={false} enableZoom={false} />
    </>
  )
}

export default function NewtonsSecondLaw() {
  const [mass, setMass] = useState(5)
  const [force, setForce] = useState(24)
  const [friction, setFriction] = useState(4)
  const [playing, setPlaying] = useState(true)
  const result = useMemo(() => newtonsSecondLaw(mass, force, friction), [force, friction, mass])
  const velocityAfterTwoSeconds = result.acceleration * 2

  return (
    <SimulationShell
      title="Newton's Second Law"
      subtitle="Physics · Class 11 · Laws of Motion"
      stage={
        <>
          <Canvas camera={{ position: [0, 2.3, 6.5], fov: 48 }}>
            <BlockScene acceleration={result.acceleration} playing={playing} />
          </Canvas>
          <div className="simulation-stage__overlay">
            <span className="chip">Green vector: applied force</span>
            <span className="chip">Red vector: friction</span>
          </div>
        </>
      }
      controls={
        <>
          <PlayResetControls playing={playing} onToggle={() => setPlaying((value) => !value)} onReset={() => setPlaying(false)} />
          <SliderControl label="Mass" min={1} max={50} step={0.5} value={mass} unit="kg" onChange={setMass} />
          <SliderControl label="Applied force" min={0} max={120} step={1} value={force} unit="N" onChange={setForce} />
          <SliderControl label="Friction" min={0} max={80} step={1} value={friction} unit="N" onChange={setFriction} />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('newtons-second-law')}>
            Mark complete
          </button>
          <AITutorPanel context={{ mass: `${mass} kg`, force: `${force} N`, friction: `${friction} N` }} />
        </>
      }
      metrics={[
        { label: 'Net force', value: `${formatNumber(result.netForce)} N` },
        { label: 'Acceleration', value: `${formatNumber(result.acceleration)} m/s²` },
        { label: 'Velocity after 2s', value: `${formatNumber(velocityAfterTwoSeconds)} m/s` }
      ]}
    />
  )
}
