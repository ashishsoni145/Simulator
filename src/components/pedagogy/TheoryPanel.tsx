import type { Lesson } from '../../science/lesson'
import InsightCallout from './InsightCallout'
import MathText from './MathText'

/**
 * The Theory tab: the lesson, rendered.
 *
 * Everything here comes from the simulation's `Lesson` object, so the prose a
 * student reads and the prose the tutor draws on cannot drift apart.
 */

export interface TheoryPanelProps {
  lesson: Lesson
  className?: string
}

export default function TheoryPanel({ lesson, className }: TheoryPanelProps) {
  const hasContent =
    lesson.sections.length > 0 ||
    lesson.formulas.length > 0 ||
    lesson.misconceptions.length > 0 ||
    lesson.realWorld.length > 0

  if (!hasContent) {
    return (
      <div className={`theory${className ? ` ${className}` : ''}`}>
        <p className="theory__empty">Written explanation for this simulation is still being added.</p>
      </div>
    )
  }

  return (
    <div className={`theory${className ? ` ${className}` : ''}`}>
      {lesson.syllabus ? <p className="theory__syllabus">{lesson.syllabus}</p> : null}

      {lesson.bigIdea ? (
        <p className="theory__big-idea">
          <span className="theory__big-idea-tag">The big idea</span>
          {lesson.bigIdea}
        </p>
      ) : null}

      {lesson.sections.map((section) => (
        <section className="theory__section" key={section.heading}>
          <h4 className="theory__heading">{section.heading}</h4>
          {section.body.map((paragraph, index) => (
            <p className="theory__paragraph" key={index}>
              {paragraph}
            </p>
          ))}
          {section.bullets && section.bullets.length > 0 ? (
            <ul className="theory__bullets">
              {section.bullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {lesson.formulas.length > 0 ? (
        <section className="theory__section">
          <h4 className="theory__heading">Formulas worth knowing</h4>
          <dl className="theory__formulas">
            {lesson.formulas.map((formula) => (
              <div className="theory__formula" key={formula.name}>
                <dt>
                  <span className="theory__formula-name">{formula.name}</span>
                  <MathText display>{formula.symbolic}</MathText>
                </dt>
                <dd>
                  {formula.meaning}
                  {formula.validWhen ? (
                    <span className="theory__formula-valid">{`Holds when: ${formula.validWhen}`}</span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {lesson.misconceptions.length > 0 ? (
        <section className="theory__section">
          <h4 className="theory__heading">Where students usually go wrong</h4>
          {lesson.misconceptions.map((item) => (
            <InsightCallout kind="misconception" key={item.claim} title={`“${item.claim}”`}>
              <p>{item.reality}</p>
              {item.seeItHere ? <p className="callout__see">{item.seeItHere}</p> : null}
            </InsightCallout>
          ))}
        </section>
      ) : null}

      {lesson.experiments && lesson.experiments.length > 0 ? (
        <section className="theory__section">
          <h4 className="theory__heading">Things to try</h4>
          <ol className="theory__experiments">
            {lesson.experiments.map((experiment) => (
              <li key={experiment.do}>
                <span className="theory__experiment-do">{experiment.do}</span>
                <span className="theory__experiment-observe">{experiment.observe}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {lesson.realWorld.length > 0 ? (
        <section className="theory__section">
          <h4 className="theory__heading">Where you meet this outside class</h4>
          <ul className="theory__bullets">
            {lesson.realWorld.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {lesson.glossary && lesson.glossary.length > 0 ? (
        <section className="theory__section">
          <h4 className="theory__heading">Terms</h4>
          <dl className="theory__glossary">
            {lesson.glossary.map((entry) => (
              <div key={entry.term}>
                <dt>{entry.term}</dt>
                <dd>{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  )
}
