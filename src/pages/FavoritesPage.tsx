import SimulationCard from '../components/cards/SimulationCard'
import Galaxy from '../components/Galaxy/Galaxy'
import { simulations } from '../data/curriculum'
import { useProgressStore } from '../state/progressStore'

export default function FavoritesPage() {
  const progress = useProgressStore()
  const favorites = simulations.filter((simulation) => progress.favorites.includes(simulation.id))

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Persistent local state</p>
          <h1 className="page-title">Favorites</h1>
        </div>
      </section>
      {favorites.length > 0 ? (
        <div className="grid grid--3">
          {favorites.map((simulation) => (
            <SimulationCard key={simulation.id} simulation={simulation} />
          ))}
        </div>
      ) : (
        <div className="empty-state glass">
          <Galaxy density={0.7} glowIntensity={0.25} hueShift={220} transparent />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2>No favorites yet</h2>
            <p className="muted">Favorite simulations from cards or simulation pages to collect them here.</p>
          </div>
        </div>
      )}
    </main>
  )
}
