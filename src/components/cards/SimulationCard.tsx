import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { SimulationMeta } from '../../data/curriculum'
import { progressStore, useProgressStore } from '../../state/progressStore'

export default function SimulationCard({ simulation }: { simulation: SimulationMeta }) {
  const progress = useProgressStore()
  const favorite = progress.favorites.includes(simulation.id)

  return (
    <article className="simulation-card glass">
      <div>
        <p className="eyebrow">
          {simulation.subject} · Class {simulation.classLevel}
        </p>
        <h3>{simulation.title}</h3>
        <p>{simulation.description}</p>
        <div className="simulation-card__meta">
          <span className="chip">{simulation.difficulty}</span>
          <span className="chip">{simulation.type}</span>
          {simulation.tags.slice(0, 2).map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="simulation-card__actions">
        <Link className="button button--primary" to={`/lab/simulations/${simulation.id}`}>
          Launch
        </Link>
        <button
          className="icon-button"
          type="button"
          aria-label={favorite ? `Remove ${simulation.title} from favorites` : `Add ${simulation.title} to favorites`}
          aria-pressed={favorite}
          onClick={() => progressStore.toggleFavorite(simulation.id)}
        >
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  )
}
