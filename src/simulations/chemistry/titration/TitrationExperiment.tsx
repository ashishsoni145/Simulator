import { useMemo, useState } from 'react'
import SimulationShell from '../../../components/simulation/SimulationShell'
import { SliderControl } from '../../../components/simulation/SimulationControls'
import SimulationGraph from '../../../components/simulation/SimulationGraph'
import { strongAcidStrongBasePh } from '../../../science/chemistry/chemistry'
import { formatNumber } from '../../../utils/format'
import { progressStore } from '../../../state/progressStore'

function TitrationSvg({ baseVolume, ph }: { baseVolume: number; ph: number }) {
  const color = ph < 6.8 ? '#f8c7d2' : ph < 8.2 ? '#e6eef7' : '#f472b6'
  const dropY = 76 + (baseVolume % 4) * 7
  return (
    <svg viewBox="0 0 560 420" role="img" aria-label="Virtual titration setup" style={{ width: '100%', height: '100%' }}>
      <rect x="260" y="38" width="28" height="210" rx="12" fill="rgba(125,211,252,.12)" stroke="rgba(125,211,252,.4)" />
      <rect x="265" y={52 + baseVolume * 2.1} width="18" height={190 - baseVolume * 2.1} fill="#7dd3fc" opacity=".45" />
      <line x1="274" y1="248" x2="274" y2="286" stroke="#91a3b8" strokeWidth="4" />
      <circle cx="274" cy={dropY + 210} r="5" fill="#7dd3fc" opacity=".75" />
      <path d="M190 318 C210 258 338 258 358 318 L330 374 L218 374 Z" fill={color} opacity=".82" stroke="rgba(255,255,255,.32)" />
      <ellipse cx="274" cy="318" rx="84" ry="20" fill={color} opacity=".58" />
      <text x="44" y="70" fill="#d9ecff" fontSize="16">Burette: NaOH</text>
      <text x="44" y="94" fill="#91a3b8" fontSize="13">Flask: HCl + phenolphthalein</text>
      <text x="44" y="122" fill="#d9ecff" fontSize="22">pH {formatNumber(ph)}</text>
    </svg>
  )
}

export default function TitrationExperiment() {
  const [acidMolarity, setAcidMolarity] = useState(0.1)
  const [baseMolarity, setBaseMolarity] = useState(0.1)
  const [acidVolume, setAcidVolume] = useState(25)
  const [baseVolume, setBaseVolume] = useState(0)
  const ph = strongAcidStrongBasePh(acidMolarity, acidVolume, baseMolarity, baseVolume)
  const equivalence = (acidMolarity * acidVolume) / baseMolarity
  const curve = useMemo(
    () =>
      Array.from({ length: 90 }, (_, index) => {
        const volume = (index / 89) * 55
        return { x: volume, y: strongAcidStrongBasePh(acidMolarity, acidVolume, baseMolarity, volume) }
      }),
    [acidMolarity, acidVolume, baseMolarity]
  )

  return (
    <SimulationShell
      title="Virtual Titration"
      subtitle="Chemistry · Class 12 · Solutions"
      stage={<TitrationSvg baseVolume={baseVolume} ph={ph} />}
      controls={
        <>
          <SliderControl label="Acid molarity" min={0.02} max={0.5} step={0.01} value={acidMolarity} unit="M" onChange={setAcidMolarity} />
          <SliderControl label="Base molarity" min={0.02} max={0.5} step={0.01} value={baseMolarity} unit="M" onChange={setBaseMolarity} />
          <SliderControl label="Acid volume" min={5} max={50} step={0.5} value={acidVolume} unit="mL" onChange={setAcidVolume} />
          <SliderControl label="Base added" min={0} max={55} step={0.2} value={baseVolume} unit="mL" onChange={setBaseVolume} />
          <SimulationGraph label="Titration curve pH vs base volume" points={curve} color="#f472b6" />
          <button className="button button--ghost" type="button" onClick={() => progressStore.markExperimentComplete('titration')}>
            Mark complete
          </button>
        </>
      }
      metrics={[
        { label: 'pH', value: formatNumber(ph) },
        { label: 'Equivalence point', value: `${formatNumber(equivalence)} mL` },
        { label: 'Indicator', value: ph >= 8.2 ? 'pink endpoint' : 'colorless' },
        { label: 'Experiment type', value: 'strong acid/base' }
      ]}
    />
  )
}
