import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function ScientificModel() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.18
  })
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshStandardMaterial color="#a78bfa" emissive="#21104e" roughness={0.22} metalness={0.25} />
      </mesh>
      {[0, 1, 2].map((orbit) => (
        <group key={orbit} rotation={[orbit * 0.82, orbit * 0.5, orbit * 0.4]}>
          <mesh>
            <torusGeometry args={[1.75, 0.012, 16, 160]} />
            <meshBasicMaterial color={orbit === 0 ? '#7dd3fc' : orbit === 1 ? '#8ef7c1' : '#a78bfa'} transparent opacity={0.72} />
          </mesh>
          <mesh position={[1.75, 0, 0]}>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#0f5f83" />
          </mesh>
        </group>
      ))}
      <Line points={[[-2.7, -1.65, 0], [-1.6, -1.1, 0], [-0.35, -1.42, 0], [0.7, -0.66, 0], [2.5, -1.08, 0]]} color="#facc15" lineWidth={2} />
    </group>
  )
}

export default function Hero() {
  return (
    <div className="hero-visual">
      <div className="orbital-card glass">
        <Canvas camera={{ position: [0, 0.35, 5.1], fov: 48 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[4, 5, 4]} intensity={1.2} />
          <ScientificModel />
          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>
      </div>
      <div className="floating-indicator floating-indicator--one">
        <strong>Projectile Motion</strong>
        <span>Velocity, angle, gravity, drag</span>
      </div>
      <div className="floating-indicator floating-indicator--two">
        <strong>Electric Field</strong>
        <span>Coulomb vectors in real time</span>
      </div>
      <div className="floating-indicator floating-indicator--three">
        <strong>Molecular Geometry</strong>
        <span>Rotate VSEPR structures</span>
      </div>
    </div>
  )
}
