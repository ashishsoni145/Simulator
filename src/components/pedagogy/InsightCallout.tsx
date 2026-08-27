import type { ReactNode } from 'react'

/**
 * A highlighted aside. Four kinds, because they carry genuinely different weight:
 *
 * - `insight` — "notice that…", the thing the simulation exists to show
 * - `misconception` — a wrong belief students actually hold, named and corrected
 * - `warning` — a limit of the model, e.g. "this ignores air resistance"
 * - `tip` — how to drive the controls to see something
 *
 * The kind is also announced to screen readers, so the distinction is not carried
 * by colour alone.
 */

export type CalloutKind = 'insight' | 'misconception' | 'warning' | 'tip'

const KIND_LABEL: Record<CalloutKind, string> = {
  insight: 'Insight',
  misconception: 'Common misconception',
  warning: 'Limit of this model',
  tip: 'Try this'
}

const KIND_GLYPH: Record<CalloutKind, string> = {
  insight: '◆',
  misconception: '✕',
  warning: '!',
  tip: '▸'
}

export interface InsightCalloutProps {
  kind?: CalloutKind
  /** Overrides the default heading for the kind. */
  title?: string
  children: ReactNode
  className?: string
}

export default function InsightCallout({
  kind = 'insight',
  title,
  children,
  className
}: InsightCalloutProps) {
  const heading = title ?? KIND_LABEL[kind]
  return (
    <aside className={`callout callout--${kind}${className ? ` ${className}` : ''}`}>
      <p className="callout__head">
        <span className="callout__glyph" aria-hidden="true">
          {KIND_GLYPH[kind]}
        </span>
        <span className="callout__kind">{heading}</span>
        <span className="visually-hidden">{`(${KIND_LABEL[kind]})`}</span>
      </p>
      <div className="callout__body">{children}</div>
    </aside>
  )
}
