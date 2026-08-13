import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { PlayResetControls, SliderControl } from '../../../components/simulation/SimulationControls'
import SimulationGraph from '../../../components/simulation/SimulationGraph'
import { solveShm } from '../../../science/physics/mechanics'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

function SpringScene({ mass, springConstant, amplitude, playing }: { mass: number; springConstant: number; amplitude: number; playing: boolean }) {
  const mesh = useRef<THREE.Mesh>(null)
  const time = useRef(0)
  const scale = 1.7

  useFrame((_, delta) => {
    if (playing) time.current += delta
    const state = solveShm({ mass, springConstant, amplitude, time: time.current })
    if (mesh.current) mesh.current.position.x = state.position * scale
  })

  const springPoints = Array.from({ length: 28 }, (_, index) => {
    const t = index / 27
    return [-3 + t * 3, Math.sin(t * Math.PI * 12) * 0.18, 0] as [number, number, number]
  })

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 5]} intensity={1} />
      <Line points={springPoints} color="#7dd3fc" lineWidth={2} />
      <mesh position={[-3.25, 0, 0]}>
        <boxGeometry args={[0.18, 1.6, 0.18]} />
        <meshStandardMaterial color="#41556f" />
      </mesh>
      <mesh ref={mesh} position={[amplitude * scale, 0, 0]}>
        <boxGeometry args={[0.75, 0.75, 0.75]} />
        <meshStandardMaterial color="#a78bfa" metalness={0.2} roughness={0.35} />
      </mesh>
      <gridHelper args={[8, 8, '#27445e', '#132235']} position={[0, -0.75, 0]} />
      <OrbitControls enablePan={false} enableZoom={false} />
    </>
  )
}

export default function SHMSimulation() {
  const [mass, setMass] = useState(2)
  const [springConstant, setSpringConstant] = useState(18)
  const [amplitude, setAmplitude] = useState(1.2)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(true)
  const state = useMemo(() => solveShm({ mass, springConstant, amplitude, time }), [amplitude, mass, springConstant, time])
  const graphPoints = useMemo(
    () =>
      Array.from({ length: 120 }, (_, index) => {
        const graphTime = (index / 119) * state.period * 2
        return { x: graphTime, y: solveShm({ mass, springConstant, amplitude, time: graphTime }).position }
      }),
    [amplitude, mass, springConstant, state.period]
  )

  return (
    <SimulationShell
      title="Simple Harmonic Motion"
      subtitle="Physics · Class 11 · Oscillations"
      stage={<Canvas camera={{ position: [0, 1.4, 6.5], fov: 50 }}><SpringScene amplitude={amplitude} mass={mass} springConstant={springConstant} playing={playing} /></Canvas>}
      controls={
        <>
          <PlayResetControls
            playing={playing}
            onToggle={() => setPlaying((value) => !value)}
            onReset={() => setTime(0)}
            onStep={() => setTime((value) => value + 0.1)}
          />
          <SliderControl label="Mass" min={0.5} max={10} step={0.1} value={mass} unit="kg" onChange={setMass} />
          <SliderControl label="Spring constant" min={2} max={80} step={1} value={springConstant} unit="N/m" onChange={setSpringConstant} />
          <SliderControl label="Amplitude" min={0.2} max={2.2} step={0.1} value={amplitude} unit="m" onChange={setAmplitude} />
          <SliderControl label="Time" min={0} max={state.period * 2} step={0.02} value={time} unit="s" onChange={setTime} />
          <SimulationGraph label="Position vs time" points={graphPoints} color="#a78bfa" />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('shm')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Position', value: `${formatNumber(state.position)} m` },
        { label: 'Velocity', value: `${formatNumber(state.velocity)} m/s` },
        { label: 'Acceleration', value: `${formatNumber(state.acceleration)} m/s²` },
        { label: 'Energy', value: `${formatNumber(state.totalEnergy)} J` },
        { label: 'Period', value: `${formatNumber(state.period)} s` }
      ]}
    />
  )
}
