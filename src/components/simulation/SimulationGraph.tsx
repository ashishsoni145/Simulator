export interface GraphPoint {
  x: number
  y: number
}

interface SimulationGraphProps {
  points: GraphPoint[]
  label: string
  color?: string
}

export default function SimulationGraph({ points, label, color = '#7dd3fc' }: SimulationGraphProps) {
  const width = 320
  const height = 190
  const padding = 24
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs, 0)
  const maxX = Math.max(...xs, 1)
  const minY = Math.min(...ys, 0)
  const maxY = Math.max(...ys, 1)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1

  const path = points
    .map((point, index) => {
      const x = padding + ((point.x - minX) / spanX) * (width - padding * 2)
      const y = height - padding - ((point.y - minY) / spanY) * (height - padding * 2)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg className="graph" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={`M ${padding} ${padding} V ${height - padding} H ${width - padding}`} fill="none" stroke="rgba(255,255,255,.18)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <text x={padding} y={18} fill="#91a3b8" fontSize="11">
        {label}
      </text>
    </svg>
  )
}
