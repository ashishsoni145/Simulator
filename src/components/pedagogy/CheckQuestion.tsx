import { useCallback, useMemo, useState } from 'react'
import type { QuizQuestion } from '../../science/lesson'
import { progressStore } from '../../state/progressStore'

/**
 * A check-your-understanding question.
 *
 * Two design choices matter. First, **every** option carries a `why`, not just the
 * right one — being told "wrong, try again" teaches nothing, whereas being told
 * *why* the distractor is tempting is often the actual lesson. Second, a wrong
 * answer does not lock the question: the student picks again, and only the first
 * attempt counts towards mastery. Retrying is how understanding gets built; the
 * score just has to be honest about it.
 */

export interface CheckQuestionProps {
  question: QuizQuestion
  /** Simulation id, so the answer lands in the right progress bucket. */
  simulationId: string
  className?: string
}

export default function CheckQuestion({ question, simulationId, className }: CheckQuestionProps) {
  const [chosen, setChosen] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)
  const [hintShown, setHintShown] = useState(false)

  const correctIndex = useMemo(() => question.options.findIndex((option) => option.correct), [question.options])

  const choose = useCallback(
    (index: number) => {
      if (solved) return
      const isCorrect = question.options[index]?.correct === true
      setChosen(index)
      setAttempts((count) => count + 1)
      if (isCorrect) setSolved(true)
      progressStore.recordQuizAnswer(simulationId, question.id, isCorrect, attempts === 0)
    },
    [solved, question.options, question.id, simulationId, attempts]
  )

  const reset = useCallback(() => {
    setChosen(null)
    setAttempts(0)
    setSolved(false)
    setHintShown(false)
  }, [])

  const chosenOption = chosen === null ? null : question.options[chosen]

  return (
    <section className={`quiz${className ? ` ${className}` : ''}`}>
      <p className="quiz__prompt">
        {question.prompt}
        {question.level ? <span className="quiz__level">{question.level}</span> : null}
      </p>

      <ul className="quiz__options" role="list">
        {question.options.map((option, index) => {
          const isChosen = chosen === index
          const revealAsCorrect = solved && index === correctIndex
          const revealAsWrong = isChosen && !option.correct
          const classes = ['quiz__option']
          if (revealAsCorrect) classes.push('quiz__option--correct')
          if (revealAsWrong) classes.push('quiz__option--wrong')
          return (
            <li key={option.text}>
              <button
                type="button"
                className={classes.join(' ')}
                onClick={() => choose(index)}
                disabled={solved}
                aria-pressed={isChosen}
              >
                <span className="quiz__marker" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="quiz__option-text">{option.text}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* One live region for all feedback, so a screen reader hears the result of a
          choice without the focus being moved out from under the student. */}
      <div className="quiz__feedback" role="status" aria-live="polite">
        {chosenOption ? (
          <p className={solved ? 'quiz__verdict quiz__verdict--correct' : 'quiz__verdict quiz__verdict--wrong'}>
            <strong>{solved ? 'Correct.' : 'Not quite.'}</strong> {chosenOption.why}
          </p>
        ) : null}

        {solved && correctIndex >= 0 && chosen !== correctIndex ? (
          <p className="quiz__verdict">{question.options[correctIndex]?.why}</p>
        ) : null}
      </div>

      <div className="quiz__actions">
        {question.hint && !solved ? (
          <button type="button" className="quiz__hint-button" onClick={() => setHintShown(true)} disabled={hintShown}>
            {hintShown ? 'Hint shown' : 'Show a hint'}
          </button>
        ) : null}
        {chosen !== null ? (
          <button type="button" className="quiz__hint-button" onClick={reset}>
            Try again from scratch
          </button>
        ) : null}
        {attempts > 1 && !solved ? (
          <span className="quiz__attempts">{`${attempts} attempts`}</span>
        ) : null}
      </div>

      {hintShown && question.hint ? <p className="quiz__hint">{question.hint}</p> : null}
    </section>
  )
}
