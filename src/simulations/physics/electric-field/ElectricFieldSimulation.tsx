import { useMemo, useState } from 'react'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { NumberControl, SliderControl } from '../../../components/simulation/SimulationControls'
import { type Charge, electricFieldAt } from '../../../science/physics/mechanics'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

function FieldSvg({ charges }: { charges: Charge[] }) {
  const vectors = []
  for (let x = -4; x <= 4; x += 1) {
    for (let y = -3; y <= 3; y += 1) {
      const field = electricFieldAt(charges, x, y)
      const magnitude = Math.hypot(field.ex, field.ey)
      const length = Math.min(0.45, Math.log10(magnitude + 1) / 28)
      const angle = Math.atan2(field.ey, field.ex)
      vectors.push({ x, y, dx: Math.cos(angle) * length, dy: Math.sin(angle) * length, magnitude })
    }
  }
  const sx = (x: number) => 50 + x * 55
  const sy = (y: number) => 220 - y * 55

  return (
    <svg viewBox="0 0 500 390" role="img" aria-label="Electric field vector map" style={{ width: '100%', height: '100%' }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#7dd3fc" />
        </marker>
      </defs>
      {vectors.map((vector) => (
        <line
          key={`${vector.x}-${vector.y}`}
          x1={sx(vector.x)}
          y1={sy(vector.y)}
          x2={sx(vector.x + vector.dx)}
          y2={sy(vector.y + vector.dy)}
          stroke="#7dd3fc"
          strokeWidth="2"
          markerEnd="url(#arrow)"
          opacity="0.78"
        />
      ))}
      {charges.map((charge) => (
        <g key={charge.id}>
          <circle cx={sx(charge.x)} cy={sy(charge.y)} r="18" fill={charge.q > 0 ? '#fb7185' : '#60a5fa'} />
          <text x={sx(charge.x)} y={sy(charge.y) + 5} textAnchor="middle" fill="#fff" fontSize="18">
            {charge.q > 0 ? '+' : '−'}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function ElectricFieldSimulation() {
  const [q1, setQ1] = useState(2)
  const [q2, setQ2] = useState(-2)
  const [x1, setX1] = useState(-1.5)
  const [x2, setX2] = useState(1.5)
  const charges = useMemo<Charge[]>(
    () => [
      { id: 'q1', q: q1 * 1e-9, x: x1, y: 0 },
      { id: 'q2', q: q2 * 1e-9, x: x2, y: 0 }
    ],
    [q1, q2, x1, x2]
  )
  const centerField = electricFieldAt(charges, 0, 0)
  const magnitude = Math.hypot(centerField.ex, centerField.ey)

  return (
    <SimulationShell
      title="Electric Field"
      subtitle="Physics · Class 12 · Electric Charges & Fields"
      stage={<FieldSvg charges={charges} />}
      controls={
        <>
          <NumberControl label="Charge 1" value={q1} min={-8} max={8} step={0.5} unit="nC" onChange={setQ1} />
          <SliderControl label="Charge 1 x-position" min={-4} max={4} step={0.1} value={x1} unit="m" onChange={setX1} />
          <NumberControl label="Charge 2" value={q2} min={-8} max={8} step={0.5} unit="nC" onChange={setQ2} />
          <SliderControl label="Charge 2 x-position" min={-4} max={4} step={0.1} value={x2} unit="m" onChange={setX2} />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('electric-field')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'E at origin', value: `${formatNumber(magnitude)} N/C` },
        { label: 'Ex', value: `${formatNumber(centerField.ex)} N/C` },
        { label: 'Ey', value: `${formatNumber(centerField.ey)} N/C` }
      ]}
    />
  )
}
