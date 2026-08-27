import MathText from './MathText'

/**
 * A formula with the student's own numbers put into it.
 *
 * This is the component that closes the loop between the animation and the
 * algebra. The simulation already knows `u = 23 m/s` and `θ = 52°`; showing
 *
 *     R = {u² sin 2θ}/{g}  =  {23² × sin 104°}/{9.8}  =  52.4 m
 *
 * and updating it live as the slider moves is the difference between watching a
 * ball and understanding why it lands there. Every simulation gets one.
 */

export interface FormulaStep {
  /** The formula in symbols, in MathText markup. */
  symbolic: string
  /** The same formula with the current values substituted, in MathText markup. */
  substituted?: string
  /** The evaluated result, including its unit. */
  result?: string
  /** What this step means, in one sentence. */
  note?: string
  /** Grey the step out — e.g. a closed form that this configuration invalidates. */
  inactive?: boolean
}

export interface FormulaBlockProps {
  title: string
  steps: FormulaStep[]
  /**
   * Shown in place of the results when the closed forms do not apply — air
   * resistance switched on, a lens in an impossible configuration. Stating this is
   * the point: a formula quoted next to motion it does not describe teaches the
   * wrong lesson.
   */
  caveat?: string
  className?: string
}

export default function FormulaBlock({ title, steps, caveat, className }: FormulaBlockProps) {
  return (
    <section className={`formula${className ? ` ${className}` : ''}`}>
      <h4 className="formula__title">{title}</h4>

      {caveat ? <p className="formula__caveat">{caveat}</p> : null}

      <ol className="formula__steps">
        {steps.map((step, index) => (
          <li
            key={`${step.symbolic}-${index}`}
            className={step.inactive ? 'formula__step formula__step--inactive' : 'formula__step'}
          >
            <div className="formula__line">
              <MathText display>{step.symbolic}</MathText>
              {step.substituted ? (
                <>
                  <span className="formula__equals" aria-hidden="true">
                    =
                  </span>
                  <MathText display className="formula__substituted">
                    {step.substituted}
                  </MathText>
                </>
              ) : null}
              {step.result ? (
                <>
                  <span className="formula__equals" aria-hidden="true">
                    =
                  </span>
                  <strong className="formula__result">{step.result}</strong>
                </>
              ) : null}
            </div>
            {step.note ? <p className="formula__note">{step.note}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
