import { Link } from 'react-router-dom'
import { chapters, getSimulation, simulations } from '../../data/curriculum'
import { useProgressStore } from '../../state/progressStore'
import SimulationCard from '../cards/SimulationCard'

export default function Dashboard() {
  const progress = useProgressStore()
  const recentlyViewed = progress.recentlyViewed.map(getSimulation).filter((item): item is NonNullable<typeof item> => Boolean(item))
  const completed = progress.completedSimulations.length + progress.completedExperiments.length

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Science 3D lab</p>
          <h1 className="page-title">Interactive simulations for Class 11 and 12 science.</h1>
          <p className="muted">Start with the working simulations below, or browse the full structured curriculum.</p>
        </div>
        <div className="stat-row">
          <div className="stat">
            <strong>{simulations.length}</strong>
            <span>working artifacts</span>
          </div>
          <div className="stat">
            <strong>{chapters.length}</strong>
            <span>chapters mapped</span>
          </div>
          <div className="stat">
            <strong>{completed}</strong>
            <span>completed</span>
          </div>
        </div>
      </section>

      <section className="grid grid--3">
        {simulations.slice(0, 6).map((simulation) => (
          <SimulationCard key={simulation.id} simulation={simulation} />
        ))}
      </section>

      <section className="section grid grid--2">
        <div className="card glass">
          <h2>Continue learning</h2>
          {recentlyViewed.length > 0 ? (
            <div className="curriculum-list">
              {recentlyViewed.map((simulation) => (
                <Link className="chapter-row glass" key={simulation.id} to={`/lab/simulations/${simulation.id}`}>
                  <span>{simulation.title}</span>
                  <span className="chip">Resume</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">Launch a simulation to build your recent activity list.</p>
          )}
        </div>
        <div className="card glass">
          <h2>Ask Science AI</h2>
          <p>
            The UI is ready to pass active simulation context to an AI tutor, but no AI backend is configured in this project.
          </p>
          <Link className="button button--ghost" to="/lab/simulations/projectile-motion">
            Open a simulation context
          </Link>
        </div>
      </section>
    </main>
  )
}
