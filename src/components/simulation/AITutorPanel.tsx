import type { ReactNode } from 'react'

export default function AITutorPanel({ context }: { context: Record<string, ReactNode> }) {
  return (
    <div className="card glass">
      <h3>Ask Science AI</h3>
      <p className="muted">
        AI backend is not configured. This panel is wired to carry active simulation context when an API is added.
      </p>
      <div className="simulation-card__meta">
        {Object.entries(context).map(([key, value]) => (
          <span className="chip" key={key}>
            {key}: {value}
          </span>
        ))}
      </div>
      <button className="button button--ghost" type="button" disabled>
        Connect AI backend
      </button>
    </div>
  )
}
