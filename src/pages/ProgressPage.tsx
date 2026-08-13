import { chapters, simulations } from '../data/curriculum'
import { useProgressStore } from '../state/progressStore'

export default function ProgressPage() {
  const progress = useProgressStore()
  const completeCount = progress.completedSimulations.length + progress.completedExperiments.length
  const percent = simulations.length > 0 ? Math.round((completeCount / simulations.length) * 100) : 0

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Local progress layer</p>
          <h1 className="page-title">Progress</h1>
          <p className="muted">Stored in localStorage through an abstract store that can later be swapped for Supabase.</p>
        </div>
      </section>
      <section className="grid grid--3">
        <div className="card glass">
          <h3>{percent}%</h3>
          <p>Interactive artifacts completed</p>
        </div>
        <div className="card glass">
          <h3>{progress.viewedConcepts.length}</h3>
          <p>Concepts viewed</p>
        </div>
        <div className="card glass">
          <h3>{progress.favorites.length}</h3>
          <p>Favorites saved</p>
        </div>
      </section>
      <section className="section card glass">
        <h2>Mapped curriculum coverage</h2>
        <p>
          {chapters.length} chapters are represented. {simulations.length} simulations/experiments are currently implemented.
        </p>
      </section>
    </main>
  )
}
