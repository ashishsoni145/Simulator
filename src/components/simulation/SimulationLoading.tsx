import Galaxy from '../Galaxy/Galaxy'

export default function SimulationLoading() {
  return (
    <div className="loading-state glass">
      <Galaxy density={0.65} glowIntensity={0.35} hueShift={220} starSpeed={0.2} transparent />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="loading-pulse" />
        <h2>Preparing your laboratory...</h2>
        <p className="muted">Loading the simulation engine and controls.</p>
      </div>
    </div>
  )
}
