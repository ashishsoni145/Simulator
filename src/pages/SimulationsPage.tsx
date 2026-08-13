import SimulationCard from '../components/cards/SimulationCard'
import { simulations } from '../data/curriculum'

export default function SimulationsPage({ type = 'simulation' }: { type?: 'simulation' | 'experiment' }) {
  const items = simulations.filter((simulation) => simulation.type === type)
  return (
    <main className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">{type === 'experiment' ? 'Virtual experiments' : 'Simulation index'}</p>
          <h1 className="page-title">{type === 'experiment' ? 'Experiments' : 'Simulations'}</h1>
          <p className="muted">Lazy-loaded interactive artifacts. WebGL canvases initialize only when opened.</p>
        </div>
      </section>
      <div className="grid grid--3">
        {items.map((simulation) => (
          <SimulationCard key={simulation.id} simulation={simulation} />
        ))}
      </div>
    </main>
  )
}
