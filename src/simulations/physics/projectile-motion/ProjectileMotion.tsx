import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { PlayResetControls, SliderControl } from '../../../components/simulation/SimulationControls'
import SimulationGraph from '../../../components/simulation/SimulationGraph'
import AITutorPanel from '../../../components/simulation/AITutorPanel'
import { projectileAt, solveProjectile } from '../../../science/physics/projectile'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

function ProjectileScene({ time, result }: { time: number; result: ReturnType<typeof solveProjectile> }) {
  const sample = projectileAt(result, time)
  const scale = Math.max(result.range / 8, result.maxHeight / 4, 1)
  const points = result.samples.map((point) => [point.x / scale - 4, point.y / scale - 1.6, 0] as [number, number, number])
  const projectilePosition: [number, number, number] = [sample.x / scale - 4, sample.y / scale - 1.6, 0]

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <gridHelper args={[10, 10, '#27445e', '#122235']} position={[0, -1.6, 0]} />
      <Line points={points} color="#7dd3fc" lineWidth={2} />
      <mesh position={projectilePosition}>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial color="#8be9ff" emissive="#0f5f83" metalness={0.35} roughness={0.2} />
      </mesh>
      <Line
        points={[projectilePosition, [projectilePosition[0] + sample.vx / scale / 2, projectilePosition[1] + sample.vy / scale / 2, 0]]}
        color="#8ef7c1"
        lineWidth={3}
      />
      <OrbitControls enablePan={false} maxDistance={14} minDistance={4} />
    </>
  )
}

export default function ProjectileMotion() {
  const [speed, setSpeed] = useState(20)
  const [angleDeg, setAngleDeg] = useState(45)
  const [gravity, setGravity] = useState(9.8)
  const [height, setHeight] = useState(0)
  const [dragCoefficient, setDragCoefficient] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [time, setTime] = useState(0)
  const raf = useRef<number>()
  const last = useRef<number>()
  const result = useMemo(
    () => solveProjectile({ speed, angleDeg, gravity, height, dragCoefficient }),
    [angleDeg, dragCoefficient, gravity, height, speed]
  )
  const sample = projectileAt(result, time)

  useEffect(() => {
    if (!playing) return
    const tick = (now: number) => {
      if (last.current === undefined) last.current = now
      const delta = Math.min((now - last.current) / 1000, 0.05)
      last.current = now
      setTime((current) => {
        const next = current + delta
        if (next >= result.flightTime) {
          progressStore.markSimulationComplete('projectile-motion')
          return result.flightTime
        }
        return next
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      last.current = undefined
    }
  }, [playing, result.flightTime])

  useEffect(() => setTime(0), [result])

  return (
    <SimulationShell
      title="Projectile Motion"
      subtitle="Physics · Class 11 · Motion in a Plane"
      stage={
        <>
          <Canvas camera={{ position: [0, 1.6, 9], fov: 48 }}>
            <ProjectileScene result={result} time={time} />
          </Canvas>
          <div className="simulation-stage__overlay">
            <span className="chip">Velocity vector shown in green</span>
            <span className="chip">Trajectory uses drag integration when air resistance is enabled</span>
          </div>
        </>
      }
      controls={
        <>
          <PlayResetControls
            playing={playing}
            onToggle={() => setPlaying((value) => !value)}
            onReset={() => setTime(0)}
            onStep={() => setTime((value) => Math.min(value + 0.1, result.flightTime))}
          />
          <SliderControl label="Initial velocity" min={2} max={60} step={0.5} value={speed} unit="m/s" onChange={setSpeed} />
          <SliderControl label="Launch angle" min={5} max={85} step={1} value={angleDeg} unit="°" onChange={setAngleDeg} />
          <SliderControl label="Gravity" min={1.6} max={24} step={0.1} value={gravity} unit="m/s²" onChange={setGravity} />
          <SliderControl label="Initial height" min={0} max={30} step={0.5} value={height} unit="m" onChange={setHeight} />
          <SliderControl label="Air resistance" min={0} max={0.08} step={0.005} value={dragCoefficient} unit="k" onChange={setDragCoefficient} />
          <SimulationGraph
            label="Height vs time"
            points={result.samples.filter((_, index) => index % 8 === 0).map((point) => ({ x: point.time, y: point.y }))}
          />
          <AITutorPanel context={{ velocity: `${speed} m/s`, angle: `${angleDeg}°`, gravity: `${gravity} m/s²` }} />
        </>
      }
      metrics={[
        { label: 'Range', value: `${formatNumber(result.range)} m` },
        { label: 'Maximum height', value: `${formatNumber(result.maxHeight)} m` },
        { label: 'Flight time', value: `${formatNumber(result.flightTime)} s` },
        { label: 'Current velocity', value: `${formatNumber(Math.hypot(sample.vx, sample.vy))} m/s` },
        { label: 'Current acceleration', value: `${formatNumber(Math.hypot(sample.ax, sample.ay))} m/s²` }
      ]}
    />
  )
}
