import { toSigFigs, trimZeros } from '../../science/units'
import MathText from '../pedagogy/MathText'
import { toneVar } from '../viz/tone'
import type { Tone } from '../viz/tone'

/**
 * Numeric readouts.
 *
 * A metric carries four things the old `{label, value}` pair could not: the symbol
 * it goes by in the formulas, the formula it comes from, its unit as a separate
 * field, and a sentence saying what it means. That is the difference between
 * "Max height 10.2" and "H — rise above the launch point — 10.204 m — from
 * H = v_y²/2g". The second one can be checked by hand.
 */

export interface MetricSpec {
  id: string
  label: string
  value: number | string
  unit?: string
  /** The symbol used for this quantity in the formulas, e.g. `H`. */
  symbol?: string
  tone?: Tone
  /** One sentence: what this number means. */
  hint?: string
  /** Where it comes from, in MathText markup. */
  formula?: string
  /** Draw larger — for the one or two headline numbers. */
  emphasis?: boolean
  /** Grey out, for a value that does not apply in the current configuration. */
  inactive?: boolean
}

export interface MetricGridProps {
  metrics: MetricSpec[]
  sigFigs?: number
  className?: string
}

function display(value: number | string, sigFigs: number): string {
  if (typeof value === 'string') return value
  if (!Number.isFinite(value)) return '—'
  return trimZeros(toSigFigs(value, sigFigs))
}

export function MetricGrid({ metrics, sigFigs = 4, className }: MetricGridProps) {
  return (
    <dl className={`metrics${className ? ` ${className}` : ''}`}>
      {metrics.map((metric) => {
        const classes = ['metric']
        if (metric.emphasis) classes.push('metric--emphasis')
        if (metric.inactive) classes.push('metric--inactive')
        return (
          <div
            key={metric.id}
            className={classes.join(' ')}
            style={metric.tone ? { color: toneVar(metric.tone) } : undefined}
            title={metric.hint}
          >
            <dt className="metric__label">
              {metric.label}
              {metric.symbol ? <span className="metric__symbol">{metric.symbol}</span> : null}
            </dt>
            <dd className="metric__value">
              <span className="metric__number">{display(metric.value, sigFigs)}</span>
              {metric.unit ? <span className="metric__unit">{metric.unit}</span> : null}
            </dd>
            {metric.formula ? (
              <dd className="metric__formula">
                <MathText>{metric.formula}</MathText>
              </dd>
            ) : null}
            {metric.hint ? <dd className="metric__hint">{metric.hint}</dd> : null}
          </div>
        )
      })}
    </dl>
  )
}

export interface BadgeProps {
  children: string
  tone?: Tone
  /** A hollow badge, for secondary information. */
  outline?: boolean
  title?: string
}

/** A small labelled chip. Used for status, syllabus tags and unit hints. */
export function Badge({ children, tone = 'muted', outline = false, title }: BadgeProps) {
  return (
    <span
      className={outline ? 'badge badge--outline' : 'badge'}
      style={{ color: toneVar(tone) }}
      title={title}
    >
      {children}
    </span>
  )
}

export default MetricGrid
