import { useMemo, useState } from 'react'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SliderControl } from '../../../components/simulation/SimulationControls'
import { electronConfiguration } from '../../../science/chemistry/chemistry'
import { progressStore } from '../../../state/progressStore'

function OrbitalBoxes({ electrons }: { electrons: number }) {
  const orbitals = electronConfiguration(electrons)
  return (
    <div style={{ padding: 24 }}>
      <svg viewBox="0 0 760 430" role="img" aria-label="Orbital box electron configuration" style={{ width: '100%', height: '100%' }}>
        {orbitals.map((orbital, orbitalIndex) => {
          const boxes = orbital.capacity / 2
          const y = 46 + orbitalIndex * 46
          const x = 80
          return (
            <g key={orbital.label}>
              <text x="20" y={y + 23} fill="#d9ecff" fontSize="15">{orbital.label}</text>
              {Array.from({ length: boxes }, (_, boxIndex) => {
                const boxX = x + boxIndex * 42
                const firstPass = Math.min(orbital.electrons, boxes)
                const secondPass = Math.max(0, orbital.electrons - boxes)
                return (
                  <g key={boxIndex}>
                    <rect x={boxX} y={y} width="34" height="34" fill="rgba(255,255,255,.04)" stroke="rgba(125,211,252,.32)" />
                    {boxIndex < firstPass ? <text x={boxX + 10} y={y + 23} fill="#7dd3fc" fontSize="18">↑</text> : null}
                    {boxIndex < secondPass ? <text x={boxX + 20} y={y + 23} fill="#a78bfa" fontSize="18">↓</text> : null}
                  </g>
                )
              })}
              <text x="310" y={y + 23} fill="#91a3b8" fontSize="13">{orbital.electrons}/{orbital.capacity}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function ElectronConfiguration() {
  const [electrons, setElectrons] = useState(10)
  const config = useMemo(() => electronConfiguration(electrons).filter((orbital) => orbital.electrons > 0), [electrons])
  const notation = config.map((orbital) => `${orbital.label}${orbital.electrons}`).join(' ')

  return (
    <SimulationShell
      title="Electron Configuration"
      subtitle="Chemistry · Class 11 · Structure of Atom"
      stage={<OrbitalBoxes electrons={electrons} />}
      controls={
        <>
          <SliderControl label="Electrons" min={1} max={36} step={1} value={electrons} onChange={setElectrons} />
          <div className="card glass">
            <h3>Rules shown</h3>
            <p>Aufbau: lower energy orbitals fill first. Hund: p/d boxes get one electron before pairing. Pauli: paired electrons have opposite spin.</p>
          </div>
          <button className="button button--ghost" type="button" onClick={() => progressStore.markSimulationComplete('electron-configuration')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'Electron count', value: String(electrons) },
        { label: 'Configuration', value: notation }
      ]}
    />
  )
}
