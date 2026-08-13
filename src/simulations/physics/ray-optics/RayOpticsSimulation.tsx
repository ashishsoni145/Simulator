import { useMemo, useState } from 'react'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SliderControl } from '../../../components/simulation/SimulationControls'
import { thinLens } from '../../../science/physics/mechanics'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

function LensSvg({ objectDistance, focalLength, imageDistance, magnification }: { objectDistance: number; focalLength: number; imageDistance: number; magnification: number }) {
  const originX = 310
  const axisY = 210
  const scale = 7
  const objectX = originX - objectDistance * scale
  const imageX = Number.isFinite(imageDistance) ? originX + imageDistance * scale : originX + 230
  const objectHeight = 86
  const imageHeight = Number.isFinite(magnification) ? objectHeight * magnification : 120

  return (
    <svg viewBox="0 0 620 420" role="img" aria-label="Thin lens ray diagram" style={{ width: '100%', height: '100%' }}>
      <line x1="30" y1={axisY} x2="590" y2={axisY} stroke="rgba(255,255,255,.28)" />
      <line x1={originX} y1="42" x2={originX} y2="378" stroke="#7dd3fc" strokeWidth="3" />
      <text x={originX + focalLength * scale - 12} y={axisY + 24} fill="#91a3b8">F</text>
      <text x={originX - focalLength * scale - 12} y={axisY + 24} fill="#91a3b8">F</text>
      <line x1={objectX} y1={axisY} x2={objectX} y2={axisY - objectHeight} stroke="#8ef7c1" strokeWidth="5" />
      <polygon points={`${objectX - 8},${axisY - objectHeight + 10} ${objectX + 8},${axisY - objectHeight + 10} ${objectX},${axisY - objectHeight - 8}`} fill="#8ef7c1" />
      <line x1={objectX} y1={axisY - objectHeight} x2={originX} y2={axisY - objectHeight} stroke="#facc15" strokeWidth="2" />
      <line x1={originX} y1={axisY - objectHeight} x2={imageX} y2={axisY + imageHeight} stroke="#facc15" strokeWidth="2" />
      <line x1={objectX} y1={axisY - objectHeight} x2={imageX} y2={axisY + imageHeight} stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 5" />
      <line x1={imageX} y1={axisY} x2={imageX} y2={axisY + imageHeight} stroke="#fb7185" strokeWidth="5" />
    </svg>
  )
}

export default function RayOpticsSimulation() {
  const [objectDistance, setObjectDistance] = useState(32)
  const [focalLength, setFocalLength] = useState(12)
  const result = useMemo(() => thinLens(objectDistance, focalLength), [focalLength, objectDistance])

  return (
    <SimulationShell
      title="Ray Optics Lens Lab"
      subtitle="Physics · Class 12 · Ray Optics"
      stage={<LensSvg objectDistance={objectDistance} focalLength={focalLength} imageDistance={result.imageDistance} magnification={result.magnification} />}
      controls={
        <>
          <SliderControl label="Object distance" min={8} max={58} step={0.5} value={objectDistance} unit="cm" onChange={setObjectDistance} />
          <SliderControl label="Focal length" min={5} max={30} step={0.5} value={focalLength} unit="cm" onChange={setFocalLength} />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('ray-optics')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Image position', value: `${formatNumber(result.imageDistance)} cm` },
        { label: 'Magnification', value: formatNumber(result.magnification) },
        { label: 'Orientation', value: result.orientation },
        { label: 'Image type', value: result.imageType }
      ]}
    />
  )
}
