import { Link, useSearchParams } from 'react-router-dom'
import SimulationCard from '../components/cards/SimulationCard'
import { chapters, simulations, type Subject } from '../data/curriculum'

export default function SubjectPage({ subject }: { subject: Subject }) {
  const [params] = useSearchParams()
  const selectedClass = Number(params.get('class')) === 12 ? 12 : 11
  const subjectChapters = chapters.filter((chapter) => chapter.subject === subject && chapter.classLevel === selectedClass)
  const subjectSimulations = simulations.filter((simulation) => simulation.subject === subject)

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Class {selectedClass}</p>
          <h1 className="page-title">{subject === 'physics' ? 'Physics' : 'Chemistry'}</h1>
          <p className="muted">Curriculum is data-driven, so new chapters and simulations can be added without changing navigation components.</p>
        </div>
        <div className="toolbar">
          <Link className={`button ${selectedClass === 11 ? 'button--primary' : 'button--ghost'}`} to={`/lab/${subject}?class=11`}>
            Class 11
          </Link>
          <Link className={`button ${selectedClass === 12 ? 'button--primary' : 'button--ghost'}`} to={`/lab/${subject}?class=12`}>
            Class 12
          </Link>
        </div>
      </section>

      <section className="curriculum-list">
        {subjectChapters.map((chapter) => {
          const chapterSimulations = simulations.filter((simulation) => chapter.simulationIds.includes(simulation.id))
          return (
            <article className="chapter-row glass" key={chapter.id}>
              <div>
                <strong>{chapter.title}</strong>
                <div className="small-muted">
                  {chapterSimulations.length > 0 ? `${chapterSimulations.length} interactive artifact(s)` : 'Mapped for future artifacts'}
                </div>
              </div>
              <div className="toolbar">
                {chapterSimulations.map((simulation) => (
                  <Link className="button button--ghost" key={simulation.id} to={`/lab/simulations/${simulation.id}`}>
                    {simulation.title}
                  </Link>
                ))}
              </div>
            </article>
          )
        })}
      </section>

      <section className="section">
        <h2 className="section-title">Available {subject} simulations</h2>
        <div className="grid grid--3">
          {subjectSimulations.map((simulation) => (
            <SimulationCard key={simulation.id} simulation={simulation} />
          ))}
        </div>
      </section>
    </main>
  )
}
