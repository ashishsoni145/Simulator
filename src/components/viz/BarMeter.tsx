import { useMemo } from 'react'
import { toSigFigs, trimZeros } from '../../science/units'
import { toneForIndex, toneVar } from './tone'
import type { Tone } from './tone'

/**
 * Horizontal bars for quantities a student should compare at a glance — the
 * kinetic/potential energy split, the forces on a block, the concentrations either
 * side of an equilibrium.
 *
 * In `stacked` mode the bars share one track and sum to the total, which is the
 * whole argument for energy conservation: as one segment shrinks the other grows
 * and the track never changes length.
 */

export interface BarMeterItem {
  id: string
  label: string
  value: number
  unit?: string
  tone?: Tone
  /** Small note under the label, e.g. "½mv²". */
  hint?: string
}

export interface BarMeterProps {
  items: BarMeterItem[]
  /** Pin the full-scale value. Defaults to the largest item (or the sum, when stacked). */
  max?: number
  unit?: string
  /** One shared track split between items, instead of one track each. */
  stacked?: boolean
  showValues?: boolean
  sigFigs?: number
  caption?: string
  className?: string
}

function fmt(value: number, sigFigs: number): string {
  if (!Number.isFinite(value)) return '—'
  return trimZeros(toSigFigs(value, sigFigs))
}

export default function BarMeter({
  items,
  max,
  unit = '',
  stacked = false,
  showValues = true,
  sigFigs = 3,
  caption,
  className
}: BarMeterProps) {
  const resolved = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        tone: item.tone ?? toneForIndex(index),
        // A negative magnitude has no length; the sign belongs in the number, not
        // in a bar drawn backwards off the end of its track.
        magnitude: Number.isFinite(item.value) ? Math.abs(item.value) : 0
      })),
    [items]
  )

  const total = resolved.reduce((sum, item) => sum + item.magnitude, 0)
  const scale = max !== undefined && max > 0 ? max : stacked ? total : Math.max(...resolved.map((i) => i.magnitude), 1e-12)

  if (stacked) {
    return (
      <div className={`bars bars--stacked${className ? ` ${className}` : ''}`}>
        <div className="bars__track" role="img" aria-label={resolved.map((i) => `${i.label} ${fmt(i.value, sigFigs)} ${i.unit ?? unit}`).join(', ')}>
          {resolved.map((item) => {
            const percent = scale > 0 ? (item.magnitude / scale) * 100 : 0
            return (
              <span
                key={item.id}
                className="bars__segment"
                style={{ width: `${percent}%`, background: toneVar(item.tone) }}
                title={`${item.label}: ${fmt(item.value, sigFigs)} ${item.unit ?? unit}`}
              />
            )
          })}
        </div>
        <ul className="bars__key">
          {resolved.map((item) => (
            <li key={item.id} className="bars__key-item" style={{ color: toneVar(item.tone) }}>
              <span className="bars__swatch" aria-hidden="true" />
              <span className="bars__key-label">{item.label}</span>
              {showValues ? (
                <span className="bars__key-value">{`${fmt(item.value, sigFigs)} ${item.unit ?? unit}`}</span>
              ) : null}
            </li>
          ))}
        </ul>
        {caption ? <p className="bars__caption">{caption}</p> : null}
      </div>
    )
  }

  return (
    <div className={`bars${className ? ` ${className}` : ''}`}>
      {resolved.map((item) => {
        const percent = scale > 0 ? Math.min(100, (item.magnitude / scale) * 100) : 0
        return (
          <div key={item.id} className="bars__row" style={{ color: toneVar(item.tone) }}>
            <div className="bars__head">
              <span className="bars__label">{item.label}</span>
              {item.hint ? <span className="bars__hint">{item.hint}</span> : null}
              {showValues ? (
                <span className="bars__value">{`${fmt(item.value, sigFigs)} ${item.unit ?? unit}`}</span>
              ) : null}
            </div>
            <div
              className="bars__track"
              role="img"
              aria-label={`${item.label}: ${fmt(item.value, sigFigs)} ${item.unit ?? unit} of ${fmt(scale, sigFigs)}`}
            >
              <span className="bars__segment" style={{ width: `${percent}%`, background: toneVar(item.tone) }} />
            </div>
          </div>
        )
      })}
      {caption ? <p className="bars__caption">{caption}</p> : null}
    </div>
  )
}
