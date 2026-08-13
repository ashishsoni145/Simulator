import type { ReactNode } from 'react'
import { AlertTriangle, Maximize2 } from 'lucide-react'

export interface SimulationMetric {
  label: string
  value: string
}

interface SimulationShellProps {
  title: string
  subtitle: string
  stage: ReactNode
  controls: ReactNode
  metrics: SimulationMetric[]
  toolbar?: ReactNode
}

export default function SimulationShell({ title, subtitle, stage, controls, metrics, toolbar }: SimulationShellProps) {
  const requestFullscreen = () => {
    const target = document.querySelector('.simulation-shell')
    if (target instanceof HTMLElement && target.requestFullscreen) {
      void target.requestFullscreen()
    }
  }

  return (
    <section className="simulation-shell glass" aria-label={`${title} simulation`}>
      <header className="simulation-shell__header">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h1 className="page-title">{title}</h1>
        </div>
        <div className="toolbar">
          {toolbar}
          <button className="icon-button" type="button" aria-label="Fullscreen simulation" onClick={requestFullscreen}>
            <Maximize2 size={18} />
          </button>
        </div>
      </header>
      <div className="simulation-shell__body">
        <div className="simulation-stage">{stage}</div>
        <aside className="controls-panel" aria-label="Simulation controls">
          {controls}
        </aside>
      </div>
      <footer className="simulation-shell__metrics">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </footer>
    </section>
  )
}

export function WebGLFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="error-state glass">
      <div>
        <AlertTriangle aria-hidden />
        <h2>3D engine unavailable</h2>
        <p className="muted">Your browser could not initialize WebGL.</p>
        {onRetry ? (
          <button className="button button--ghost" type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    </div>
  )
}
