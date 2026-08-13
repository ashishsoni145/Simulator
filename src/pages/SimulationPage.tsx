import { lazy, Suspense, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import SimulationErrorBoundary from '../components/simulation/SimulationErrorBoundary'
import SimulationLoading from '../components/simulation/SimulationLoading'
import { getChapter, getSimulation } from '../data/curriculum'
import { progressStore, useProgressStore } from '../state/progressStore'
import { loadSimulationComponent } from '../utils/simulationLoader'

export default function SimulationPage() {
  const { id = '' } = useParams()
  const simulation = getSimulation(id)
  const progress = useProgressStore()

  useEffect(() => {
    if (simulation) progressStore.markViewed(simulation.id)
  }, [simulation])

  if (!simulation) {
    return (
      <main className="page">
        <div className="error-state glass">
          <div>
            <h1>Simulation not found</h1>
            <Link className="button button--primary" to="/lab/simulations">
              Browse simulations
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const LazySimulation = lazy(loadSimulationComponent(simulation.id))
  const chapter = getChapter(simulation.chapterId)
  const favorite = progress.favorites.includes(simulation.id)

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">
            {simulation.subject} · Class {simulation.classLevel} · {chapter?.title}
          </p>
          <h1 className="page-title">{simulation.title}</h1>
        </div>
        <button
          className="button button--ghost"
          type="button"
          aria-pressed={favorite}
          onClick={() => progressStore.toggleFavorite(simulation.id)}
        >
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Favorited' : 'Favorite'}
        </button>
      </section>
      <SimulationErrorBoundary>
        <Suspense fallback={<SimulationLoading />}>
          <LazySimulation />
        </Suspense>
      </SimulationErrorBoundary>
    </main>
  )
}
