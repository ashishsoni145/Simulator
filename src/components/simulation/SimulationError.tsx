export default function SimulationError({ message = 'The simulation could not be loaded.' }: { message?: string }) {
  return (
    <div className="error-state glass">
      <div>
        <h2>Simulation error</h2>
        <p className="muted">{message}</p>
        <button className="button button--ghost" type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    </div>
  )
}
